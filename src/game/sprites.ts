// ============================================================
// Pixel Art Sprite System — Draws fighters programmatically
// ============================================================

import { CANVAS_HEIGHT, CANVAS_WIDTH, Fighter, FighterState, GROUND_Y } from '../fighters/types';

// Each sprite is a grid of pixel colors. null = transparent.
type SpriteFrame = (string | null)[][];

/**
 * Draw a fighter sprite onto the canvas context.
 */
export function drawFighter(
    ctx: CanvasRenderingContext2D,
    fighter: Fighter,
    frame: number,
): void {
    const sprite = getFighterSprite(fighter, frame);
    const pixelSize = 2;
    const spriteWidth = sprite[0].length * pixelSize;
    const spriteHeight = sprite.length * pixelSize;

    ctx.save();

    // Flip horizontally if facing left
    if (!fighter.facingRight) {
        ctx.translate(fighter.x + spriteWidth / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-(fighter.x + spriteWidth / 2), 0);
    }

    const drawX = fighter.x - spriteWidth / 2;
    const drawY = fighter.y - spriteHeight;

    for (let row = 0; row < sprite.length; row++) {
        for (let col = 0; col < sprite[row].length; col++) {
            const color = sprite[row][col];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(
                    drawX + col * pixelSize,
                    drawY + row * pixelSize,
                    pixelSize,
                    pixelSize
                );
            }
        }
    }

    ctx.restore();
}

/**
 * Get the appropriate sprite for the fighter's current state
 */
function getFighterSprite(fighter: Fighter, frame: number): SpriteFrame {
    const c = fighter.spriteColor;
    const a = fighter.spriteAccentColor;
    const skin = '#ffd5a0';
    const hair = '#1a1a2e';
    const shorts = fighter.spriteColor;
    const glove = fighter.spriteAccentColor;
    const outline = '#0a0a0f';
    const shoe = '#2a2a3e';
    const _ = null; // transparent

    switch (fighter.state) {
        case 'punching':
            return getPunchingSprite(fighter, skin, hair, shorts, glove, outline, shoe, c, a, _, frame);
        case 'blocking':
            return getBlockingSprite(skin, hair, shorts, glove, outline, shoe, c, a, _);
        case 'hit':
        case 'stunned':
            return getHitSprite(skin, hair, shorts, glove, outline, shoe, c, a, _);
        case 'knockedOut':
            return getKnockoutSprite(skin, hair, shorts, glove, outline, shoe, c, a, _);
        default:
            return getIdleSprite(skin, hair, shorts, glove, outline, shoe, c, a, _, frame);
    }
}

