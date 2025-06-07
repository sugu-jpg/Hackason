// app/api/result/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '../../../../prisma/client';


export async function POST(request: NextRequest) {
  try {
    // セッションから認証情報を取得
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // リクエストボディからhitsを取得
    const { hits } = await request.json();
    
    if (typeof hits !== 'number' || hits < 0) {
      return NextResponse.json(
        { error: 'Invalid hits value' },
        { status: 400 }
      );
    }

    // ユーザーIDを取得（セッションからemailを使ってユーザーを特定）
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email!,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ゲーム結果をデータベースに保存
    const gameResult = await prisma.gameResult.create({
      data: {
        userid: user.id,
        timestamp: new Date(),
        score: hits,
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        id: gameResult.id,
        score: gameResult.score,
        timestamp: gameResult.timestamp,
      },
    });

  } catch (error) {
    console.error('Error saving game result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}