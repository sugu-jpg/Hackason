'use client';

import React from 'react';
import { useRouter } from 'next/navigation'; // ★ これ追加
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter(); // ★ これ追加

  const handleStartClick = () => {
    router.push('/login'); // ★ スタートボタンで「/」にジャンプ
  };

  return (
    <>
      {/* Google Fonts 追加 */}
      <link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet" />

      <div style={{
        backgroundImage: 'url(/image/space360.jpg)',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px',
        opacity: '1'
      }}>
        {/* トップ画面 */}
        <>
          <style>
            {`
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-50px); }
                100% { transform: translateY(0px); }
              }

              .floating {
                animation: float 3s ease-in-out infinite;
              }

              .floating-flip {
                animation: float 3s ease-in-out infinite;
                transform: scaleX(-1);
              }
            `}
          </style>

          {/* ロゴとヘリベえを横並び */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
          }}>
            {/* 左ヘリベえ */}
            <Image
              src="/image/heli_touka.png"
              alt="ヘリベえ左" 
              width={300}
              height={300}
              className="floating"
            />
            
            {/* ロゴ */}
            <Image
              src="/image/shooting-logo.png" 
              alt="顔シューティングロゴ" 
              width={600}
              height={100}
            />

            {/* 右ヘリベえ */}
            <Image
              src="/image/heli_touka.png"
              alt="ヘリベえ右"
              width={300}
              height={300}
              className="floating-flip"
            />
          </div>

          {/* キャッチコピー */}
          <p style={{
            fontSize: '24px',
            lineHeight: '1.8',
            fontFamily: 'Anton, sans-serif',
            textShadow: '3px 3px 0 #FF0000, -3px -3px 0 #0000FF',
            marginBottom: '10px'
          }}>
            ためらうな。先に撃て。<br />
            懐かしき顔撃ちの伝説が、ここに甦る。<br />
            やれるもんならやってみなさい！！
          </p>

          {/* スタートボタン */}
          <button
            onClick={handleStartClick}
            style={{
              fontSize: '32px',
              padding: '20px 60px',
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontFamily: 'Anton, sans-serif',
              boxShadow: '0 0 20px red',
              transition: 'transform 0.3s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            スタート
          </button>
        </>
      </div>
    </>
  );
}
