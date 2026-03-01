// ============================================================
// AI Opponent Logic — Class-specific fighting styles
// ============================================================

import { Fighter, FighterClass, PunchType, RING_LEFT, RING_RIGHT } from '../fighters/types';

interface AIState {
    actionCooldown: number;
    currentAction: 'idle' | 'approach' | 'attack' | 'retreat' | 'block';
    actionTimer: number;
    difficulty: number; // 0-1, affects reaction time and aggression
    nextPunch: PunchType | null;
    comboIndex: number;
    patternCooldown: number;
    fighterClass: FighterClass;
}

// Class-specific combos
const POWER_COMBOS: PunchType[][] = [
    ['cross', 'hook'],
    ['jab', 'cross', 'hook'],
    ['hook', 'uppercut'],
    ['cross', 'hook', 'uppercut'],
    ['jab', 'uppercut'],
];

const SPEED_COMBOS: PunchType[][] = [
    ['jab', 'jab', 'cross'],
    ['jab', 'cross', 'jab'],
    ['jab', 'jab', 'jab', 'cross'],
    ['jab', 'cross', 'hook'],
    ['cross', 'jab', 'cross'],
];

const RESISTANCE_COMBOS: PunchType[][] = [
    ['jab', 'cross'],
    ['cross', 'hook'],
    ['jab', 'jab', 'cross'],
    ['jab', 'cross', 'hook'],
    ['hook', 'cross'],
];

function getCombos(fighterClass: FighterClass): PunchType[][] {
    switch (fighterClass) {
        case 'power': return POWER_COMBOS;
        case 'speed': return SPEED_COMBOS;
        case 'resistance': return RESISTANCE_COMBOS;
    }
}

