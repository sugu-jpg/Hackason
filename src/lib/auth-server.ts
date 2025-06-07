// lib/auth-server.ts
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

export async function getOptionalAuth() {
  const session = await auth();
  return session;
}

export async function redirectIfAuthenticated() {
  const session = await auth();
  
  if (session) {
    redirect('/mypage');
  }
}