function getIdleSprite(
    skin: string, hair: string, shorts: string, glove: string,
    outline: string, shoe: string, c: string, a: string, _: null, frame: number
): SpriteFrame {
    // Breathing animation — slight bob on even frames
    const bob = Math.floor(frame / 15) % 2 === 0;

    // 20x32 pixel fighter in idle stance
    return [
        // Hair/head top
        [_, _, _, _, _, _, _, hair, hair, hair, hair, hair, hair, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, hair, hair, hair, hair, hair, hair, hair, hair, _, _, _, _, _, _],
        [_, _, _, _, _, hair, hair, hair, hair, hair, hair, hair, hair, hair, hair, _, _, _, _, _],
        // Face
        [_, _, _, _, _, outline, skin, skin, skin, skin, skin, skin, skin, skin, outline, _, _, _, _, _],
        [_, _, _, _, _, skin, skin, outline, skin, skin, skin, skin, outline, skin, skin, _, _, _, _, _],
        [_, _, _, _, _, skin, skin, skin, skin, skin, skin, skin, skin, skin, skin, _, _, _, _, _],
        [_, _, _, _, _, skin, skin, skin, skin, outline, outline, skin, skin, skin, skin, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, skin, skin, skin, skin, skin, skin, _, _, _, _, _, _],
        // Neck
        [_, _, _, _, _, _, _, _, skin, skin, skin, skin, _, _, _, _, _, _, _, _],
        // Shoulders + body top
        [_, _, _, _, outline, c, c, c, c, c, c, c, c, c, c, outline, _, _, _, _],
        [_, _, _, outline, c, c, c, c, c, c, c, c, c, c, c, c, outline, _, _, _],
        [_, _, _, outline, c, c, c, c, c, c, c, c, c, c, c, c, outline, _, _, _],
        // Arms + torso
        [_, _, glove, glove, skin, skin, c, c, c, c, c, c, c, c, skin, skin, glove, glove, _, _],
        [_, _, glove, glove, skin, skin, c, c, c, c, c, c, c, c, skin, skin, glove, glove, _, _],
        [_, _, glove, glove, _, _, c, c, c, c, c, c, c, c, _, _, glove, glove, _, _],
        [_, _, _, _, _, _, c, c, c, c, c, c, c, c, _, _, _, _, _, _],
        // Belt
        [_, _, _, _, _, _, a, a, a, a, a, a, a, a, _, _, _, _, _, _],
        // Shorts
        [_, _, _, _, _, shorts, shorts, shorts, shorts, _, _, shorts, shorts, shorts, shorts, _, _, _, _, _],
        [_, _, _, _, _, shorts, shorts, shorts, shorts, _, _, shorts, shorts, shorts, shorts, _, _, _, _, _],
        [_, _, _, _, _, shorts, shorts, shorts, _, _, _, _, shorts, shorts, shorts, _, _, _, _, _],
        // Legs
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _],
        ...(bob ? [
            [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _] as (string | null)[],
        ] : []),
        // Shoes
        [_, _, _, _, _, shoe, shoe, shoe, shoe, _, _, shoe, shoe, shoe, shoe, _, _, _, _, _],
        [_, _, _, _, _, shoe, shoe, shoe, shoe, _, _, shoe, shoe, shoe, shoe, _, _, _, _, _],
    ];
}

function getPunchingSprite(
    fighter: Fighter,
    skin: string, hair: string, shorts: string, glove: string,
    outline: string, shoe: string, c: string, a: string, _: null, frame: number
): SpriteFrame {
    const punchType = fighter.currentPunch?.type || 'jab';
    const isUppercut = punchType === 'uppercut';
    const isHook = punchType === 'hook';

    // Extended arm for punch — wider sprite
    return [
        // Head
        [_, _, _, _, _, _, _, hair, hair, hair, hair, hair, hair, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, hair, hair, hair, hair, hair, hair, hair, hair, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, hair, hair, hair, hair, hair, hair, hair, hair, hair, hair, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, outline, skin, skin, skin, skin, skin, skin, skin, skin, outline, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, skin, skin, outline, skin, skin, skin, skin, outline, skin, skin, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, skin, skin, skin, skin, skin, skin, skin, skin, skin, skin, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, skin, skin, skin, skin, outline, outline, skin, skin, skin, skin, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, skin, skin, skin, skin, skin, skin, _, _, _, _, _, _, _, _, _, _, _],
        // Neck
        [_, _, _, _, _, _, _, _, skin, skin, skin, skin, _, _, _, _, _, _, _, _, _, _, _, _, _],
        // Body — punching arm extended
        [_, _, _, _, outline, c, c, c, c, c, c, c, c, c, c, outline, _, _, _, _, _, _, _, _, _],
        [_, _, _, outline, c, c, c, c, c, c, c, c, c, c, c, c, outline, _, _, _, _, _, _, _, _],
        [_, _, _, outline, c, c, c, c, c, c, c, c, c, c, c, c, skin, skin, skin, skin, _, _, _, _, _],
        // Lead arm extended, rear arm guard
        ...(isUppercut ? [
            [_, _, glove, glove, skin, skin, c, c, c, c, c, c, c, c, skin, skin, skin, skin, glove, glove, _, _, _, _, _] as (string | null)[],
            [_, _, glove, glove, _, _, c, c, c, c, c, c, c, c, _, _, _, _, glove, glove, _, _, _, _, _] as (string | null)[],
        ] : [
            [_, _, glove, glove, skin, skin, c, c, c, c, c, c, c, c, skin, skin, skin, skin, skin, skin, glove, glove, glove, _, _] as (string | null)[],
            [_, _, glove, glove, _, _, c, c, c, c, c, c, c, c, _, _, _, _, _, _, glove, glove, glove, _, _] as (string | null)[],
        ]),
        [_, _, _, _, _, _, c, c, c, c, c, c, c, c, _, _, _, _, _, _, _, _, _, _, _],
        // Belt
        [_, _, _, _, _, _, a, a, a, a, a, a, a, a, _, _, _, _, _, _, _, _, _, _, _],
        // Shorts + legs (same as idle but slightly shifted)
        [_, _, _, _, _, shorts, shorts, shorts, shorts, _, _, shorts, shorts, shorts, shorts, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, shorts, shorts, shorts, shorts, _, _, shorts, shorts, shorts, shorts, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, shorts, shorts, shorts, _, _, _, _, shorts, shorts, shorts, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, shoe, shoe, shoe, shoe, _, _, shoe, shoe, shoe, shoe, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, shoe, shoe, shoe, shoe, _, _, shoe, shoe, shoe, shoe, _, _, _, _, _, _, _, _, _, _],
    ];
}

