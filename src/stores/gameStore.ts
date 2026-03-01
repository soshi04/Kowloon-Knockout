// ============================================================
// Zustand Game Store — Modular state management
// ============================================================

import { create } from 'zustand';
import type { FighterClass, GamePhase, FightResult } from '@/game/fighters/types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'waiting' | 'ready' | 'playing';

interface GameStore {
    // Game phase
    phase: GamePhase;
    setPhase: (phase: GamePhase) => void;

    // Character selection
    selectedClass: FighterClass;
    opponentClass: FighterClass;
    setSelectedClass: (c: FighterClass) => void;
    setOpponentClass: (c: FighterClass) => void;

    // Score tracking
    playerWins: number;
    opponentWins: number;
    incrementPlayerWins: () => void;
    incrementOpponentWins: () => void;

    // Multiplayer state
    isMultiplayer: boolean;
    isHost: boolean;
    roomCode: string | null;
    connectionStatus: ConnectionStatus;
    setMultiplayer: (isMultiplayer: boolean) => void;
    setIsHost: (isHost: boolean) => void;
    setRoomCode: (code: string | null) => void;
    setConnectionStatus: (status: ConnectionStatus) => void;
    resetMultiplayer: () => void;

    // Fight state (from engine)
    playerHealth: number;
    opponentHealth: number;
    playerMaxHealth: number;
    opponentMaxHealth: number;
    playerStamina: number;
    opponentStamina: number;
    playerMaxStamina: number;
    opponentMaxStamina: number;
    round: number;
    roundTime: number;
    comboText: string;
    result: FightResult;

    updateFightState: (state: {
        playerHealth: number;
        opponentHealth: number;
        playerMaxHealth: number;
        opponentMaxHealth: number;
        playerStamina: number;
        opponentStamina: number;
        playerMaxStamina: number;
        opponentMaxStamina: number;
        round: number;
        roundTime: number;
        comboText: string;
        result: FightResult;
    }) => void;

    // Reset
    resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
    phase: 'menu',
    setPhase: (phase) => set({ phase }),

    selectedClass: 'speed',
    opponentClass: 'power',
    setSelectedClass: (selectedClass) => set({ selectedClass }),
    setOpponentClass: (opponentClass) => set({ opponentClass }),

    playerWins: 0,
    opponentWins: 0,
    incrementPlayerWins: () => set((s) => ({ playerWins: s.playerWins + 1 })),
    incrementOpponentWins: () => set((s) => ({ opponentWins: s.opponentWins + 1 })),

    isMultiplayer: false,
    isHost: false,
    roomCode: null,
    connectionStatus: 'disconnected',
    setMultiplayer: (isMultiplayer) => set({ isMultiplayer }),
    setIsHost: (isHost) => set({ isHost }),
    setRoomCode: (roomCode) => set({ roomCode }),
    setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
    resetMultiplayer: () => set({ isMultiplayer: false, isHost: false, roomCode: null, connectionStatus: 'disconnected' }),

    playerHealth: 100,
    opponentHealth: 100,
    playerMaxHealth: 100,
    opponentMaxHealth: 100,
    playerStamina: 100,
    opponentStamina: 100,
    playerMaxStamina: 100,
    opponentMaxStamina: 100,
    round: 1,
    roundTime: 99,
    comboText: '',
    result: null,

    updateFightState: (state) => set(state),

    resetGame: () => set({
        phase: 'menu',
        playerWins: 0,
        opponentWins: 0,
        result: null,
        isMultiplayer: false,
        isHost: false,
        roomCode: null,
        connectionStatus: 'disconnected',
    }),
}));
