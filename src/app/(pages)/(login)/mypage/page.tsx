import { requireAuth } from "@/lib/auth-server";
import Link from "next/link";

export default async function Page() {
  const session = await requireAuth();
  return (
    <div>
      <Link href="/game">ゲームを始める</Link></div>
  )
}