export function createAIState(difficulty: number = 0.5, fighterClass: FighterClass = 'power'): AIState {
    return {
        actionCooldown: 0,
        currentAction: 'approach',
        actionTimer: 0,
        difficulty: Math.max(0, Math.min(1, difficulty)),
        nextPunch: null,
        comboIndex: -1,
        patternCooldown: 0,
        fighterClass,
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
    if (opponent.state === 'knockedOut' || opponent.state === 'stunned') {
        return { moveDir: 0, punch: null, block: false };
    }

    switch (ai.fighterClass) {
        case 'power': return updatePowerAI(ai, opponent, player);
        case 'speed': return updateSpeedAI(ai, opponent, player);
        case 'resistance': return updateResistanceAI(ai, opponent, player);
    }
}

// ============================================================
// POWER — Extremely aggressive, always pushing forward
// ============================================================
function updatePowerAI(
    ai: AIState, opponent: Fighter, player: Fighter,
): { moveDir: number; punch: PunchType | null; block: boolean } {
    let moveDir = 0;
    let punch: PunchType | null = null;
    let block = false;

    if (ai.actionCooldown > 0) ai.actionCooldown--;
    if (ai.patternCooldown > 0) ai.patternCooldown--;
    ai.actionTimer++;

    const distance = Math.abs(opponent.x - player.x);
    const isPlayerPunching = player.state === 'punching';
    const isInRange = distance < 42;
    const combos = getCombos('power');

    // Power rarely blocks — only when very low health
    const lowHealth = opponent.health / opponent.stats.maxHealth < 0.2;
    if (isPlayerPunching && isInRange && lowHealth && Math.random() < 0.2) {
        ai.currentAction = 'block';
        ai.actionTimer = 0;
        ai.actionCooldown = 2;
    }

    // Always move toward player regardless of state
    if (!isInRange) {
        moveDir = player.x > opponent.x ? 1 : -1;
    }

    switch (ai.currentAction) {
        case 'idle':
            // Power never idles — immediately attack or approach
            if (isInRange && ai.actionCooldown <= 0) {
                ai.currentAction = 'attack';
                if (Math.random() < 0.75) {
                    const comboIdx = Math.floor(Math.random() * combos.length);
                    ai.comboIndex = 0;
                    ai.nextPunch = combos[comboIdx][0];
                    ai.patternCooldown = combos[comboIdx].length;
                } else {
                    ai.nextPunch = pickPowerPunch(distance);
                    ai.comboIndex = -1;
                }
            } else {
                ai.currentAction = 'approach';
            }
            ai.actionTimer = 0;
            break;

        case 'approach':
            moveDir = player.x > opponent.x ? 1 : -1;
            if (isInRange && ai.actionCooldown <= 0) {
                ai.currentAction = 'attack';
                ai.nextPunch = pickPowerPunch(distance);
                ai.actionTimer = 0;
            }
            break;

        case 'attack':
            if (ai.actionCooldown <= 0 && opponent.state === 'idle') {
                if (ai.nextPunch && isInRange) {
                    punch = ai.nextPunch;

                    if (ai.comboIndex >= 0) {
                        const currentCombo = combos.find(c => c[ai.comboIndex] === ai.nextPunch);
                        if (currentCombo && ai.comboIndex + 1 < currentCombo.length) {
                            ai.comboIndex++;
                            ai.nextPunch = currentCombo[ai.comboIndex];
                            ai.actionCooldown = 4;
                        } else {
                            // Combo done — immediately start another
                            ai.comboIndex = -1;
                            ai.nextPunch = pickPowerPunch(distance);
                            ai.actionCooldown = 5;
                        }
                    } else {
                        // Single punch done — throw another
                        ai.nextPunch = pickPowerPunch(distance);
                        ai.actionCooldown = 5;
                    }
                } else if (!isInRange) {
                    ai.currentAction = 'approach';
                    ai.actionTimer = 0;
                }
            }

            if (ai.actionTimer > 40) {
                ai.currentAction = 'approach';
                ai.actionTimer = 0;
            }
            break;

        case 'retreat':
            ai.currentAction = 'approach';
            ai.actionTimer = 0;
            break;

        case 'block':
            block = true;
            if (ai.actionTimer > 5 || !isPlayerPunching) {
                ai.currentAction = 'attack';
                ai.nextPunch = pickPowerPunch(distance);
                ai.actionTimer = 0;
                ai.actionCooldown = 2;
            }
            break;
    }

    return { moveDir, punch, block };
}

function pickPowerPunch(distance: number): PunchType {
    if (distance < 32) {
        const roll = Math.random();
        if (roll < 0.35) return 'uppercut';
        if (roll < 0.65) return 'hook';
        return 'cross';
    } else {
        const roll = Math.random();
        if (roll < 0.4) return 'cross';
        if (roll < 0.7) return 'hook';
        return 'jab';
    }
}

// ============================================================
// SPEED — Counter-striker, but still aggressive
// ============================================================
function updateSpeedAI(
    ai: AIState, opponent: Fighter, player: Fighter,
): { moveDir: number; punch: PunchType | null; block: boolean } {
    let moveDir = 0;
    let punch: PunchType | null = null;
    let block = false;

    if (ai.actionCooldown > 0) ai.actionCooldown--;
    if (ai.patternCooldown > 0) ai.patternCooldown--;
    ai.actionTimer++;

    const distance = Math.abs(opponent.x - player.x);
    const isPlayerPunching = player.state === 'punching';
    const isPlayerHit = player.state === 'hit' || player.state === 'stunned';
    const isInRange = distance < 42;
    const combos = getCombos('speed');

    // Speed blocks well then immediately counters
    if (isPlayerPunching && isInRange && Math.random() < 0.55) {
        ai.currentAction = 'block';
        ai.actionTimer = 0;
        ai.actionCooldown = 2;
    }

    switch (ai.currentAction) {
        case 'idle':
            if (ai.actionTimer > 6) {
                if (isPlayerHit && distance < 60) {
                    // Player is vulnerable — rush in with combo
                    ai.currentAction = 'attack';
                    const comboIdx = Math.floor(Math.random() * combos.length);
                    ai.comboIndex = 0;
                    ai.nextPunch = combos[comboIdx][0];
                    ai.patternCooldown = combos[comboIdx].length;
                } else if (isInRange && ai.actionCooldown <= 0) {
                    // In range — attack with quick combos
                    ai.currentAction = 'attack';
                    if (Math.random() < 0.7) {
                        const comboIdx = Math.floor(Math.random() * combos.length);
                        ai.comboIndex = 0;
                        ai.nextPunch = combos[comboIdx][0];
                    } else {
                        ai.nextPunch = pickSpeedPunch(distance);
                        ai.comboIndex = -1;
                    }
                } else if (distance > 60) {
                    ai.currentAction = 'approach';
                } else {
                    // Circle at medium distance — approach to get in range
                    ai.currentAction = 'approach';
                }
                ai.actionTimer = 0;
            }
            break;

        case 'approach':
            if (player.x > opponent.x) {
                moveDir = 1;
            } else {
                moveDir = -1;
            }
            if (isInRange && ai.actionCooldown <= 0) {
                ai.currentAction = 'attack';
                const comboIdx = Math.floor(Math.random() * combos.length);
                ai.comboIndex = 0;
                ai.nextPunch = combos[comboIdx][0];
                ai.actionTimer = 0;
            }
            if (ai.actionTimer > 35) {
                ai.currentAction = 'idle';
                ai.actionTimer = 0;
            }
            break;

        case 'attack':
            if (ai.actionCooldown <= 0 && opponent.state === 'idle') {
                if (ai.nextPunch && isInRange) {
                    punch = ai.nextPunch;

                    if (ai.comboIndex >= 0) {
                        const currentCombo = combos.find(c => c[ai.comboIndex] === ai.nextPunch);
                        if (currentCombo && ai.comboIndex + 1 < currentCombo.length) {
                            ai.comboIndex++;
                            ai.nextPunch = currentCombo[ai.comboIndex];
                            ai.actionCooldown = 3; // Lightning fast combos
                        } else {
                            ai.nextPunch = null;
                            ai.comboIndex = -1;
                            // Brief retreat then come back in
                            ai.currentAction = 'retreat';
                            ai.actionTimer = 0;
                            ai.actionCooldown = 3;
                        }
                    } else {
                        ai.nextPunch = null;
                        // Quick retreat after poke
                        ai.currentAction = 'retreat';
                        ai.actionTimer = 0;
                        ai.actionCooldown = 4;
                    }
                } else if (!isInRange) {
                    ai.currentAction = 'approach';
                    ai.actionTimer = 0;
                }
            }

            if (ai.actionTimer > 40) {
                ai.currentAction = 'approach';
                ai.actionTimer = 0;
            }
            break;

        case 'retreat':
            if (player.x > opponent.x) {
                moveDir = -1;
            } else {
                moveDir = 1;
            }
            // Counter if player chases and attacks
            if (isPlayerPunching && isInRange && ai.actionCooldown <= 0) {
                ai.currentAction = 'attack';
                const comboIdx = Math.floor(Math.random() * combos.length);
                ai.comboIndex = 0;
                ai.nextPunch = combos[comboIdx][0];
                ai.actionTimer = 0;
                break;
            }
            if (opponent.x < RING_LEFT + 15 || opponent.x > RING_RIGHT - 15) {
                ai.currentAction = 'attack';
                ai.nextPunch = pickSpeedPunch(distance);
                ai.actionTimer = 0;
            }
            // Short retreats — come back in quickly
            if (ai.actionTimer > 15) {
                ai.currentAction = 'approach';
                ai.actionTimer = 0;
            }
            break;

        case 'block':
            block = true;
            if (ai.actionTimer > 8 || !isPlayerPunching) {
                // Instant counter-attack after blocking
                ai.currentAction = 'attack';
                const comboIdx = Math.floor(Math.random() * combos.length);
                ai.comboIndex = 0;
                ai.nextPunch = combos[comboIdx][0];
                ai.actionTimer = 0;
                ai.actionCooldown = 1;
            }
            break;
    }

    return { moveDir, punch, block };
}

function pickSpeedPunch(distance: number): PunchType {
    const roll = Math.random();
    if (distance < 32) {
        if (roll < 0.4) return 'jab';
        if (roll < 0.7) return 'cross';
        return 'hook';
    } else {
        if (roll < 0.6) return 'jab';
        return 'cross';
    }
}

// ============================================================
// RESISTANCE — Stationary tank, always willing to trade blows
// ============================================================
function updateResistanceAI(
    ai: AIState, opponent: Fighter, player: Fighter,
): { moveDir: number; punch: PunchType | null; block: boolean } {
    let moveDir = 0;
    let punch: PunchType | null = null;
    let block = false;

    if (ai.actionCooldown > 0) ai.actionCooldown--;
    if (ai.patternCooldown > 0) ai.patternCooldown--;
    ai.actionTimer++;

    const distance = Math.abs(opponent.x - player.x);
    const isPlayerPunching = player.state === 'punching';
    const isInRange = distance < 42;
    const combos = getCombos('resistance');

    // Resistance blocks sometimes but prefers to trade
    if (isPlayerPunching && isInRange && Math.random() < 0.3) {
        ai.currentAction = 'block';
        ai.actionTimer = 0;
        ai.actionCooldown = 3;
    }

    switch (ai.currentAction) {
        case 'idle':
            if (ai.actionTimer > 8) {
                if (isInRange && ai.actionCooldown <= 0) {
                    ai.currentAction = 'attack';
                    if (Math.random() < 0.6) {
                        const comboIdx = Math.floor(Math.random() * combos.length);
                        ai.comboIndex = 0;
                        ai.nextPunch = combos[comboIdx][0];
                        ai.patternCooldown = combos[comboIdx].length;
                    } else {
                        ai.nextPunch = pickResistancePunch(distance);
                        ai.comboIndex = -1;
                    }
                } else if (distance > 48) {
                    ai.currentAction = 'approach';
                }
                ai.actionTimer = 0;
            }
            break;

        case 'approach':
            if (player.x > opponent.x) {
                moveDir = 1;
            } else {
                moveDir = -1;
            }
            if (isInRange && ai.actionCooldown <= 0) {
                ai.currentAction = 'attack';
                ai.nextPunch = pickResistancePunch(distance);
                ai.actionTimer = 0;
            }
            if (ai.actionTimer > 50) {
                ai.currentAction = 'idle';
                ai.actionTimer = 0;
            }
            break;

        case 'attack':
            if (ai.actionCooldown <= 0 && opponent.state === 'idle') {
                if (ai.nextPunch && isInRange) {
                    punch = ai.nextPunch;

                    if (ai.comboIndex >= 0) {
                        const currentCombo = combos.find(c => c[ai.comboIndex] === ai.nextPunch);
                        if (currentCombo && ai.comboIndex + 1 < currentCombo.length) {
                            ai.comboIndex++;
                            ai.nextPunch = currentCombo[ai.comboIndex];
                            ai.actionCooldown = 6;
                        } else {
                            // Combo done — throw more punches
                            ai.comboIndex = -1;
                            ai.nextPunch = pickResistancePunch(distance);
                            ai.actionCooldown = 6;
                        }
                    } else {
                        // Single punch — keep swinging
                        ai.nextPunch = pickResistancePunch(distance);
                        ai.actionCooldown = 7;
                    }
                } else if (!isInRange) {
                    ai.currentAction = 'approach';
                    ai.actionTimer = 0;
                }
            }

            // Trade hits — if player is punching us, punch back immediately
            if (isPlayerPunching && isInRange && ai.actionCooldown <= 0 && opponent.state === 'idle') {
                punch = pickResistancePunch(distance);
                ai.actionCooldown = 4;
            }

            if (ai.actionTimer > 50) {
                ai.currentAction = 'idle';
                ai.actionTimer = 0;
            }
            break;

        case 'retreat':
            // Resistance never retreats
            ai.currentAction = 'idle';
            ai.actionTimer = 0;
            break;

        case 'block':
            block = true;
            if (ai.actionTimer > 10 || !isPlayerPunching) {
                ai.currentAction = 'attack';
                ai.nextPunch = pickResistancePunch(distance);
                ai.actionTimer = 0;
                ai.actionCooldown = 3;
            }
            break;
    }

    return { moveDir, punch, block };
}

function pickResistancePunch(distance: number): PunchType {
    const roll = Math.random();
    if (distance < 32) {
        if (roll < 0.3) return 'hook';
        if (roll < 0.6) return 'cross';
        if (roll < 0.8) return 'jab';
        return 'uppercut';
    } else {
        if (roll < 0.5) return 'jab';
        if (roll < 0.8) return 'cross';
        return 'hook';
    }
}
