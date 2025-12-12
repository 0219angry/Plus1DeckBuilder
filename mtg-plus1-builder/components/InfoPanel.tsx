import { Info, Plus, Trash2, Check } from "lucide-react";
import { TurnMove } from "@/types";

// 色定義データ
const MTG_COLORS = [
  { id: 'W', label: '白', class: 'bg-yellow-100 text-yellow-900 border-yellow-200 hover:bg-yellow-200' },
  { id: 'U', label: '青', class: 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600' },
  { id: 'B', label: '黒', class: 'bg-slate-800 text-slate-100 border-slate-900 hover:bg-slate-900' },
  { id: 'R', label: '赤', class: 'bg-red-500 text-white border-red-600 hover:bg-red-600' },
  { id: 'G', label: '緑', class: 'bg-green-600 text-white border-green-700 hover:bg-green-700' },
  { id: 'C', label: '無', class: 'bg-slate-400 text-white border-slate-500 hover:bg-slate-500' },
];

// カラーコンビネーション辞書（キーはWUBRG順にソートされた文字列）
const COLOR_NAMES: Record<string, { ja: string; en: string }> = {
  // 単色
  'W': { ja: '白単', en: 'Mono White' },
  'U': { ja: '青単', en: 'Mono Blue' },
  'B': { ja: '黒単', en: 'Mono Black' },
  'R': { ja: '赤単', en: 'Mono Red' },
  'G': { ja: '緑単', en: 'Mono Green' },
  'C': { ja: '無色', en: 'Colorless' },
  // 2色 (ギルド)
  'WU': { ja: 'アゾリウス', en: 'Azorius' },
  'UB': { ja: 'ディミーア', en: 'Dimir' },
  'BR': { ja: 'ラクドス', en: 'Rakdos' },
  'RG': { ja: 'グルール', en: 'Gruul' },
  'GW': { ja: 'セレズニア', en: 'Selesnya' },
  'WB': { ja: 'オルゾフ', en: 'Orzhov' },
  'UR': { ja: 'イゼット', en: 'Izzet' },
  'BG': { ja: 'ゴルガリ', en: 'Golgari' },
  'RW': { ja: 'ボロス', en: 'Boros' },
  'GU': { ja: 'シミック', en: 'Simic' },
  // 3色 (断片・氏族)
  'GWU': { ja: 'バント', en: 'Bant' },
  'WUB': { ja: 'エスパー', en: 'Esper' },
  'UBR': { ja: 'グリクシス', en: 'Grixis' },
  'BRG': { ja: 'ジャンド', en: 'Jund' },
  'RGW': { ja: 'ナヤ', en: 'Naya' },
  'WBG': { ja: 'アブザン', en: 'Abzan' },
  'WUR': { ja: 'ジェスカイ', en: 'Jeskai' },
  'UBG': { ja: 'スゥルタイ', en: 'Sultai' },
  'WBR': { ja: 'マルドゥ', en: 'Mardu' },
  'URG': { ja: 'ティムール', en: 'Temur' },
  // 4色
  'UBRG': { ja: '白抜き4C', en: 'Whiteless' },
  'BRGW': { ja: '青抜き4C', en: 'Blueless' },
  'RGWU': { ja: '黒抜き4C', en: 'Blackless' },
  'GWUB': { ja: '赤抜き4C', en: 'Redless' },
  'WUBR': { ja: '緑抜き4C', en: 'Greenless' },
  // 5色
  'WUBRG': { ja: '5C', en: '5-Color' },
};

type Props = {
  colors: string[];
  setColors: (v: string[]) => void;
  archetype: string; setArchetype: (v: string) => void;
  concepts: string; setConcepts: (v: string) => void;
  turnMoves: TurnMove[]; 
  setTurnMoves: (v: TurnMove[]) => void;
  showArchetype: boolean; setShowArchetype: (v: boolean) => void;
  showConcepts: boolean; setShowConcepts: (v: boolean) => void;
  showTurnMoves: boolean; setShowTurnMoves: (v: boolean) => void;
};

export default function InfoPanel({ 
  colors, setColors,
  archetype, setArchetype, 
  concepts, setConcepts, 
  turnMoves, setTurnMoves,
  showArchetype, setShowArchetype,
  showConcepts, setShowConcepts,
  showTurnMoves, setShowTurnMoves
}: Props) {

  // 色の並び順定義
  const sortOrder = ['W', 'U', 'B', 'R', 'G', 'C'];

  const addMove = () => {
    const nextTurn = (turnMoves.length + 1).toString();
    setTurnMoves([...turnMoves, { id: Date.now().toString(), turn: nextTurn, action: "" }]);
  };

  const removeMove = (id: string) => {
    setTurnMoves(turnMoves.filter(m => m.id !== id));
  };

  const updateMove = (id: string, field: "turn" | "action", value: string) => {
    setTurnMoves(turnMoves.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // 色のトグル処理
  const toggleColor = (colorId: string) => {
    let newColors: string[];
    if (colors.includes(colorId)) {
      newColors = colors.filter(c => c !== colorId);
    } else {
      newColors = [...colors, colorId];
    }
    // WUBRGCの順序でソート
    newColors.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));
    setColors(newColors);
  };

  // 現在の色の組み合わせ名を取得
  const getColorName = () => {
    if (colors.length === 0) return null;
    
    // 無色(C)が含まれていて、かつ他の色もある場合は、判定用にCを除外する（例: 青+無=青単タッチ無色 扱いなど）
    // ※ここではシンプルにキー生成に使用します。辞書にない組み合わせはそのまま結合します。
    const key = colors.join('');
    
    // 辞書から検索
    if (COLOR_NAMES[key]) {
      return COLOR_NAMES[key];
    }
    
    return { ja: key, en: '' }; // 未定義の組み合わせ（例: 無色+有色など）
  };

  const colorName = getColorName();

  return (
    <div className="h-full bg-slate-900/50 p-4 overflow-y-auto space-y-8">
      <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-2">
        <Info size={18} />
        <h2 className="text-sm font-bold">デッキ詳細情報 (Deck Info)</h2>
      </div>

      {/* カラー & アーキタイプ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300">カラー & アーキタイプ</label>
          <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-white select-none">
            <input 
              type="checkbox" 
              checked={showArchetype} 
              onChange={(e) => setShowArchetype(e.target.checked)}
              className="accent-blue-500 cursor-pointer"
            />
            画像に含める
          </label>
        </div>

        <div className={`space-y-4 transition-opacity ${!showArchetype ? "opacity-40 pointer-events-none" : ""}`}>
          
          {/* カラーピッカー */}
          <div className="space-y-2">
            <div className="flex gap-2">
              {MTG_COLORS.map((color) => {
                const isSelected = colors.includes(color.id);
                return (
                  <button
                    key={color.id}
                    onClick={() => toggleColor(color.id)}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2
                      ${color.class}
                      ${isSelected ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-40 grayscale-[0.3] hover:opacity-80 hover:scale-105'}
                    `}
                    title={color.label}
                  >
                    {isSelected && <Check size={14} strokeWidth={4} />}
                    {!isSelected && color.id}
                  </button>
                );
              })}
            </div>

            {/* 判定されたカラー名の表示 */}
            {colorName && (
              <div className="text-xs font-medium text-blue-300 bg-blue-900/30 border border-blue-800/50 rounded px-2 py-1 inline-flex items-center gap-2">
                 <span>{colorName.ja}</span>
                 {colorName.en && <span className="text-slate-500 text-[10px] font-normal">({colorName.en})</span>}
              </div>
            )}
          </div>

          {/* アーキタイプ名入力 */}
          <input
            type="text"
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
            placeholder="戦略名 (例: コントロール, ミッドレンジ, デルバー...)"
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600"
          />
          
          {/* プレビュー表示 */}
          <div className="text-[10px] text-slate-500 flex gap-1 items-center">
             <span>出力:</span>
             <span className="text-slate-300 font-bold">
               {colorName ? colorName.ja : ""} {archetype}
             </span>
          </div>
        </div>
      </div>

      {/* コンセプト */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300">構築コンセプト / キーポイント</label>
          <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-white select-none">
            <input 
              type="checkbox" 
              checked={showConcepts} 
              onChange={(e) => setShowConcepts(e.target.checked)}
              className="accent-blue-500 cursor-pointer"
            />
            画像に含める
          </label>
        </div>
        <textarea
          value={concepts}
          onChange={(e) => setConcepts(e.target.value)}
          placeholder="例: ○○と××のコンボを狙う。メタゲームに合わせて除去を多めに採用..."
          disabled={!showConcepts}
          className={`w-full h-24 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none resize-none transition-opacity ${!showConcepts ? "opacity-40" : ""}`}
        />
      </div>

      {/* タイムライン */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <label className="text-xs font-bold text-slate-300">ゲームプラン (Game Plan)</label>
          <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-white select-none">
            <input 
              type="checkbox" 
              checked={showTurnMoves} 
              onChange={(e) => setShowTurnMoves(e.target.checked)}
              className="accent-blue-500 cursor-pointer"
            />
            画像に含める
          </label>
        </div>
        
        <div className={`relative pl-4 border-l-2 border-slate-700 space-y-6 transition-opacity ${!showTurnMoves ? "opacity-40 pointer-events-none" : ""}`}>
          {turnMoves.map((move) => (
            <div key={move.id} className="relative group">
              <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900 shadow-[0_0_0_2px_#334155]"></div>
              
              <div className="flex gap-2 items-start">
                <div className="w-12 shrink-0">
                  <input
                    type="text"
                    value={move.turn}
                    onChange={(e) => updateMove(move.id, "turn", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-center text-xs font-bold text-blue-300 focus:border-blue-500 outline-none"
                    placeholder="T"
                  />
                </div>

                <div className="flex-1">
                  <textarea
                    value={move.action}
                    onChange={(e) => updateMove(move.id, "action", e.target.value)}
                    placeholder="動きを入力..."
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white focus:border-blue-500 outline-none resize-none min-h-[60px]"
                  />
                </div>

                <button 
                  onClick={() => removeMove(move.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          <div className="relative pt-2">
            <div className="absolute -left-[20px] top-4 w-2 h-2 rounded-full bg-slate-700"></div>
            <button
              onClick={addMove}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-slate-800/50"
            >
              <Plus size={14} /> ステップを追加
            </button>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 pt-4 border-t border-slate-800">
        ※ チェックを入れた項目のみ、画像保存時にサイドボードの下に出力されます。
      </div>
    </div>
  );
}