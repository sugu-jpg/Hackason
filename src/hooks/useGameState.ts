// hooks/useGameState.ts
import { useState, useRef, useCallback } from 'react';

export interface GameState {
  orientation: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  permissionGranted: boolean;
  enemyCount: number;
  hp: number;
  hits: number;
  gameOver: boolean;
  isSubmitting: boolean;
  gameOverRef: React.MutableRefObject<boolean>;
  hpRef: React.MutableRefObject<number>;
  hitsRef: React.MutableRefObject<number>;
  maxEnemies: number;
}

export const useGameState = () => {
  const [orientation, setOrientation] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [enemyCount, setEnemyCount] = useState(0);
  const [hp, setHp] = useState(10);
  const [hits, setHits] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 再描画を防ぐためのref
  const gameOverRef = useRef(false);
  const hpRef = useRef(10);
  const hitsRef = useRef(0);
  const maxEnemies = 10;

  // HPとヒット数を更新する関数（refと状態の両方を更新）
  // useCallbackでメモ化して不要な再描画を防ぐ
  const updateHp = useCallback((newHp: number) => {
    hpRef.current = newHp;
    setHp(prevHp => {
      // 値が変わらない場合は状態更新をスキップ
      if (prevHp === newHp) return prevHp;
      return newHp;
    });
  }, []);

  const updateHits = useCallback((newHits: number) => {
    hitsRef.current = newHits;
    setHits(prevHits => {
      // 値が変わらない場合は状態更新をスキップ
      if (prevHits === newHits) return prevHits;
      return newHits;
    });
  }, []);

  const restartGame = useCallback(() => {
    gameOverRef.current = false;
    hpRef.current = 10;
    hitsRef.current = 0;
    updateHp(10);
    updateHits(0);
    setGameOver(false);
    setIsSubmitting(false);
    setEnemyCount(0);
  }, [updateHp, updateHits]);

  return {
    orientation,
    setOrientation,
    permissionGranted,
    setPermissionGranted,
    enemyCount,
    setEnemyCount,
    hp,
    updateHp,
    hits,
    updateHits,
    gameOver,
    setGameOver,
    isSubmitting,
    setIsSubmitting,
    gameOverRef,
    hpRef,
    hitsRef,
    maxEnemies,
    restartGame,
  };
};