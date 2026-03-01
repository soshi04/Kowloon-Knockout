// ============================================================
// AI Opponent Logic
// ============================================================

import { Fighter, FighterState, PunchType, RING_LEFT, RING_RIGHT } from '../fighters/types';
import { PUNCH_DEFS, calculatePunchSpeed } from '../combat/punches';

interface AIState {
    actionCooldown: number;
    currentAction: 'idle' | 'approach' | 'attack' | 'retreat' | 'block';
    actionTimer: number;
    difficulty: number; // 0-1, affects reaction time and aggression
    nextPunch: PunchType | null;
    comboIndex: number;
    patternCooldown: number;
}

const AI_COMBOS: PunchType[][] = [
    ['jab', 'cross'],
    ['jab', 'jab', 'cross'],
    ['jab', 'cross', 'hook'],
    ['cross', 'hook'],
    ['jab', 'uppercut'],
];

export function createAIState(difficulty: number = 0.5): AIState {
    return {
        actionCooldown: 0,
        currentAction: 'idle',
        actionTimer: 0,
        difficulty: Math.max(0, Math.min(1, difficulty)),
        nextPunch: null,
        comboIndex: -1,
        patternCooldown: 0,
    };
}

/**
 * Update AI decision-making. Returns desired movement and punch action.
 */
export function updateAI(
    ai: AIState,
    opponent: Fighter,
    player: Fighter,
): { moveDir: number; punch: PunchType | null; block: boolean } {
    let moveDir = 0;
    let punch: PunchType | null = null;
    let block = false;

    if (opponent.state === 'knockedOut' || opponent.state === 'stunned') {
        return { moveDir: 0, punch: null, block: false };
    }

    // Decrease cooldowns
    if (ai.actionCooldown > 0) ai.actionCooldown--;
    if (ai.patternCooldown > 0) ai.patternCooldown--;
    ai.actionTimer++;

    const distance = Math.abs(opponent.x - player.x);
    const isPlayerPunching = player.state === 'punching';
    const isInRange = distance < 42;
    const isCloseRange = distance < 32;

    // React to player punches
    if (isPlayerPunching && isInRange && Math.random() < ai.difficulty * 0.6) {
        ai.currentAction = 'block';
        ai.actionTimer = 0;
        ai.actionCooldown = 15;
    }

    // Decision-making based on current action
    switch (ai.currentAction) {
        case 'idle':
            if (ai.actionTimer > 30 - ai.difficulty * 20) {
                // Decide next action
                if (distance > 60) {
                    ai.currentAction = 'approach';
                } else if (isInRange && Math.random() < 0.4 + ai.difficulty * 0.3) {
                    ai.currentAction = 'attack';
                    // Pick a combo or single punch
                    if (Math.random() < 0.5 + ai.difficulty * 0.3) {
                        const comboIdx = Math.floor(Math.random() * AI_COMBOS.length);
                        ai.comboIndex = 0;
                        ai.nextPunch = AI_COMBOS[comboIdx][0];
                        ai.patternCooldown = AI_COMBOS[comboIdx].length;
                    } else {
                        ai.nextPunch = pickSinglePunch(distance, ai.difficulty);
                        ai.comboIndex = -1;
                    }
                } else if (Math.random() < 0.3) {
                    ai.currentAction = 'retreat';
                } else {
                    ai.currentAction = 'approach';
                }
                ai.actionTimer = 0;
            }
            break;

        case 'approach':
            // Move toward player
            if (player.x > opponent.x) {
                moveDir = 1;
            } else {
                moveDir = -1;
            }
            // Switch to attack when in range
            if (isInRange && ai.actionCooldown <= 0) {
                ai.currentAction = 'attack';
                ai.nextPunch = pickSinglePunch(distance, ai.difficulty);
                ai.actionTimer = 0;
            }
            // Give up approaching after some time
            if (ai.actionTimer > 60) {
                ai.currentAction = 'idle';
                ai.actionTimer = 0;
            }
            break;

        case 'attack':
            if (ai.actionCooldown <= 0 && opponent.state === 'idle') {
                if (ai.nextPunch && isInRange) {
                    punch = ai.nextPunch;

                    // If doing a combo, advance to next punch
                    if (ai.comboIndex >= 0) {
                        const currentCombo = AI_COMBOS.find(c => c[ai.comboIndex] === ai.nextPunch);
                        if (currentCombo && ai.comboIndex + 1 < currentCombo.length) {
                            ai.comboIndex++;
                            ai.nextPunch = currentCombo[ai.comboIndex];
                            ai.actionCooldown = Math.floor(10 / (0.5 + ai.difficulty * 0.5));
                        } else {
                            ai.nextPunch = null;
                            ai.comboIndex = -1;
                            ai.currentAction = 'retreat';
                            ai.actionTimer = 0;
                            ai.actionCooldown = 20;
                        }
                    } else {
                        ai.nextPunch = null;
                        ai.currentAction = Math.random() < 0.4 ? 'retreat' : 'idle';
                        ai.actionTimer = 0;
                        ai.actionCooldown = Math.floor(25 - ai.difficulty * 15);
                    }
                } else if (!isInRange) {
                    // Need to get closer
                    ai.currentAction = 'approach';
                    ai.actionTimer = 0;
                }
            }

            if (ai.actionTimer > 90) {
                ai.currentAction = 'idle';
                ai.actionTimer = 0;
            }
            break;

        case 'retreat':
            // Move away from player
            if (player.x > opponent.x) {
                moveDir = -1;
            } else {
                moveDir = 1;
            }
            // Clamp to ring
            if (opponent.x < RING_LEFT + 10 || opponent.x > RING_RIGHT - 10) {
                ai.currentAction = 'idle';
                ai.actionTimer = 0;
            }
            if (ai.actionTimer > 40) {
                ai.currentAction = 'idle';
                ai.actionTimer = 0;
            }
            break;

        case 'block':
            block = true;
            if (ai.actionTimer > 20 || !isPlayerPunching) {
                ai.currentAction = Math.random() < 0.5 ? 'attack' : 'retreat';
                ai.nextPunch = pickSinglePunch(distance, ai.difficulty);
                ai.actionTimer = 0;
            }
            break;
    }

    return { moveDir, punch, block };
}

function pickSinglePunch(distance: number, difficulty: number): PunchType {
    // Weight punches based on distance and difficulty
    if (distance < 32) {
        // Close range — uppercuts and hooks more likely
        const roll = Math.random();
        if (roll < 0.3 * difficulty) return 'uppercut';
        if (roll < 0.5) return 'hook';
        if (roll < 0.8) return 'cross';
        return 'jab';
    } else {
        // Medium range — jabs and crosses
        const roll = Math.random();
        if (roll < 0.1 * difficulty) return 'hook';
        if (roll < 0.4) return 'cross';
        return 'jab';
    }
}
