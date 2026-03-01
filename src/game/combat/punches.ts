// ============================================================
// Punch Definitions — Jab, Cross, Hook, Uppercut
// ============================================================

import { PunchDef, PunchType } from '../fighters/types';

export const PUNCH_DEFS: Record<PunchType, PunchDef> = {
    jab: {
        type: 'jab',
        baseDamage: 5,
        speed: 8,       // fastest
        range: 35,      // quick straight punch
        staminaCost: 5,
        knockback: 2,
        stunFrames: 4,
    },
    cross: {
        type: 'cross',
        baseDamage: 10,
        speed: 14,
        range: 40,      // longest reach — full extension from rear hand
        staminaCost: 10,
        knockback: 5,
        stunFrames: 8,
    },
    hook: {
        type: 'hook',
        baseDamage: 15,
        speed: 20,
        range: 32,      // wide arc, shorter reach
        staminaCost: 15,
        knockback: 8,
        stunFrames: 12,
    },
    uppercut: {
        type: 'uppercut',
        baseDamage: 25,
        speed: 28,      // slowest
        range: 28,      // shortest range — need to be very close
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
 * Calculate actual punch speed (in frames) given fighter stats.
 * Both punchSpeed and moveSpeed contribute — faster fighters strike faster.
 */
export function calculatePunchSpeed(punch: PunchDef, punchSpeedStat: number, moveSpeed?: number): number {
    // moveSpeed contributes a 20% bonus to strike speed (baseline moveSpeed ~2.0)
    const moveSpeedBonus = moveSpeed ? 1 + (moveSpeed - 2.0) * 0.2 : 1;
    const effectiveSpeed = punchSpeedStat * moveSpeedBonus;
    return Math.max(4, Math.floor(punch.speed / effectiveSpeed));
}