function getBlockingSprite(
    skin: string, hair: string, shorts: string, glove: string,
    outline: string, shoe: string, c: string, a: string, _: null
): SpriteFrame {
    // Gloves up, guard position
    return [
        [_, _, _, _, _, _, _, hair, hair, hair, hair, hair, hair, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, hair, hair, hair, hair, hair, hair, hair, hair, _, _, _, _, _, _],
        [_, _, _, _, _, hair, hair, hair, hair, hair, hair, hair, hair, hair, hair, _, _, _, _, _],
        [_, _, _, _, _, outline, skin, skin, skin, skin, skin, skin, skin, skin, outline, _, _, _, _, _],
        [_, _, _, _, glove, glove, skin, outline, skin, skin, skin, skin, outline, skin, glove, glove, _, _, _, _],
        [_, _, _, _, glove, glove, skin, skin, skin, skin, skin, skin, skin, skin, glove, glove, _, _, _, _],
        [_, _, _, _, glove, glove, skin, skin, skin, outline, outline, skin, skin, skin, glove, glove, _, _, _, _],
        [_, _, _, _, glove, glove, skin, skin, skin, skin, skin, skin, skin, skin, glove, glove, _, _, _, _],
        [_, _, _, _, _, _, _, _, skin, skin, skin, skin, _, _, _, _, _, _, _, _],
        [_, _, _, _, outline, c, c, c, c, c, c, c, c, c, c, outline, _, _, _, _],
        [_, _, _, outline, c, c, c, c, c, c, c, c, c, c, c, c, outline, _, _, _],
        [_, _, _, outline, c, c, c, c, c, c, c, c, c, c, c, c, outline, _, _, _],
        [_, _, _, _, skin, skin, c, c, c, c, c, c, c, c, skin, skin, _, _, _, _],
        [_, _, _, _, _, _, c, c, c, c, c, c, c, c, _, _, _, _, _, _],
        [_, _, _, _, _, _, c, c, c, c, c, c, c, c, _, _, _, _, _, _],
        [_, _, _, _, _, _, c, c, c, c, c, c, c, c, _, _, _, _, _, _],
        [_, _, _, _, _, _, a, a, a, a, a, a, a, a, _, _, _, _, _, _],
        [_, _, _, _, _, shorts, shorts, shorts, shorts, _, _, shorts, shorts, shorts, shorts, _, _, _, _, _],
        [_, _, _, _, _, shorts, shorts, shorts, shorts, _, _, shorts, shorts, shorts, shorts, _, _, _, _, _],
        [_, _, _, _, _, shorts, shorts, shorts, _, _, _, _, shorts, shorts, shorts, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _],
        [_, _, _, _, _, shoe, shoe, shoe, shoe, _, _, shoe, shoe, shoe, shoe, _, _, _, _, _],
        [_, _, _, _, _, shoe, shoe, shoe, shoe, _, _, shoe, shoe, shoe, shoe, _, _, _, _, _],
    ];
}

