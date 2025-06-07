// components/GameUI.tsx
import React from 'react';
import Link from 'next/link';

interface GameUIProps {
  hp: number;
  hits: number;
  enemyCount: number;
  maxEnemies: number;
  orientation: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  gameOver: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({
  hp,
  hits,
  enemyCount,
  maxEnemies,
  orientation,
  gameOver
}) => {
  return (
    <>
      {/* メインUI */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 15,
          pointerEvents: "none",
          backgroundColor: "transparent",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
        className="relative"
      >
        {/* ヒット数表示 */}
        <div className="absolute left-[20%] top-[3vw]">
          <img
            src={"image/hits.webp"}
            alt="ヒット数画像"
            style={{
              width: "20vw",
              pointerEvents: "none",
            }}
          />
          <div className="absolute md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl top-[20%] right-12">
            {hits}
          </div>
        </div>

        {/* HP表示 */}
        <img
          src={"image/" + hp + ".webp"}
          alt="HP画像"
          style={{
            width: "20vw",
            objectFit: "cover",
            pointerEvents: "none",
          }}
          className="absolute right-[20%] top-[3vw]"
        />

        {/* オーバーレイ画像 */}
        <img
          src="image/pit.webp"
          alt="オーバーレイ画像"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* デバッグ情報 */}
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "8px",
          zIndex: 10,
        }}
      >
        <div>Alpha（ヨー）: {orientation.alpha.toFixed(1)}°</div>
        <div>Beta（ピッチ）: {orientation.beta.toFixed(1)}°</div>
        <div>Gamma（ロール）: {orientation.gamma.toFixed(1)}°</div>
        <div style={{ marginTop: "10px", fontSize: "12px" }}>
          <div>操作方法:</div>
          <div>WASD: 移動</div>
          <div>スペース: 弾丸発射</div>
          <div>
            敵数: {enemyCount}/{maxEnemies}
          </div>
          {gameOver && <div style={{ color: "red" }}>ゲームオーバー</div>}
        </div>
      </div>
    </>
  );
};

interface PermissionButtonProps {
  onRequestPermission: () => void;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({ onRequestPermission }) => {
  return (
    <button
      onClick={onRequestPermission}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        padding: "1em 2em",
        fontSize: "16px",
        zIndex: 20,
      }}
    >
      センサーを有効にする
    </button>
  );
};

interface GameOverModalProps {
  hits: number;
  isSubmitting: boolean;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hits,
  isSubmitting,
  onRestart
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgba(0,0,0,0.9)",
        color: "white",
        padding: "2em",
        borderRadius: "10px",
        zIndex: 30,
        textAlign: "center",
      }}
    >
      <h2>ゲームオーバー！</h2>
      <p>ヒット数: {hits}</p>
      {isSubmitting ? (
        <p>結果を保存中...</p>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            onClick={onRestart}
            style={{
              padding: "1em 2em",
              fontSize: "16px",
              marginTop: "1em",
              cursor: "pointer",
            }}
          >
            もう一度プレイ
          </button>
          <Link href="/ranking">
            <button
              style={{
                padding: "1em 2em",
                fontSize: "16px",
                marginTop: "1em",
                cursor: "pointer",
              }}
            >
              ランキングへ
            </button>
          </Link>
          <Link href="/mypage">
            <button
              style={{
                padding: "1em 2em",
                fontSize: "16px",
                marginTop: "1em",
                cursor: "pointer",
              }}
            >
              マイページへ
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};