import { getAdminDecks, getStats } from '@/app/actions/admin';
import Link from 'next/link';
import { Shield, ExternalLink, Clock, Key } from 'lucide-react'; // 使用しなくなったアイコン(PieChartなど)を削除
import AdminDeleteButton from '@/components/AdminDeleteButton';
import PublicHeader from '@/components/PublicHeader';
import AdminStatsSection from '@/components/AdminStatsSection'; // ★作成したコンポーネントをインポート

export const dynamic = 'force-dynamic';

type AdminDeckData = {
  id: string;
  name: string;
  builderName?: string;
  selectedSet: string;
  language: string;
  createdAt: Date | string;
  editSecret?: string;
  colors?: string[];
};

export default async function AdminPage() {
  // 並列でデータを取得
  const [rawDecks, stats] = await Promise.all([
    getAdminDecks(),
    getStats(),
  ]);

  const decks = rawDecks as unknown as AdminDeckData[];

  // ★以前ここに書いてあった「色集計ロジック(forEach...)」は全て削除しました。
  // 集計はサーバーサイド(getStats)で行われ、表示はAdminStatsSectionが行います。

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <PublicHeader
        showNavLinks={false}
        title={<span className="flex items-center gap-2 text-blue-200"><Shield />Admin Dashboard</span>}
        customActions={(
          <Link
            href="/"
            className="hidden sm:inline-flex px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-sm transition-colors"
          >
            アプリに戻る
          </Link>
        )}
      />

      {/* ★ここに新しい統計コンポーネントを配置 */}
      {/* データを渡すだけで、グラフやモーダル機能が動きます */}
      <AdminStatsSection stats={stats} />

      {/* デッキリスト (ここはサーバーコンポーネントのまま維持) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
             <h2 className="text-sm font-bold text-slate-400">最新の投稿 (Max 100件)</h2>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Deck Name / ID</th>
                <th className="px-6 py-3">Builder</th>
                <th className="px-6 py-3">Set / Lang</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {decks.map((deck) => (
                <tr key={deck.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-base">{deck.name}</span>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-1">
                        ID: {deck.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {deck.builderName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-xs font-mono uppercase text-slate-300">
                        {deck.selectedSet}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-xs font-mono uppercase text-slate-300">
                        {deck.language}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(deck.createdAt).toLocaleString('ja-JP')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/deck/${deck.id}/edit?key=${deck.editSecret}`} 
                        target="_blank"
                        className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-800 rounded transition-colors"
                        title="編集"
                      >
                          <Key size={16} />
                      </Link>
                      
                      <Link 
                        href={`/deck/${deck.id}`} 
                        target="_blank"
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                        title="閲覧"
                      >
                          <ExternalLink size={16} />
                      </Link>

                      <AdminDeleteButton id={deck.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}