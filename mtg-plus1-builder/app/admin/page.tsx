import { getAdminDecks, getStats } from '@/app/actions/admin';
import Link from 'next/link';
import { Shield, ExternalLink, Clock, Key, Database, PieChart, TrendingUp } from 'lucide-react';
import AdminDeleteButton from '@/components/AdminDeleteButton';

export const dynamic = 'force-dynamic';

// 色ごとのスタイル定義
const COLOR_MAP: Record<string, { label: string, bg: string, bar: string }> = {
  W: { label: 'White', bg: 'bg-yellow-900/20', bar: 'bg-yellow-400' },
  U: { label: 'Blue',  bg: 'bg-blue-900/20',   bar: 'bg-blue-400' },
  B: { label: 'Black', bg: 'bg-purple-900/20', bar: 'bg-purple-400' },
  R: { label: 'Red',   bg: 'bg-red-900/20',    bar: 'bg-red-400' },
  G: { label: 'Green', bg: 'bg-green-900/20',  bar: 'bg-green-400' },
  C: { label: 'Colorless', bg: 'bg-slate-700', bar: 'bg-slate-400' },
};

export default async function AdminPage() {
  const decks = await getAdminDecks();
  const stats = await getStats();

  // 色分布の最大値を取得（グラフの100%基準用）
  const maxColorVal = Math.max(...Object.values(stats.colorStats || {}).map(v => Number(v)), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      {/* ヘッダー */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded border border-slate-700">
            <Shield className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">システム管理</p>
          </div>
        </div>
        <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-sm transition-colors">
          アプリに戻る
        </Link>
      </header>

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
            <span className="text-sm font-bold text-slate-400 uppercase">Color Distribution</span>
          </div>
          <div className="space-y-2">
            {Object.entries(COLOR_MAP).map(([key, info]) => {
              const count = (stats.colorStats as any)?.[key] || 0;
              const percent = (count / maxColorVal) * 100;
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="w-4 font-bold text-slate-400">{key}</span>
                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${info.bg}`}>
                    <div 
                      className={`h-full ${info.bar}`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-slate-300">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 人気セットランキング */}
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
        {/* ... (既存のテーブルコード) ... */}
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