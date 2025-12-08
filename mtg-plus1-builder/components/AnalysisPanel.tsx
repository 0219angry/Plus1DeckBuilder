import { useState, useMemo } from "react";
import { DeckCard } from "@/types";
import { PieChart, BarChart3, TrendingUp, Filter } from "lucide-react";

type Props = {
  deck: DeckCard[]; // 親コンポーネントからはメインボードのみが渡される前提
};

// フィルターの定義
const FILTER_TYPES = [
  { label: "All Cards", value: "all" },
  { label: "Creatures", value: "creature" },
  { label: "Non-Creatures", value: "non-creature" },
  { label: "Instants / Sorceries", value: "spells" },
];

export default function AnalysisPanel({ deck }: Props) {
  const [filterType, setFilterType] = useState("all");

  const stats = useMemo(() => {
    // 0, 1, 2, 3, 4, 5, 6+ の7段階
    const curve = [0, 0, 0, 0, 0, 0, 0];
    const colors = { w: 0, u: 0, b: 0, r: 0, g: 0, c: 0 };
    let totalNonLands = 0;
    let totalLands = 0;
    let totalPips = 0;
    let totalCmc = 0;
    let filteredCount = 0; // フィルター後の枚数

    deck.forEach((card) => {
      // 1. まずフィルター条件で判定
      let isMatch = true;
      const typeLine = card.type_line;

      switch (filterType) {
        case "creature":
          isMatch = typeLine.includes("Creature");
          break;
        case "non-creature":
          isMatch = !typeLine.includes("Creature") && !typeLine.includes("Land");
          break;
        case "spells":
          isMatch = typeLine.includes("Instant") || typeLine.includes("Sorcery");
          break;
        case "all":
        default:
          isMatch = true;
          break;
      }

      if (!isMatch) return;

      filteredCount += card.quantity;

      // 2. 土地かどうかで集計を分岐
      if (card.type_line.includes("Land")) {
        totalLands += card.quantity;
      } else {
        // --- 呪文（スペル）の集計 ---
        
        // マナカーブ
        const cmc = Math.floor(card.cmc || 0);
        const index = Math.min(cmc, 6);
        curve[index] += card.quantity;
        totalNonLands += card.quantity;
        totalCmc += cmc * card.quantity;

        // 色マナシンボル (Pips)
        if (card.mana_cost) {
          colors.w += (card.mana_cost.match(/{W}/g) || []).length * card.quantity;
          colors.u += (card.mana_cost.match(/{U}/g) || []).length * card.quantity;
          colors.b += (card.mana_cost.match(/{B}/g) || []).length * card.quantity;
          colors.r += (card.mana_cost.match(/{R}/g) || []).length * card.quantity;
          colors.g += (card.mana_cost.match(/{G}/g) || []).length * card.quantity;
          colors.c += (card.mana_cost.match(/{C}/g) || []).length * card.quantity;
        }
      }
    });

    totalPips = Object.values(colors).reduce((a, b) => a + b, 0);
    // 平均マナコストはフィルターされた呪文に対して計算
    const avgCmc = totalNonLands > 0 ? (totalCmc / totalNonLands).toFixed(2) : "0.00";

    return { curve, colors, totalNonLands, totalLands, totalPips, avgCmc, filteredCount };
  }, [deck, filterType]);

  const maxCurve = Math.max(...stats.curve, 1);

  // カラー設定
  const colorConfig = [
    { key: "w", bg: "bg-[#f8e7b9]", bar: "bg-[#f8e7b9]", text: "text-[#f8e7b9]", label: "White" },
    { key: "u", bg: "bg-[#0e68ab]", bar: "bg-[#0e68ab]", text: "text-[#3a9df2]", label: "Blue" },
    { key: "b", bg: "bg-[#150b00]", bar: "bg-[#665a65]", text: "text-[#a69fa6]", label: "Black" },
    { key: "r", bg: "bg-[#d3202a]", bar: "bg-[#d3202a]", text: "text-[#f5565e]", label: "Red" },
    { key: "g", bg: "bg-[#00733e]", bar: "bg-[#00733e]", text: "text-[#1bc46e]", label: "Green" },
    { key: "c", bg: "bg-[#ccc2c0]", bar: "bg-[#ccc2c0]", text: "text-[#ccc2c0]", label: "Colorless" },
  ];

  return (
    <div className="h-full bg-slate-900/50 p-4 overflow-y-auto">
      
      {/* フィルター選択 */}
      <div className="mb-4">
        <label className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-2">
          <Filter size={12} /> Filter by Type (Mainboard)
        </label>
        <div className="flex flex-wrap gap-1">
          {FILTER_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`
                px-3 py-1.5 rounded text-xs font-bold transition-colors border
                ${filterType === type.value 
                  ? "bg-blue-600 border-blue-500 text-white" 
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                }
              `}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

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
          <div className="text-xs text-slate-400 mb-1">Count (Filtered)</div>
          <div className="text-2xl font-bold text-white flex items-end gap-2">
            {stats.filteredCount}
            {filterType === "all" && stats.totalLands > 0 && (
              <span className="text-sm font-normal text-slate-500 mb-1">
                ({stats.totalLands} Lands)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* マナカーブ (棒グラフ) */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-4">
          <BarChart3 size={18} /> マナカーブ (Mana Curve)
        </h2>
        
        <div className="h-40 flex items-end gap-2 px-2 pb-6 border-b border-slate-800 relative">
          {stats.curve.map((count, i) => {
            const heightPercent = (count / maxCurve) * 100;
            
            return (
              <div key={i} className="flex-1 h-full flex flex-col justify-end group relative">
                <div 
                  className={`
                    text-xs font-bold text-white bg-slate-700 px-1.5 py-0.5 rounded mb-1 text-center w-full
                    transition-all duration-300
                    ${count === 0 ? "opacity-0" : "opacity-100"}
                  `}
                >
                  {count}
                </div>

                <div className="w-full bg-slate-800 rounded-t relative overflow-hidden h-full max-h-full flex items-end">
                  <div 
                    className="w-full bg-blue-600 hover:bg-blue-500 transition-all duration-500 ease-out"
                    style={{ height: count > 0 ? `${heightPercent}%` : '0px' }}
                  />
                </div>

                <div className="absolute -bottom-6 w-full text-center text-xs font-bold text-slate-500">
                  {i === 6 ? "6+" : i}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 色配分 (シンボルカウント) */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-4">
          <PieChart size={18} /> 色配分 (Devotion)
        </h2>

        <div className="space-y-3">
          {colorConfig.map((c) => {
            const count = stats.colors[c.key as keyof typeof stats.colors];
            if (count === 0) return null;
            const percent = stats.totalPips > 0 ? (count / stats.totalPips) * 100 : 0;
            
            return (
              <div key={c.key} className="flex items-center gap-3 text-xs">
                <div className={`w-3 h-3 rounded-full ${c.bg} shrink-0 shadow-sm ring-1 ring-white/10`} />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className={`font-medium ${c.text}`}>{c.label}</span>
                    <span className="font-mono text-slate-400">{count} ({percent.toFixed(1)}%)</span>
                  </div>
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
              該当するカードがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}