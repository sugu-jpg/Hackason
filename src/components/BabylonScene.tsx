// components/BabylonScene.tsx
"use client";

import React, { memo } from "react";
import { useGameState } from "../hooks/useGameState";
import { useDeviceOrientation } from "../hooks/useDeviceOrientation";
import { useBabylonGame } from "../hooks/useBabylonGame";
import { GameUI, PermissionButton, GameOverModal } from "../components/GameUi";

const BabylonScene = memo(() => {
  const {
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
    gameOverRef,
    hpRef,
    hitsRef,
    maxEnemies,
    restartGame,
  } = useGameState();

  const { requestPermission } = useDeviceOrientation();

  const { canvasRef } = useBabylonGame({
    permissionGranted,
    gameOver,
    maxEnemies,
    updateHp,
    updateHits,
    setEnemyCount,
    setOrientation,
    gameOverRef,
    hpRef,
    hitsRef,
    setGameOver,
  });

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setPermissionGranted(granted);
  };

  return (
    <>
      {/* センサー許可ボタン */}
      {!permissionGranted && (
        <PermissionButton onRequestPermission={handleRequestPermission} />
      )}

      {/* ゲームオーバーモーダル */}
      {gameOver && (
        <GameOverModal
          hits={hits}
          isSubmitting={isSubmitting}
          onRestart={restartGame}
        />
      )}

      {/* メインキャンバス */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100vh", display: "block" }}
      />

      {/* ゲームUI */}
      <GameUI
        hp={hp}
        hits={hits}
        enemyCount={enemyCount}
        maxEnemies={maxEnemies}
        orientation={orientation}
        gameOver={gameOver}
      />
    </>
  );
});

BabylonScene.displayName = 'BabylonScene';

export default BabylonScene;