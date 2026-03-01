// ============================================================
// Punch Definitions — Jab, Cross, Hook, Uppercut
// ============================================================

import { PunchDef, PunchType } from '../fighters/types';

export const PUNCH_DEFS: Record<PunchType, PunchDef> = {
    jab: {
        type: 'jab',
        baseDamage: 5,
        speed: 8,       // fastest
        range: 35,
        staminaCost: 5,
        knockback: 2,
        stunFrames: 4,
    },
    cross: {
        type: 'cross',
        baseDamage: 10,
        speed: 14,
        range: 40,
        staminaCost: 10,
        knockback: 5,
        stunFrames: 8,
    },
    hook: {
        type: 'hook',
        baseDamage: 15,
        speed: 20,
        range: 38,
        staminaCost: 15,
        knockback: 8,
        stunFrames: 12,
    },
    uppercut: {
        type: 'uppercut',
        baseDamage: 25,
        speed: 28,      // slowest
        range: 30,      // shortest range — need to be close
        staminaCost: 25,
        knockback: 12,
        stunFrames: 18,
    },
};

/**
 * Calculate actual damage given fighter power stat and optional combo multiplier
 */
export function calculateDamage(
    punch: PunchDef,
    attackerPower: number,
    defenderDefense: number,
    comboMultiplier: number = 1.0,
    isBlocking: boolean = false,
): number {
    const rawDamage = punch.baseDamage * attackerPower * comboMultiplier;
    const blockReduction = isBlocking ? 0.25 : 1.0;
    const defenseReduction = 1 / defenderDefense;
    return Math.max(1, Math.floor(rawDamage * blockReduction * defenseReduction));
}

/**
 * Calculate actual punch speed (in frames) given fighter punchSpeed stat
 */
export function calculatePunchSpeed(punch: PunchDef, punchSpeedStat: number): number {
    return Math.max(4, Math.floor(punch.speed / punchSpeedStat));
}
