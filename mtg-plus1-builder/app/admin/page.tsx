import { getAdminDecks, getStats } from '@/app/actions/admin';
import Link from 'next/link';
import { Shield, ExternalLink, Clock, Key, Database, PieChart, TrendingUp } from 'lucide-react';
import AdminDeleteButton from '@/components/AdminDeleteButton';
import PublicHeader from '@/components/PublicHeader';
import { getDeckColorName, getMtgColor } from '@/lib/mtg';

export const dynamic = 'force-dynamic';

// ★追加: データ型を定義してTypeScriptに構造を教える
type AdminDeckData = {
  id: string;
  name: string;
  builderName?: string;
  selectedSet: string;
  language: string;
  createdAt: Date | string;
  editSecret?: string;
  colors?: string[]; // ここにcolorsがあることを明示
};

export default async function AdminPage() {
  const rawDecks = await getAdminDecks();
  const stats = await getStats();

  // ★修正1: 取得したデータを型キャストして colors プロパティへのアクセスを許可する
  const decks = rawDecks as unknown as AdminDeckData[];

  // 1. デッキリストから色の組み合わせを集計
  const comboStats: Record<string, number> = {};
  
  decks.forEach(deck => {
    // mtg.ts のロジックに合わせて WUBRG 順にソートしてキー化
    const sortOrder = ['W', 'U', 'B', 'R', 'G', 'C'];
    const sortedColors = (deck.colors || [])
      // ★修正2: 引数に型 (string) を明示
      .sort((a: string, b: string) => sortOrder.indexOf(a) - sortOrder.indexOf(b))
      .join('');
    
    // 色がない場合は 'C' (無色) 扱い、それ以外はそのキー
    const key = sortedColors === '' ? 'C' : sortedColors;
    comboStats[key] = (comboStats[key] || 0) + 1;
  });

  // 2. 集計結果を配列にしてソート（件数が多い順）
  const sortedComboStats = Object.entries(comboStats)
    .sort(([, countA], [, countB]) => countB - countA);

  // グラフの100%基準用（最大値）
  const maxComboVal = sortedComboStats.length > 0 ? sortedComboStats[0][1] : 1;

  // ヘルパー: バーの背景スタイルを生成 (mtg.tsの定義を使用)
  const getBarStyle = (key: string) => {
    const colors = key.split('').map(c => getMtgColor(c));
    if (colors.length === 1) {
      return { backgroundColor: colors[0].hex };
    }
    const stops = colors.map(c => c.hex).join(', ');
    return { background: `linear-gradient(to right, ${stops})` };
  };

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

      {/* 統計エリア */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* 1. 総数カード */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-900/20 rounded text-blue-400">
              <Database size={20} />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase">Total Decks</span>
          </div>
          <div className="text-4xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-2">
            Latest {stats.sampleSize || 0} analyzed
          </div>
        </div>

        {/* 2. 色分布チャート */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-900/20 rounded text-purple-400">
              <PieChart size={20} />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase">Archetype Distribution</span>
          </div>
          {/* ★修正3: Tailwind推奨クラスに変更 (max-h-[300px] -> max-h-75) */}
          <div className="space-y-3 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
            {sortedComboStats.length === 0 && <div className="text-sm text-slate-500">No data</div>}
            
            {sortedComboStats.map(([key, count]) => {
              const percent = (count / maxComboVal) * 100;
              const label = getDeckColorName(key.split(''), 'en') || key;
              const barStyle = getBarStyle(key);

              return (
                <div key={key} className="flex items-center gap-2 text-xs group">
                  <div className="w-24 font-bold text-slate-400 truncate" title={key}>{label}</div>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                    <div 
                      className="h-full rounded-full transition-all duration-500 ease-out opacity-90 group-hover:opacity-100"
                      style={{ width: `${percent}%`, ...barStyle }}
                    />
                  </div>
                  <span className="w-6 text-right text-slate-300 font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 人気セットランキング (変更なし) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-900/20 rounded text-green-400">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase">Top Sets</span>
          </div>
          <ul className="space-y-2">
            {(stats.setStats || []).map((set: any, index: number) => (
              <li key={set.code} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className={`
                    w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold
                    ${index === 0 ? 'bg-yellow-500 text-black' : 
                      index === 1 ? 'bg-slate-400 text-black' : 
                      index === 2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-500'}
                  `}>
                    {index + 1}
                  </span>
                  <span className="font-mono font-bold text-white uppercase">{set.code}</span>
                </div>
                <span className="text-slate-400 font-mono">{set.count}</span>
              </li>
            ))}
            {(!stats.setStats || stats.setStats.length === 0) && (
              <li className="text-xs text-slate-500 text-center py-4">No data available</li>
            )}
          </ul>
        </div>
      </div>

      {/* デッキリスト (既存) */}
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