// components/GameUI.tsx
import React from 'react';
import Link from 'next/link';
import "./UI.css";

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
        <div style={{ fontSize: "12px" }}>
          <div>操作方法:</div>
          <div>WASD: 移動</div>
          <div>左クリック: 弾丸発射</div>
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
        color: "white",
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        padding: "1em 2em",
        fontSize: "16px",
        zIndex: 20,
      }}
    >
      クリックして出撃
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
      background: "radial-gradient(circle at top left, #0f172a, #1e293b)", // 宇宙感ある深いブルーグラデ
      color: "#e0f2fe", // 明るいシアン系
      padding: "3em",
      borderRadius: "20px",
      zIndex: 30,
      textAlign: "center",
      border: "2px solid #38bdf8", // ネオンブルー
      boxShadow: "0 0 30px #38bdf8, 0 0 60px #38bdf8, inset 0 0 20px #0ea5e9", // 外と内側両方がグロー
      animation: "fadeIn 1s ease",
      backdropFilter: "blur(8px)", // 背景ぼかしで未来感アップ
    }}
  >
    <h2 style={{
      margin: 0,
      fontSize: "3rem",
      fontWeight: "bold",
      color: "#7dd3fc", // 淡いシアンブルー
      marginBottom: "1.5rem",
      textShadow: "0 0 10px #38bdf8, 0 0 20px #0ea5e9",
    }}>
      🚀 GAME OVER 🚀
    </h2>
    <p style={{
      fontSize: "1.5rem",
      marginBottom: "2rem",
      color: "#bae6fd",
    }}>
      ヒット数: {hits}
    </p>
    {isSubmitting ? (
      <p>結果を保存中...</p>
    ) : (
      <div className="flex flex-col gap-4">
        <button
          onClick={onRestart}
          style={{
            padding: "1em 2em",
            fontSize: "18px",
            marginTop: "1em",
            cursor: "pointer",
            borderRadius: "12px",
            border: "1px solid #38bdf8",
            backgroundColor: "transparent",
            color: "#38bdf8",
            boxShadow: "0 0 10px #38bdf8",
            transition: "all 0.3s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#38bdf8";
            e.currentTarget.style.color = "#0f172a";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#38bdf8";
          }}
        >
          もう一度プレイ
        </button>
        <Link href="/ranking">
          <button
            style={{
              padding: "1em 2em",
              fontSize: "18px",
              marginTop: "1em",
              cursor: "pointer",
              borderRadius: "12px",
              border: "1px solid #38bdf8",
              backgroundColor: "transparent",
              color: "#38bdf8",
              boxShadow: "0 0 10px #38bdf8",
              transition: "all 0.3s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#38bdf8";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#38bdf8";
            }}
          >
            ランキングへ
          </button>
        </Link>
        <Link href="/mypage">
          <button
            style={{
              padding: "1em 2em",
              fontSize: "18px",
              marginTop: "1em",
              cursor: "pointer",
              borderRadius: "12px",
              border: "1px solid #38bdf8",
              backgroundColor: "transparent",
              color: "#38bdf8",
              boxShadow: "0 0 10px #38bdf8",
              transition: "all 0.3s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#38bdf8";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#38bdf8";
            }}
          >
            マイページへ
          </button>
        </Link>
      </div>
    )}
  </div>
);
}