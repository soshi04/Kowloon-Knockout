'use client';

import dynamic from 'next/dynamic';
import { useGameStore } from '@/stores/gameStore';
import MainMenu from '@/components/MainMenu';
import CharacterSelect from '@/components/CharacterSelect';
import MultiplayerLobby from '@/components/MultiplayerLobby';
import ResultScreen from '@/components/ResultScreen';
import { AnimatePresence, motion } from 'framer-motion';

// Dynamic import for GameCanvas because it uses canvas/window APIs
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div style={{ color: '#ffcc00', fontFamily: 'var(--font-pixel)', fontSize: '12px' }}>
      LOADING...
    </div>
  ),
});

export default function Home() {
  const { phase } = useGameStore();

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {phase === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', height: '100%' }}
          >
            <MainMenu />
          </motion.div>
        )}

        {phase === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', height: '100%' }}
          >
            <CharacterSelect />
          </motion.div>
        )}

        {phase === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', height: '100%' }}
          >
            <MultiplayerLobby />
          </motion.div>
        )}

        {(phase === 'fight' || phase === 'countdown') && (
          <motion.div
            key="fight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameCanvas />
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ResultScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
