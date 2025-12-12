import { Info, Plus, Trash2, Check, ChevronDown, Languages, Search, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { TurnMove } from "@/types";
import { MTG_COLORS, getDeckColorName } from "@/lib/mtg";

const ARCHETYPES_DATA = [
  { id: 'aggro', ja: 'アグロ', en: 'Aggro' },
  { id: 'control', ja: 'コントロール', en: 'Control' },
  { id: 'midrange', ja: 'ミッドレンジ', en: 'Midrange' },
  { id: 'combo', ja: 'コンボ', en: 'Combo' },
  { id: 'ramp', ja: 'ランプ', en: 'Ramp' },
  { id: 'tempo', ja: 'テンポ', en: 'Tempo' },
  { id: 'clock_permission', ja: 'クロック・パーミッション', en: 'Clock Permission' },
  { id: 'reanimate', ja: 'リアニメイト', en: 'Reanimate' },
  { id: 'stompy', ja: 'ストンピィ', en: 'Stompy' },
  { id: 'tokens', ja: 'トークン', en: 'Tokens' },
  { id: 'tribal', ja: '部族', en: 'Tribal' },
  { id: 'burn', ja: 'バーン', en: 'Burn' },
  { id: 'prowess', ja: '果敢', en: 'Prowess' },
  { id: 'sacrifice', ja: 'サクリファイス', en: 'Sacrifice' },
  { id: 'artifacts', ja: 'アーティファクト', en: 'Artifacts' },
  { id: 'enchantments', ja: 'エンチャント', en: 'Enchantments' },
  { id: 'mill', ja: 'ライブラリーアウト', en: 'Mill' },
];

type Props = {
  colors: string[];
  setColors: (v: string[]) => void;
  builderName: string;
  setBuilderName: (v: string) => void;
  archetype: string; setArchetype: (v: string) => void;
  concepts: string; setConcepts: (v: string) => void;
  turnMoves: TurnMove[]; 
  setTurnMoves: (v: TurnMove[]) => void;
  showArchetype: boolean; setShowArchetype: (v: boolean) => void;
  showConcepts: boolean; setShowConcepts: (v: boolean) => void;
  showTurnMoves: boolean; setShowTurnMoves: (v: boolean) => void;
  readOnly?: boolean; // ★追加
};

export default function InfoPanel({ 
  colors, setColors,
  builderName, setBuilderName,
  archetype, setArchetype, 
  concepts, setConcepts, 
  turnMoves, setTurnMoves,
  showArchetype, setShowArchetype,
  showConcepts, setShowConcepts,
  showTurnMoves, setShowTurnMoves,
  readOnly = false // デフォルトfalse
}: Props) {

  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [isArchetypeOpen, setIsArchetypeOpen] = useState(false);
  const archetypeRef = useRef<HTMLDivElement>(null);
  const sortOrder = ['W', 'U', 'B', 'R', 'G', 'C'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (archetypeRef.current && !archetypeRef.current.contains(event.target as Node)) {
        setIsArchetypeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const toggleColor = (colorId: string) => {
    if (readOnly) return; // ReadOnly時は無効
    let newColors: string[];
    if (colors.includes(colorId)) {
      newColors = colors.filter(c => c !== colorId);
    } else {
      newColors = [...colors, colorId];
    }
    newColors.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));
    setColors(newColors);
  };

  const displayColorName = getDeckColorName(colors, lang);

  const toggleLanguage = () => {
    const nextLang = lang === 'ja' ? 'en' : 'ja';
    setLang(nextLang);
    const currentEntry = ARCHETYPES_DATA.find(d => d.ja === archetype || d.en === archetype);
    if (currentEntry) {
      // 閲覧モードでは表示言語を変えるだけで、データを書き換えるべきではないが
      // ここではsetArchetypeを呼んでいるため、readOnlyなら呼ばないようにする
      if (!readOnly) {
          setArchetype(currentEntry[nextLang]);
      }
    }
  };

  const handleSelectArchetype = (value: string) => {
    setArchetype(value);
    setIsArchetypeOpen(false);
  };

  const filteredArchetypes = ARCHETYPES_DATA.filter(d => {
    const searchStr = archetype.toLowerCase();
    return d.ja.toLowerCase().includes(searchStr) || d.en.toLowerCase().includes(searchStr);
  });

  return (
    <div className="h-full bg-slate-900/50 p-4 overflow-y-auto space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-slate-400">
          <Info size={18} />
          <h2 className="text-sm font-bold">デッキ詳細情報</h2>
        </div>
        {!readOnly && (
            <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors border border-slate-700"
            title="Switch Language"
            >
            <Languages size={12} />
            <span>{lang === 'ja' ? '日本語' : 'English'}</span>
            </button>
        )}
      </div>

      {/* 製作者名入力エリア (ReadOnly対応) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <User size={14} />
          製作者 (Creator)
        </label>
        {readOnly ? (
             <div className="w-full bg-slate-800/50 border border-slate-800 rounded p-2 text-sm text-white min-h-[38px] flex items-center">
                 {builderName || <span className="text-slate-600 italic">Unknown</span>}
             </div>
        ) : (
            <input
            type="text"
            value={builderName}
            onChange={(e) => setBuilderName(e.target.value)}
            placeholder="あなたの名前 (Optional)"
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600"
            />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300">カラー & アーキタイプ</label>
          {!readOnly && (
            <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-white select-none">
                <input 
                type="checkbox" 
                checked={showArchetype} 
                onChange={(e) => setShowArchetype(e.target.checked)}
                className="accent-blue-500 cursor-pointer"
                />
                画像に含める
            </label>
          )}
        </div>

        <div className={`space-y-4 transition-opacity ${!showArchetype && !readOnly ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="space-y-2">
            <div className="flex gap-2">
              {MTG_COLORS.map((color) => {
                const isSelected = colors.includes(color.id);
                return (
                  <button
                    key={color.id}
                    onClick={() => toggleColor(color.id)}
                    disabled={readOnly} // ★追加
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2
                      ${color.class}
                      ${isSelected ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-40 grayscale-[0.3]'}
                      ${!readOnly && !isSelected ? 'hover:opacity-80 hover:scale-105' : ''}
                      ${readOnly ? 'cursor-default' : ''}
                    `}
                    title={color.label}
                  >
                    {isSelected && <Check size={14} strokeWidth={4} />}
                    {!isSelected && color.id}
                  </button>
                );
              })}
            </div>
            {displayColorName && (
              <div className="text-xs font-medium text-blue-300 bg-blue-900/30 border border-blue-800/50 rounded px-2 py-1 inline-flex items-center gap-2 animate-in fade-in slide-in-from-left-1">
                  <span>{displayColorName}</span>
              </div>
            )}
          </div>

          <div className="relative" ref={archetypeRef}>
            {readOnly ? (
                <div className="w-full bg-slate-800/50 border border-slate-800 rounded p-2 text-sm text-white min-h-[38px] flex items-center">
                    {archetype || <span className="text-slate-600 italic">No archetype selected</span>}
                </div>
            ) : (
                <div className="relative group">
                <input
                    type="text"
                    value={archetype}
                    onChange={(e) => {
                    setArchetype(e.target.value);
                    setIsArchetypeOpen(true);
                    }}
                    onFocus={() => setIsArchetypeOpen(true)}
                    placeholder={lang === 'ja' ? "戦略名を選択 または 入力..." : "Select or type strategy..."}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 pl-9 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600 transition-colors"
                />
                <Search className="absolute left-2.5 top-2.5 text-slate-500 pointer-events-none" size={14} />
                <button 
                    onClick={() => setIsArchetypeOpen(!isArchetypeOpen)}
                    className="absolute right-1 top-1 p-1.5 text-slate-500 hover:text-white rounded hover:bg-slate-700 transition-colors"
                >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isArchetypeOpen ? 'rotate-180' : ''}`} />
                </button>
                </div>
            )}
            
            {!readOnly && isArchetypeOpen && (
              <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                {filteredArchetypes.length > 0 ? (
                  <ul className="py-1">
                    {filteredArchetypes.map((d) => (
                      <li 
                        key={d.id}
                        onClick={() => handleSelectArchetype(d[lang])}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-600 hover:text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 group transition-colors"
                      >
                        <span className="text-sm font-medium">{d[lang]}</span>
                        <span className="text-[10px] text-slate-500 group-hover:text-blue-200">
                          {lang === 'ja' ? d.en : d.ja}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-4 text-center text-xs text-slate-500">
                    <p>候補が見つかりません</p>
                    <p className="text-[10px] opacity-70 mt-1">"{archetype}" がそのまま使用されます</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* ReadOnly時はプレビュー不要 (上の表示と重複するため) */}
          {!readOnly && (
            <div className="text-[10px] text-slate-500 flex gap-1 items-center bg-slate-900/50 p-2 rounded border border-slate-800/50">
                <span>Preview:</span>
                <span className="text-slate-300 font-bold break-all">
                {displayColorName} {archetype}
                </span>
            </div>
          )}
        </div>
      </div>

      {/* コンセプト (ReadOnly対応) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300">構築コンセプト / キーポイント</label>
          {!readOnly && (
            <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-white select-none">
                <input 
                type="checkbox" 
                checked={showConcepts} 
                onChange={(e) => setShowConcepts(e.target.checked)}
                className="accent-blue-500 cursor-pointer"
                />
                画像に含める
            </label>
          )}
        </div>
        
        {readOnly ? (
            <div className="w-full min-h-[6rem] bg-slate-800/50 border border-slate-800 rounded p-2 text-sm text-white whitespace-pre-wrap">
                {concepts || <span className="text-slate-600 italic">No description provided.</span>}
            </div>
        ) : (
            <textarea
            value={concepts}
            onChange={(e) => setConcepts(e.target.value)}
            placeholder={lang === 'ja' ? "例: ○○と××のコンボを狙う..." : "Ex: Combo with A and B..."}
            disabled={!showConcepts}
            className={`w-full h-24 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none resize-none transition-opacity ${!showConcepts ? "opacity-40" : ""}`}
            />
        )}
      </div>

      {/* ゲームプラン (ReadOnly対応) */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <label className="text-xs font-bold text-slate-300">ゲームプラン (Game Plan)</label>
          {!readOnly && (
            <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-white select-none">
                <input 
                type="checkbox" 
                checked={showTurnMoves} 
                onChange={(e) => setShowTurnMoves(e.target.checked)}
                className="accent-blue-500 cursor-pointer"
                />
                画像に含める
            </label>
          )}
        </div>
        <div className={`relative pl-4 border-l-2 border-slate-700 space-y-6 transition-opacity ${!showTurnMoves && !readOnly ? "opacity-40 pointer-events-none" : ""}`}>
          {turnMoves.length > 0 ? (
            turnMoves.map((move) => (
                <div key={move.id} className="relative group">
                <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900 shadow-[0_0_0_2px_#334155]"></div>
                <div className="flex gap-2 items-start">
                    <div className="w-12 shrink-0">
                    {readOnly ? (
                         <div className="w-full bg-slate-800/50 border border-slate-800 rounded p-1.5 text-center text-xs font-bold text-blue-300">
                             {move.turn}
                         </div>
                    ) : (
                        <input
                        type="text"
                        value={move.turn}
                        onChange={(e) => updateMove(move.id, "turn", e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-center text-xs font-bold text-blue-300 focus:border-blue-500 outline-none"
                        placeholder="T"
                        />
                    )}
                    </div>
                    <div className="flex-1">
                    {readOnly ? (
                        <div className="w-full bg-slate-800/50 border border-slate-800 rounded p-2 text-xs text-white min-h-[38px] whitespace-pre-wrap">
                            {move.action}
                        </div>
                    ) : (
                        <textarea
                        value={move.action}
                        onChange={(e) => updateMove(move.id, "action", e.target.value)}
                        placeholder={lang === 'ja' ? "動きを入力..." : "Action..."}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white focus:border-blue-500 outline-none resize-none min-h-[60px]"
                        />
                    )}
                    </div>
                    {!readOnly && (
                        <button 
                        onClick={() => removeMove(move.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                        <Trash2 size={14} />
                        </button>
                    )}
                </div>
                </div>
            ))
          ) : (
              readOnly && <div className="text-xs text-slate-600 italic">No game plan defined.</div>
          )}
          
          {!readOnly && (
            <div className="relative pt-2">
                <div className="absolute -left-[20px] top-4 w-2 h-2 rounded-full bg-slate-700"></div>
                <button
                onClick={addMove}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-slate-800/50"
                >
                <Plus size={14} /> {lang === 'ja' ? "ステップを追加" : "Add Step"}
                </button>
            </div>
          )}
        </div>
      </div>
      {!readOnly && (
        <div className="text-[10px] text-slate-500 pt-4 border-t border-slate-800">
            ※ チェックを入れた項目のみ、画像保存時にサイドボードの下に出力されます。
        </div>
      )}
    </div>
  );
}