import LoginButton from "@/components/header/LoginButton";
import Image from "next/image";

export default function Page() {
  return (
    <>
      {/* Google Fonts 追加 */}
      <link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet" />

      <div style={{
        backgroundColor: 'rgb(50,50,76)',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px',
        position: 'relative'
      }}>
        <style>
          {`
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
              100% { transform: translateY(0px); }
            }

            .floating {
              animation: float 2s ease-in-out infinite;
            }

            .floating-flip {
              animation: float 2s ease-in-out infinite;
              transform: scaleX(-1);
            }

            .glow {
              box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
            }
          `}
        </style>

        {/* メインコンテンツ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '25px',
          maxWidth: '800px'
        }}>
          {/* ロゴとヘリベえを横並び */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
            marginBottom: '10px'
          }}>
            {/* 左ヘリベえ（小さく） */}
            <Image
              src="/image/heli-bee.png"
              alt="ヘリベえ左" 
              width={150}
              height={150}
              className="floating"
            />
            
            {/* ロゴ */}
            <Image
              src="/image/shooting-logo.png" 
              alt="顔シューティングロゴ" 
              width={400}
              height={67}
            />

            {/* 右ヘリベえ（小さく） */}
            <Image
              src="/image/heli-bee.png"
              alt="ヘリベえ右"
              width={150}
              height={150}
              className="floating-flip"
            />
          </div>

          {/* タイトルとメッセージをまとめて配置 */}
          <div style={{
            textAlign: 'center',
            marginTop: '-80px'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontFamily: 'Anton, sans-serif',
              textShadow: '3px 3px 0 #FF0000, -3px -3px 0 #0000FF',
              marginBottom: '15px'
            }}>
              ゲームにログイン
            </h1>
            
          </div>

          {/* ログインボタン */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}>
            <LoginButton />
          </div>
        </div>

        <p style={{
              fontSize: '18px',
              lineHeight: '1.6',
              fontFamily: 'Anton, sans-serif',
              textShadow: '2px 2px 0 #000000',
              color: '#CCCCCC',
              marginTop: '30px'
            }}>
              おじさんシューティングゲームを始めるには<br />
              ログインが必要です
            </p>

        {/* フッター */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          fontSize: '12px',
          color: '#888888',
          fontFamily: 'Anton, sans-serif'
        }}>
          © 2024 Face Shooting Game
        </div>
      </div>
    </>
  );
}