function getHitSprite(
    skin: string, hair: string, shorts: string, glove: string,
    outline: string, shoe: string, c: string, a: string, _: null
): SpriteFrame {
    // Recoiling — leaning back
    return [
        [_, _, _, _, _, _, _, _, hair, hair, hair, hair, hair, hair, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, hair, hair, hair, hair, hair, hair, hair, hair, _, _, _, _, _],
        [_, _, _, _, _, _, hair, hair, hair, hair, hair, hair, hair, hair, hair, hair, _, _, _, _],
        [_, _, _, _, _, _, outline, skin, skin, skin, skin, skin, skin, skin, skin, outline, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, outline, skin, skin, skin, skin, outline, skin, skin, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, skin, '#ff4444', skin, skin, '#ff4444', skin, skin, skin, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, skin, skin, outline, outline, skin, skin, skin, skin, _, _, _, _],
        [_, _, _, _, _, _, _, skin, skin, skin, skin, skin, skin, skin, skin, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, skin, skin, skin, skin, _, _, _, _, _, _, _],
        [_, _, _, _, _, outline, c, c, c, c, c, c, c, c, c, outline, _, _, _, _],
        [_, _, _, _, outline, c, c, c, c, c, c, c, c, c, c, c, outline, _, _, _],
        [_, _, _, _, outline, c, c, c, c, c, c, c, c, c, c, c, outline, _, _, _],
        [_, _, _, glove, glove, skin, c, c, c, c, c, c, c, c, skin, glove, glove, _, _, _],
        [_, _, _, glove, glove, _, c, c, c, c, c, c, c, c, _, glove, glove, _, _, _],
        [_, _, _, _, _, _, c, c, c, c, c, c, c, c, _, _, _, _, _, _],
        [_, _, _, _, _, _, c, c, c, c, c, c, c, c, _, _, _, _, _, _],
        [_, _, _, _, _, _, a, a, a, a, a, a, a, a, _, _, _, _, _, _],
        [_, _, _, _, _, shorts, shorts, shorts, shorts, _, _, shorts, shorts, shorts, shorts, _, _, _, _, _],
        [_, _, _, _, _, shorts, shorts, shorts, shorts, _, _, shorts, shorts, shorts, shorts, _, _, _, _, _],
        [_, _, _, _, _, shorts, shorts, shorts, _, _, _, _, shorts, shorts, shorts, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _],
        [_, _, _, _, _, _, skin, skin, _, _, _, _, skin, skin, _, _, _, _, _, _],
        [_, _, _, _, _, shoe, shoe, shoe, shoe, _, _, shoe, shoe, shoe, shoe, _, _, _, _, _],
        [_, _, _, _, _, shoe, shoe, shoe, shoe, _, _, shoe, shoe, shoe, shoe, _, _, _, _, _],
    ];
}

function getKnockoutSprite(
    skin: string, hair: string, shorts: string, glove: string,
    outline: string, shoe: string, c: string, a: string, _: null
): SpriteFrame {
    // Lying on the ground — horizontal sprite
    return [
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [glove, glove, hair, hair, hair, outline, skin, skin, c, c, c, c, c, a, shorts, shorts, skin, skin, shoe, shoe],
        [glove, glove, skin, skin, skin, outline, skin, skin, c, c, c, c, c, a, shorts, shorts, skin, skin, shoe, shoe],
        [_, _, skin, skin, skin, skin, skin, skin, c, c, c, c, c, a, shorts, skin, skin, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
}

/**
 * Draw a simple neon glow effect around a color
 */
export function drawNeonGlow(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number, height: number,
    color: string, intensity: number = 0.5
): void {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * intensity;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3 * intensity;
    ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
    ctx.restore();
}

/**
 * Draw hit impact particles
 */
export function drawHitParticles(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    frame: number, color: string
): void {
    const particles = 5;
    const maxLife = 12;
    const life = frame % maxLife;

    if (life >= maxLife) return;

    ctx.save();
    ctx.globalAlpha = 1 - life / maxLife;

    for (let i = 0; i < particles; i++) {
        const angle = (Math.PI * 2 / particles) * i + frame * 0.1;
        const dist = life * 3;
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist;
        const size = Math.max(1, 3 - life * 0.3);

        ctx.fillStyle = i % 2 === 0 ? color : '#ffffff';
        ctx.fillRect(px, py, size, size);
    }

    ctx.restore();
}
