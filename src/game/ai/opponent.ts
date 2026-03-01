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
// POWER — Relentless brawler, charges in and unloads
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
    const isPlayerHit = player.state === 'hit' || player.state === 'stunned';
    const isInRange = distance < 42;
    const combos = getCombos('power');

    // Power rarely blocks — only when very low health
    const lowHealth = opponent.health / opponent.stats.maxHealth < 0.2;
    if (isPlayerPunching && isInRange && lowHealth && Math.random() < 0.2) {
        ai.currentAction = 'block';
        ai.actionTimer = 0;
        ai.actionCooldown = 2;
    }

    // Always press forward — power never stops advancing
    if (!isInRange) {
        moveDir = player.x > opponent.x ? 1 : -1;
    }

    switch (ai.currentAction) {
        case 'idle':
            // Power never idles — immediately attack or approach
            if (isInRange && ai.actionCooldown <= 0) {
                ai.currentAction = 'attack';
                // Lead with combos most of the time
                if (Math.random() < 0.8) {
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

            // Throw lunging punches while closing distance
            if (distance < 55 && distance > 36 && ai.actionCooldown <= 0 && Math.random() < 0.12) {
                punch = Math.random() < 0.6 ? 'jab' : 'cross';
                ai.actionCooldown = 6;
            }

            if (isInRange && ai.actionCooldown <= 0) {
                ai.currentAction = 'attack';
                // Always open with a combo on arrival
                const comboIdx = Math.floor(Math.random() * combos.length);
                ai.comboIndex = 0;
                ai.nextPunch = combos[comboIdx][0];
                ai.patternCooldown = combos[comboIdx].length;
                ai.actionTimer = 0;
            }
            break;

        case 'attack':
            // Keep advancing even while attacking
            if (!isInRange) {
                moveDir = player.x > opponent.x ? 1 : -1;
            }

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
                            // Combo done — chain into another combo or keep swinging
                            if (Math.random() < 0.45) {
                                const comboIdx = Math.floor(Math.random() * combos.length);
                                ai.comboIndex = 0;
                                ai.nextPunch = combos[comboIdx][0];
                                ai.patternCooldown = combos[comboIdx].length;
                            } else {
                                ai.comboIndex = -1;
                                ai.nextPunch = pickPowerPunch(distance);
                            }
                            ai.actionCooldown = 4;
                        }
                    } else {
                        // Single punch done — throw another
                        ai.nextPunch = pickPowerPunch(distance);
                        ai.actionCooldown = 4;
                    }
                } else if (!isInRange) {
                    ai.currentAction = 'approach';
                    ai.actionTimer = 0;
                }
            }

            // Punish vulnerable player with heavy shots
            if (isPlayerHit && isInRange && ai.actionCooldown <= 0 && opponent.state === 'idle') {
                punch = Math.random() < 0.5 ? 'uppercut' : 'hook';
                ai.actionCooldown = 3;
            }

            if (ai.actionTimer > 35) {
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
            if (ai.actionTimer > 4 || !isPlayerPunching) {
                ai.currentAction = 'attack';
                // Counter with a combo after blocking
                const comboIdx = Math.floor(Math.random() * combos.length);
                ai.comboIndex = 0;
                ai.nextPunch = combos[comboIdx][0];
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
// SPEED — Hit-and-run striker, darts in with rapid combos
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
    if (isPlayerPunching && isInRange && Math.random() < 0.5) {
        ai.currentAction = 'block';
        ai.actionTimer = 0;
        ai.actionCooldown = 2;
    }

    switch (ai.currentAction) {
        case 'idle':
            // Very short idle — speed is always looking for an opening
            if (ai.actionTimer > 3) {
                if (isPlayerHit && distance < 65) {
                    // Player is vulnerable — rush in with combo
                    ai.currentAction = 'attack';
                    const comboIdx = Math.floor(Math.random() * combos.length);
                    ai.comboIndex = 0;
                    ai.nextPunch = combos[comboIdx][0];
                    ai.patternCooldown = combos[comboIdx].length;
                } else if (isInRange && ai.actionCooldown <= 0) {
                    // In range — attack with quick combos
                    ai.currentAction = 'attack';
                    if (Math.random() < 0.75) {
                        const comboIdx = Math.floor(Math.random() * combos.length);
                        ai.comboIndex = 0;
                        ai.nextPunch = combos[comboIdx][0];
                    } else {
                        ai.nextPunch = pickSpeedPunch(distance);
                        ai.comboIndex = -1;
                    }
                } else {
                    // Always close distance — never hang back
                    ai.currentAction = 'approach';
                }
                ai.actionTimer = 0;
            }
            break;

        case 'approach':
            moveDir = player.x > opponent.x ? 1 : -1;

            // Throw quick jabs while darting in
            if (distance < 55 && distance > 36 && ai.actionCooldown <= 0 && Math.random() < 0.1) {
                punch = 'jab';
                ai.actionCooldown = 5;
            }

            if (isInRange && ai.actionCooldown <= 0) {
                ai.currentAction = 'attack';
                const comboIdx = Math.floor(Math.random() * combos.length);
                ai.comboIndex = 0;
                ai.nextPunch = combos[comboIdx][0];
                ai.actionTimer = 0;
            }
            // Don't spend too long approaching — switch to attack posture
            if (ai.actionTimer > 20) {
                ai.currentAction = 'attack';
                ai.nextPunch = pickSpeedPunch(distance);
                ai.comboIndex = -1;
                ai.actionTimer = 0;
            }
            break;

        case 'attack':
            // Close distance while attacking if out of range
            if (!isInRange) {
                moveDir = player.x > opponent.x ? 1 : -1;
            }

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
                            // Combo done — sometimes chain another, sometimes retreat briefly
                            if (Math.random() < 0.45) {
                                // Chain into another combo
                                const comboIdx = Math.floor(Math.random() * combos.length);
                                ai.comboIndex = 0;
                                ai.nextPunch = combos[comboIdx][0];
                                ai.patternCooldown = combos[comboIdx].length;
                                ai.actionCooldown = 3;
                            } else {
                                // Brief retreat then come back in
                                ai.nextPunch = null;
                                ai.comboIndex = -1;
                                ai.currentAction = 'retreat';
                                ai.actionTimer = 0;
                                ai.actionCooldown = 3;
                            }
                        }
                    } else {
                        // Single punch — follow up with more pressure
                        if (Math.random() < 0.6) {
                            ai.nextPunch = pickSpeedPunch(distance);
                            ai.actionCooldown = 4;
                        } else {
                            ai.currentAction = 'retreat';
                            ai.actionTimer = 0;
                            ai.actionCooldown = 3;
                        }
                    }
                } else if (!isInRange) {
                    ai.currentAction = 'approach';
                    ai.actionTimer = 0;
                }
            }

            // Punish vulnerable player — pile on with fast combos
            if (isPlayerHit && isInRange && ai.actionCooldown <= 0 && opponent.state === 'idle') {
                punch = pickSpeedPunch(distance);
                ai.actionCooldown = 2;
            }

            if (ai.actionTimer > 30) {
                ai.currentAction = 'approach';
                ai.actionTimer = 0;
            }
            break;

        case 'retreat':
            moveDir = player.x > opponent.x ? -1 : 1;

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
            // Very short retreats — dart back in quickly
            if (ai.actionTimer > 8) {
                ai.currentAction = 'approach';
                ai.actionTimer = 0;
            }
            break;

        case 'block':
            block = true;
            if (ai.actionTimer > 6 || !isPlayerPunching) {
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
// RESISTANCE — Forward-pressing tank, walks you down and trades
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
    const isPlayerHit = player.state === 'hit' || player.state === 'stunned';
    const isInRange = distance < 42;
    const combos = getCombos('resistance');

    // Resistance blocks rarely — prefers to trade and tank through hits
    if (isPlayerPunching && isInRange && Math.random() < 0.2) {
        ai.currentAction = 'block';
        ai.actionTimer = 0;
        ai.actionCooldown = 2;
    }

    // Always press forward when not in range — resistance walks you down
    if (!isInRange) {
        moveDir = player.x > opponent.x ? 1 : -1;
    }

    switch (ai.currentAction) {
        case 'idle':
            // Minimal idle time — resistance is always looking for a fight
            if (ai.actionTimer > 3) {
                if (isInRange && ai.actionCooldown <= 0) {
                    ai.currentAction = 'attack';
                    // Heavily favor combos to start exchanges
                    if (Math.random() < 0.75) {
                        const comboIdx = Math.floor(Math.random() * combos.length);
                        ai.comboIndex = 0;
                        ai.nextPunch = combos[comboIdx][0];
                        ai.patternCooldown = combos[comboIdx].length;
                    } else {
                        ai.nextPunch = pickResistancePunch(distance);
                        ai.comboIndex = -1;
                    }
                } else {
                    // Always approach — never sit still
                    ai.currentAction = 'approach';
                }
                ai.actionTimer = 0;
            }
            break;

        case 'approach':
            moveDir = player.x > opponent.x ? 1 : -1;

            // Throw jabs while closing distance to pressure the player
            if (distance < 55 && distance > 38 && ai.actionCooldown <= 0 && Math.random() < 0.15) {
                punch = 'jab';
                ai.actionCooldown = 8;
            }

            if (isInRange && ai.actionCooldown <= 0) {
                ai.currentAction = 'attack';
                // Start with a combo immediately on arrival
                const comboIdx = Math.floor(Math.random() * combos.length);
                ai.comboIndex = 0;
                ai.nextPunch = combos[comboIdx][0];
                ai.patternCooldown = combos[comboIdx].length;
                ai.actionTimer = 0;
            }
            // Short approach patience — switch to attack posture quickly
            if (ai.actionTimer > 25) {
                ai.currentAction = 'attack';
                ai.nextPunch = pickResistancePunch(distance);
                ai.comboIndex = -1;
                ai.actionTimer = 0;
            }
            break;

        case 'attack':
            // Keep pressing forward even while attacking
            if (!isInRange) {
                moveDir = player.x > opponent.x ? 1 : -1;
            }

            if (ai.actionCooldown <= 0 && opponent.state === 'idle') {
                if (ai.nextPunch && isInRange) {
                    punch = ai.nextPunch;

                    if (ai.comboIndex >= 0) {
                        const currentCombo = combos.find(c => c[ai.comboIndex] === ai.nextPunch);
                        if (currentCombo && ai.comboIndex + 1 < currentCombo.length) {
                            ai.comboIndex++;
                            ai.nextPunch = currentCombo[ai.comboIndex];
                            ai.actionCooldown = 4; // Tighter combo timing
                        } else {
                            // Combo done — immediately start another or keep swinging
                            if (Math.random() < 0.5) {
                                const comboIdx = Math.floor(Math.random() * combos.length);
                                ai.comboIndex = 0;
                                ai.nextPunch = combos[comboIdx][0];
                                ai.patternCooldown = combos[comboIdx].length;
                            } else {
                                ai.comboIndex = -1;
                                ai.nextPunch = pickResistancePunch(distance);
                            }
                            ai.actionCooldown = 5;
                        }
                    } else {
                        // Single punch — keep swinging with short gaps
                        ai.nextPunch = pickResistancePunch(distance);
                        ai.actionCooldown = 5;
                    }
                } else if (!isInRange) {
                    ai.currentAction = 'approach';
                    ai.actionTimer = 0;
                }
            }

            // Trade hits — if player is punching us, punch back immediately
            if (isPlayerPunching && isInRange && ai.actionCooldown <= 0 && opponent.state === 'idle') {
                punch = pickResistancePunch(distance);
                ai.actionCooldown = 3;
            }

            // Punish vulnerable player — rush in with heavy punches
            if (isPlayerHit && isInRange && ai.actionCooldown <= 0 && opponent.state === 'idle') {
                punch = Math.random() < 0.4 ? 'hook' : 'cross';
                ai.actionCooldown = 3;
            }

            if (ai.actionTimer > 35) {
                // Brief reset then right back to approaching
                ai.currentAction = 'approach';
                ai.actionTimer = 0;
            }
            break;

        case 'retreat':
            // Resistance never retreats — push forward instead
            ai.currentAction = 'approach';
            ai.actionTimer = 0;
            break;

        case 'block':
            block = true;
            // Very short block window then immediate counter
            if (ai.actionTimer > 6 || !isPlayerPunching) {
                ai.currentAction = 'attack';
                // Counter with a combo after blocking
                const comboIdx = Math.floor(Math.random() * combos.length);
                ai.comboIndex = 0;
                ai.nextPunch = combos[comboIdx][0];
                ai.actionTimer = 0;
                ai.actionCooldown = 2;
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
