import { Info, Plus, Trash2, Check, ChevronDown, Languages } from "lucide-react";
import { useState } from "react";
import { TurnMove } from "@/types";

// ------------------------------------------------------------------
// 定数データ定義
// ------------------------------------------------------------------

// 1. カラー定義
const MTG_COLORS = [
  { id: 'W', label: '白', class: 'bg-yellow-100 text-yellow-900 border-yellow-200 hover:bg-yellow-200' },
  { id: 'U', label: '青', class: 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600' },
  { id: 'B', label: '黒', class: 'bg-slate-800 text-slate-100 border-slate-900 hover:bg-slate-900' },
  { id: 'R', label: '赤', class: 'bg-red-500 text-white border-red-600 hover:bg-red-600' },
  { id: 'G', label: '緑', class: 'bg-green-600 text-white border-green-700 hover:bg-green-700' },
  { id: 'C', label: '無', class: 'bg-slate-400 text-white border-slate-500 hover:bg-slate-500' },
];

// 2. カラーの組み合わせ名称 (キーはWUBRGC順にソート済みであること)
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
  // 4色 (Sans-X)
  'UBRG': { ja: '白抜き4色', en: 'Whiteless' },
  'BRGW': { ja: '青抜き4色', en: 'Blueless' },
  'RGWU': { ja: '黒抜き4色', en: 'Blackless' },
  'GWUB': { ja: '赤抜き4色', en: 'Redless' },
  'WUBR': { ja: '緑抜き4色', en: 'Greenless' },
  // 5色
  'WUBRG': { ja: '5色', en: '5-Color' },
};

// 3. アーキタイプ定型文リスト
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
];

// ------------------------------------------------------------------
// コンポーネント定義
// ------------------------------------------------------------------

type Props = {
  // 色情報
  colors: string[];
  setColors: (v: string[]) => void;

  // テキスト情報
  archetype: string; setArchetype: (v: string) => void;
  concepts: string; setConcepts: (v: string) => void;
  
  // タイムライン情報
  turnMoves: TurnMove[]; 
  setTurnMoves: (v: TurnMove[]) => void;
  
  // 表示設定
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

  // 言語設定ステート (ja | en)
  const [lang, setLang] = useState<'ja' | 'en'>('ja');

  // 色ソート順定義
  const sortOrder = ['W', 'U', 'B', 'R', 'G', 'C'];

  // --- ヘルパー関数 ---

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

  // 色トグル & 自動ソート
  const toggleColor = (colorId: string) => {
    let newColors: string[];
    if (colors.includes(colorId)) {
      newColors = colors.filter(c => c !== colorId);
    } else {
      newColors = [...colors, colorId];
    }
    // WUBRGC順にソート
    newColors.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));
    setColors(newColors);
  };

  // 現在のカラー名を取得 (言語設定反映)
  const getColorName = () => {
    if (colors.length === 0) return null;
    const key = colors.join('');
    // 辞書にあればその言語、なければキーそのものを返す
    return COLOR_NAMES[key] ? COLOR_NAMES[key][lang] : key;
  };
  
  const displayColorName = getColorName();

  // 言語切り替え & アーキタイプ自動翻訳
  const toggleLanguage = () => {
    const nextLang = lang === 'ja' ? 'en' : 'ja';
    setLang(nextLang);

    // 入力中のアーキタイプが定型文リストにある場合、言語に合わせて置換する
    const currentEntry = ARCHETYPES_DATA.find(d => d.ja === archetype || d.en === archetype);
    if (currentEntry) {
      setArchetype(currentEntry[nextLang]);
    }
  };

  // --- レンダリング ---

  return (
    <div className="h-full bg-slate-900/50 p-4 overflow-y-auto space-y-8">
      
      {/* ヘッダー & 言語切り替え */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-slate-400">
          <Info size={18} />
          <h2 className="text-sm font-bold">デッキ詳細情報</h2>
        </div>
        
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors border border-slate-700"
          title="Switch Language"
        >
          <Languages size={12} />
          <span>{lang === 'ja' ? '日本語' : 'English'}</span>
        </button>
      </div>

      {/* 1. カラー & アーキタイプ */}
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

            {/* カラー名バッジ */}
            {displayColorName && (
              <div className="text-xs font-medium text-blue-300 bg-blue-900/30 border border-blue-800/50 rounded px-2 py-1 inline-flex items-center gap-2">
                 <span>{displayColorName}</span>
              </div>
            )}
          </div>

          {/* アーキタイプ入力 (datalist) */}
          <div className="relative group">
            <input
              type="text"
              list="archetype-list"
              value={archetype}
              onChange={(e) => setArchetype(e.target.value)}
              placeholder={lang === 'ja' ? "戦略名を選択 または 入力..." : "Select or type strategy..."}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600 pr-8"
            />
            <ChevronDown className="absolute right-2 top-2.5 text-slate-500 pointer-events-none" size={16} />
            
            {/* 言語に応じた候補リスト */}
            <datalist id="archetype-list">
              {ARCHETYPES_DATA.map((d) => (
                <option key={d.id} value={d[lang]} />
              ))}
            </datalist>
          </div>
          
          {/* プレビュー */}
          <div className="text-[10px] text-slate-500 flex gap-1 items-center">
             <span>Preview:</span>
             <span className="text-slate-300 font-bold">
               {displayColorName} {archetype}
             </span>
          </div>
        </div>
      </div>

      {/* 2. コンセプト */}
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
          placeholder={lang === 'ja' ? "例: ○○と××のコンボを狙う..." : "Ex: Combo with A and B..."}
          disabled={!showConcepts}
          className={`w-full h-24 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none resize-none transition-opacity ${!showConcepts ? "opacity-40" : ""}`}
        />
      </div>

      {/* 3. タイムライン */}
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
              {/* ドット装飾 */}
              <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900 shadow-[0_0_0_2px_#334155]"></div>
              
              <div className="flex gap-2 items-start">
                {/* ターン数 */}
                <div className="w-12 shrink-0">
                  <input
                    type="text"
                    value={move.turn}
                    onChange={(e) => updateMove(move.id, "turn", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-center text-xs font-bold text-blue-300 focus:border-blue-500 outline-none"
                    placeholder="T"
                  />
                </div>

                {/* アクション内容 */}
                <div className="flex-1">
                  <textarea
                    value={move.action}
                    onChange={(e) => updateMove(move.id, "action", e.target.value)}
                    placeholder={lang === 'ja' ? "動きを入力..." : "Action..."}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white focus:border-blue-500 outline-none resize-none min-h-[60px]"
                  />
                </div>

                {/* 削除ボタン */}
                <button 
                  onClick={() => removeMove(move.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* 追加ボタン */}
          <div className="relative pt-2">
            <div className="absolute -left-[20px] top-4 w-2 h-2 rounded-full bg-slate-700"></div>
            <button
              onClick={addMove}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-slate-800/50"
            >
              <Plus size={14} /> {lang === 'ja' ? "ステップを追加" : "Add Step"}
            </button>
          </div>
        </div>
      </div>

      <div className="text-[12px] text-slate-500 pt-4 border-t border-slate-800">
        ※ チェックを入れた項目のみ、画像保存時にサイドボードの下に出力されます。
      </div>
    </div>
  );
}