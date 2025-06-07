import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "../../../../../prisma/client";


interface RankingItem {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  isCurrentUser: boolean;
}

export default async function RankingPage() {
  await requireAuth();
  const session = await auth();

  // より効率的なクエリ：JOINを使用してユーザー情報も一緒に取得
  const rankingData = await prisma.gameResult.findMany({
    select: {
      userid: true,
      score: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      score: 'desc',
    },
  });

  // 各ユーザーの最高スコアを抽出
  const userMaxScores = new Map<string, { score: number; user: any }>();
  
  rankingData.forEach((result) => {
    const existing = userMaxScores.get(result.userid);
    if (!existing || result.score > existing.score) {
      userMaxScores.set(result.userid, {
        score: result.score,
        user: result.user,
      });
    }
  });

  // ランキング形式に変換（スコア順で並び替え）
  const rankingWithUsers: RankingItem[] = Array.from(userMaxScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 20) // 上位20位まで
    .map(([userId, data], index) => ({
      rank: index + 1,
      userId,
      userName: data.user?.name || data.user?.email || 'Unknown User',
      score: data.score,
      isCurrentUser: data.user?.email === session?.user?.email,
    }));

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🏆 ランキング 🏆
          </h1>
          <p className="text-gray-300 text-lg">
            上位20位のプレイヤー
          </p>
        </div>

        {/* ランキングテーブル */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    順位
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    プレイヤー名
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-white uppercase tracking-wider">
                    最高スコア
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {rankingWithUsers.map((item) => (
                  <tr
                    key={item.userId}
                    className={`transition-all duration-200 hover:bg-white/10 ${
                      item.isCurrentUser 
                        ? 'bg-yellow-500/20 border-l-4 border-yellow-400' 
                        : ''
                    }`}
                  >
                    {/* 順位 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.rank <= 3 ? (
                          <span className="text-2xl mr-2">
                            {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : null}
                        <span className={`text-lg font-bold ${
                          item.isCurrentUser ? 'text-yellow-300' : 'text-white'
                        }`}>
                          #{item.rank}
                        </span>
                      </div>
                    </td>

                    {/* プレイヤー名 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-lg font-medium ${
                          item.isCurrentUser ? 'text-yellow-300' : 'text-white'
                        }`}>
                          {item.userName}
                        </span>
                        {item.isCurrentUser && (
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-500 text-black rounded-full font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>

                    {/* スコア */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-xl font-bold ${
                        item.isCurrentUser ? 'text-yellow-300' : 'text-white'
                      }`}>
                        {item.score.toLocaleString()}
                      </span>
                      <span className={`text-sm ml-1 ${
                        item.isCurrentUser ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        hits
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 現在のユーザーがランキング外の場合の表示 */}
        {!rankingWithUsers.some(item => item.isCurrentUser) && (
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-400 rounded-lg">
            <p className="text-center text-blue-200">
              あなたの記録はまだトップ20に入っていません。
              <br />
              ゲームをプレイしてランキング入りを目指しましょう！
            </p>
          </div>
        )}

        {/* フッター */}
        <div className="mt-8 text-center flex gap-4 justify-center">
          <a
            href="/game"
            className="inline-block bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            🎮 ゲームをプレイ
          </a>
            <a
            href="/mypage"
            className="inline-block bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            🏠 マイページに戻る
          </a>
        </div>

        {/* 統計情報 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <h3 className="text-white font-bold text-lg mb-2">総プレイヤー数</h3>
            <p className="text-2xl font-bold text-blue-300">{rankingWithUsers.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <h3 className="text-white font-bold text-lg mb-2">最高記録</h3>
            <p className="text-2xl font-bold text-yellow-300">
              {rankingWithUsers.length > 0 ? rankingWithUsers[0].score.toLocaleString() : '0'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <h3 className="text-white font-bold text-lg mb-2">あなたの順位</h3>
            <p className="text-2xl font-bold text-green-300">
              {rankingWithUsers.find(item => item.isCurrentUser)?.rank || 'ランク外'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}