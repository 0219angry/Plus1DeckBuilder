'use client';

import { useState } from 'react';
import { PieChart, TrendingUp, Palette, X, Maximize2, Database, Swords } from 'lucide-react'; // Swordsアイコン追加
import { getDeckColorName, getMtgColor } from '@/lib/mtg';
import { ARCHETYPES_DATA } from '@/lib/constants'; // ★作成した定数をインポート
import type { DashboardStats, StatItem } from '@/app/actions/admin';

type Props = {
  stats: DashboardStats;
};

// ラベル変換ヘルパー
const getStrategyLabel = (key: string) => {
  if (key === 'unknown') return 'Unknown';
  const found = ARCHETYPES_DATA.find(a => a.id === key);
  return found ? found.en : key; // ここでは英語名を返していますが ja に変えれば日本語になります
};

export default function AdminStatsSection({ stats }: Props) {
  // type に 'strategy' を追加
  const [modalData, setModalData] = useState<{ title: string; data: StatItem[], type: 'color' | 'set' | 'strategy' } | null>(null);

  const getBarStyle = (key: string) => {
    const colors = key.split('').map(c => getMtgColor(c));
    if (colors.length === 1) return { backgroundColor: colors[0].hex };
    const stops = colors.map(c => c.hex).join(', ');
    return { background: `linear-gradient(to right, ${stops})` };
  };

  const StatCard = ({ title, icon, data, type }: { title: string, icon: React.ReactNode, data: StatItem[], type: 'color' | 'set' | 'strategy' }) => {
    const maxVal = data.length > 0 ? data[0].count : 1;
    const topData = data.slice(0, 5);

    return (
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg shadow-lg flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded 
              ${type === 'color' ? 'bg-purple-900/20 text-purple-400' : 
                type === 'strategy' ? 'bg-red-900/20 text-red-400' :
                'bg-green-900/20 text-green-400'}`}>
              {icon}
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase">{title}</span>
          </div>
          {data.length > 5 && (
            <button 
              onClick={() => setModalData({ title, data, type })}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <Maximize2 size={12} /> View All
            </button>
          )}
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          {data.length === 0 && <div className="text-sm text-slate-500">No data</div>}
          
          {topData.map(({ key, count }) => {
            const percent = (count / maxVal) * 100;
            
            // ラベルの決定ロジック
            let label = key;
            let barStyle: React.CSSProperties = { backgroundColor: '#475569' }; // デフォルト灰色

            if (type === 'color') {
              label = getDeckColorName(key.split(''), 'en') || key;
              barStyle = getBarStyle(key);
            } else if (type === 'strategy') {
              label = getStrategyLabel(key);
              barStyle = { backgroundColor: '#ef4444' }; // 戦略は赤系で統一（お好みで）
            }

            return (
              <div key={key} className="flex items-center gap-2 text-xs group">
                <div className="w-24 font-bold text-slate-400 truncate" title={key}>{label}</div>
                <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out opacity-90 group-hover:opacity-100"
                    style={{ width: `${percent}%`, ...barStyle }}
                  />
                </div>
                <span className="w-8 text-right text-slate-300 font-mono">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // モーダル用：行の描画ロジックを関数化
  const renderModalRow = (key: string, count: number, maxVal: number, type: 'color' | 'set' | 'strategy') => {
    const percent = (count / maxVal) * 100;
    
    let label = key;
    let barStyle: React.CSSProperties = { backgroundColor: '#475569' };

    if (type === 'color') {
      label = getDeckColorName(key.split(''), 'en') || key;
      barStyle = getBarStyle(key);
    } else if (type === 'strategy') {
      label = getStrategyLabel(key);
      barStyle = { backgroundColor: '#ef4444' };
    }

    return (
      <tr key={key} className="hover:bg-slate-800/30">
        <td className="px-4 py-3 font-medium whitespace-nowrap">{label}</td>
        <td className="px-4 py-3">
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden w-full">
            <div 
              className="h-full rounded-full opacity-80"
              style={{ width: `${percent}%`, ...barStyle }}
            />
          </div>
        </td>
        <td className="px-4 py-3 text-right font-mono">{count}</td>
      </tr>
    );
  };

  return (
    <>
      {/* グリッドレイアウト: 4列に変更 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        
        {/* 1. 総数 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-900/20 rounded text-blue-400">
              <Database size={20} />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase">Total Decks</span>
          </div>
          <div className="text-4xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-2">
            Latest {stats.sampleSize} records
          </div>
        </div>

        {/* 2. 戦略 (Archetypes: Aggro/Control...) */}
        {/* 新しいセクションを追加 */}
        <StatCard 
          title="Archetypes" 
          icon={<Swords size={20} />} 
          data={stats.strategyStats} 
          type="strategy" 
        />

        {/* 3. 色の組み合わせ (Color Combos) */}
        <StatCard 
          title="Color Combos" 
          icon={<PieChart size={20} />} 
          data={stats.colorComboStats} 
          type="color" 
        />

        {/* 4. 人気セット */}
        <StatCard 
          title="Top Sets" 
          icon={<TrendingUp size={20} />} 
          data={stats.setStats} 
          type="set" 
        />
      </div>

      {/* --- モーダル --- */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950/50 rounded-t-xl">
              <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
                <Database size={18} className="text-blue-400"/>
                All {modalData.title} Stats
              </h3>
              <button 
                onClick={() => setModalData(null)}
                className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-500 uppercase bg-slate-800/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Label</th>
                    <th className="px-4 py-3 w-full">Distribution</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {modalData.data.map(({ key, count }) => 
                    renderModalRow(key, count, modalData.data[0].count, modalData.type)
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-3 border-t border-slate-700 bg-slate-950/30 text-right rounded-b-xl">
              <button 
                onClick={() => setModalData(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}