import { useMemo } from "react";
import { DeckCard } from "@/types";
import { PieChart, BarChart3, TrendingUp } from "lucide-react";

type Props = {
  deck: DeckCard[];
};

export default function AnalysisPanel({ deck }: Props) {
  const stats = useMemo(() => {
    // 0, 1, 2, 3, 4, 5, 6+ の7段階
    const curve = [0, 0, 0, 0, 0, 0, 0];
    const colors = { w: 0, u: 0, b: 0, r: 0, g: 0, c: 0 };
    let totalNonLands = 0;
    let totalPips = 0;
    let totalCmc = 0;

    deck.forEach((card) => {
      // 1. マナカーブ (土地は通常含めない)
      if (!card.type_line.includes("Land")) {
        const cmc = Math.floor(card.cmc || 0);
        // 6以上は最後のバケットにまとめる
        const index = Math.min(cmc, 6);
        curve[index] += card.quantity;
        totalNonLands += card.quantity;
        totalCmc += cmc * card.quantity;
      }

      // 2. 色マナカウント (土地のマナシンボルも含む)
      if (card.mana_cost) {
        colors.w += (card.mana_cost.match(/{W}/g) || []).length * card.quantity;
        colors.u += (card.mana_cost.match(/{U}/g) || []).length * card.quantity;
        colors.b += (card.mana_cost.match(/{B}/g) || []).length * card.quantity;
        colors.r += (card.mana_cost.match(/{R}/g) || []).length * card.quantity;
        colors.g += (card.mana_cost.match(/{G}/g) || []).length * card.quantity;
        colors.c += (card.mana_cost.match(/{C}/g) || []).length * card.quantity;
      }
    });

    totalPips = Object.values(colors).reduce((a, b) => a + b, 0);
    const avgCmc = totalNonLands > 0 ? (totalCmc / totalNonLands).toFixed(2) : "0.00";

    return { curve, colors, totalNonLands, totalPips, avgCmc };
  }, [deck]);

  // グラフの最大値を計算（最低でも1ないとエラーになるためMath.maxで制御）
  const maxCurve = Math.max(...stats.curve, 1);

  return (
    <div className="h-full bg-slate-900/50 p-4 overflow-y-auto">
      
      {/* 概要ステータス */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800 p-3 rounded border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Avg. CMC</div>
          <div className="text-2xl font-bold text-white flex items-end gap-2">
            {stats.avgCmc}
            <TrendingUp size={16} className="text-blue-400 mb-1.5" />
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Non-Lands</div>
          <div className="text-2xl font-bold text-white">
            {stats.totalNonLands} <span className="text-sm font-normal text-slate-500">cards</span>
          </div>
        </div>
      </div>

      {/* マナカーブ (棒グラフ) */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-4">
          <BarChart3 size={18} /> マナカーブ (Mana Curve)
        </h2>
        
        {/* グラフ描画エリア: 高さ固定 (h-48) */}
        <div className="h-48 flex items-end gap-2 px-2 pb-6 border-b border-slate-800 relative">
          {stats.curve.map((count, i) => {
            // 高さの割合を計算
            const heightPercent = (count / maxCurve) * 100;
            
            return (
              <div key={i} className="flex-1 h-full flex flex-col justify-end group relative">
                {/* ツールチップ的な数値表示 */}
                <div 
                  className={`
                    text-xs font-bold text-white bg-slate-700 px-1.5 py-0.5 rounded mb-1 text-center w-full
                    transition-all duration-300
                    ${count === 0 ? "opacity-0" : "opacity-100"}
                  `}
                >
                  {count}
                </div>

                {/* バー本体 */}
                <div className="w-full bg-slate-800 rounded-t relative overflow-hidden h-full max-h-full flex items-end">
                  <div 
                    className="w-full bg-blue-600 hover:bg-blue-500 transition-all duration-500 ease-out"
                    style={{ height: count > 0 ? `${heightPercent}%` : '0px' }}
                  />
                </div>

                {/* X軸ラベル (絶対配置で下に固定) */}
                <div className="absolute -bottom-6 w-full text-center text-xs font-bold text-slate-500">
                  {i === 6 ? "6+" : i}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 色配分 (円グラフの代替としての帯グラフ) */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-4">
          <PieChart size={18} /> 色配分 (Color Stats)
        </h2>

        <div className="space-y-3">
          {[
            { key: "w", color: "bg-yellow-200", bar: "bg-yellow-400", label: "White" },
            { key: "u", color: "bg-blue-400", bar: "bg-blue-500", label: "Blue" },
            { key: "b", color: "bg-purple-800", bar: "bg-purple-600", label: "Black" },
            { key: "r", color: "bg-red-400", bar: "bg-red-500", label: "Red" },
            { key: "g", color: "bg-green-400", bar: "bg-green-500", label: "Green" },
            { key: "c", color: "bg-slate-400", bar: "bg-slate-300", label: "Colorless" },
          ].map((c) => {
            const count = stats.colors[c.key as keyof typeof stats.colors];
            if (count === 0) return null;
            const percent = stats.totalPips > 0 ? (count / stats.totalPips) * 100 : 0;
            
            return (
              <div key={c.key} className="flex items-center gap-3 text-xs">
                {/* ドットアイコン */}
                <div className={`w-3 h-3 rounded-full ${c.color} shrink-0 shadow-sm ring-1 ring-white/10`} />
                
                <div className="flex-1">
                  <div className="flex justify-between mb-1 text-slate-300">
                    <span className="font-medium">{c.label}</span>
                    <span className="font-mono text-slate-400">{count} ({percent.toFixed(1)}%)</span>
                  </div>
                  {/* プログレスバー */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${c.bar}`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          
          {stats.totalPips === 0 && (
            <div className="text-center text-slate-600 text-xs py-4 border border-dashed border-slate-800 rounded">
              カードがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}