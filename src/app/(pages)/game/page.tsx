// src/app/page.tsx

import { requireAuth } from '@/lib/auth-server';
import BabylonScene from '../../../components/BabylonScene';

export default async function HomePage() {
    const session = await requireAuth();
  return (
    <main style={{ margin: 0, padding: 0 }}>
      <BabylonScene />
    </main>
  );
}
