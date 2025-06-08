import { requireAuth } from "@/lib/auth-server";
import Link from "next/link";
import Image from "next/image";

export default async function Page() {
  const session = await requireAuth();
  return (
    <>
      {/* Google Fonts 追加 */}
      <link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet" />

      <div style={{
        backgroundImage: "url(/image/space360.jpg)",
        color: 'white',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <style>
          {`
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-15px); }
              100% { transform: translateY(0px); }
            }

            .floating {
              animation: float 2s ease-in-out infinite;
            }

            .floating-flip {
              animation: float 2s ease-in-out infinite;
              transform: scaleX(-1);
            }

            .game-button {
              font-size: 24px;
              padding: 15px 40px;
              border: none;
              border-radius: 12px;
              cursor: pointer;
              font-family: 'Anton', sans-serif;
              box-shadow: 0 0 15px;
              transition: transform 0.3s;
              text-decoration: none;
              display: inline-block;
              color: white;
              margin: 10px;
            }

            .game-button:hover {
              transform: scale(1.1);
            }

            .play-button {
              background-color: red;
              box-shadow: 0 0 15px red;
            }

            .ranking-button {
              background-color: orange;
              box-shadow: 0 0 15px orange;
            }
          `}
        </style>

        {/* メインコンテンツ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '25px',
          maxWidth: '800px',
          width: '100%'
        }}>
          {/* ロゴとヘリベえを横並び */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '25px',
            marginBottom: '0'
          }}>
            {/* 左ヘリベえ（小さく） */}
            <Image
              src="/image/heli_touka.png"
              alt="ヘリベえ左" 
              width={130}
              height={130}
              className="floating"
            />
            
            {/* ロゴ */}
            <Image
              src="/image/shooting-logo.png" 
              alt="顔シューティングロゴ" 
              width={380}
              height={63}
            />

            {/* 右ヘリベえ（小さく） */}
            <Image
              src="/image/heli_touka.png"
              alt="ヘリベえ右"
              width={130}
              height={130}
              className="floating-flip"
            />
          </div>

          {/* タイトル */}
          <div style={{
            textAlign: 'center',
            marginTop: '-80px'
          }}>
            <p style={{
              fontSize: '18px',
              lineHeight: '1.4',
              fontFamily: 'Anton, sans-serif',
              textShadow: '2px 2px 0 #000000',
              color: '#CCCCCC',
              marginBottom: '0'
            }}>
              ゲームメニューを選択してください
            </p>
          </div>

          {/* ボタン群 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            alignItems: 'center'
          }}>
            <Link href="/game" className="game-button play-button">
              🎯 ゲームを始める
            </Link>
            
            <Link href="/ranking" className="game-button ranking-button">
              🏆 ランキングを見る
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}