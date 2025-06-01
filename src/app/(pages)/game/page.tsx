// src/app/page.tsx
"use client"

import BabylonScene from '@/components/BabylonScene';
import LogOutButton from '@/components/header/logOutButton';

export default function HomePage() {
  return (
    <main style={{ margin: 0, padding: 0 }}>
      <LogOutButton />
      <BabylonScene />
    </main>
  );
}
