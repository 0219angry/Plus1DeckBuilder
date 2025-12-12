import { Info, Plus, Trash2 } from "lucide-react";
import { TurnMove } from "@/types"

type Props = {
  archetype: string; setArchetype: (v: string) => void;
  concepts: string; setConcepts: (v: string) => void;
  
  // 配列型に変更
  turnMoves: TurnMove[]; 
  setTurnMoves: (v: TurnMove[]) => void;
  
  // 表示設定用Props
  showArchetype: boolean; setShowArchetype: (v: boolean) => void;
  showConcepts: boolean; setShowConcepts: (v: boolean) => void;
  showTurnMoves: boolean; setShowTurnMoves: (v: boolean) => void;
};

export default function InfoPanel({ 
  archetype, setArchetype, 
  concepts, setConcepts, 
  turnMoves, setTurnMoves,
  showArchetype, setShowArchetype,
  showConcepts, setShowConcepts,
  showTurnMoves, setShowTurnMoves
}: Props) {

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

  return (
    <div className="h-full bg-slate-900/50 p-4 overflow-y-auto space-y-8">
      <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-2">
        <Info size={18} />
        <h2 className="text-sm font-bold">デッキ詳細情報 (Deck Info)</h2>
      </div>

      {/* アーキタイプ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300">アーキタイプ / デッキタイプ</label>
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
        <input
          type="text"
          value={archetype}
          onChange={(e) => setArchetype(e.target.value)}
          placeholder="例: 赤単アグロ, 青白コントロール..."
          disabled={!showArchetype}
          className={`w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none transition-opacity ${!showArchetype ? "opacity-40" : ""}`}
        />
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

      {/* タイムライン (ここが配列データを扱う部分です) */}
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
              {/* タイムラインのドット */}
              <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900 shadow-[0_0_0_2px_#334155]"></div>
              
              <div className="flex gap-2 items-start">
                {/* ターン数入力 */}
                <div className="w-12 shrink-0">
                  <input
                    type="text"
                    value={move.turn}
                    onChange={(e) => updateMove(move.id, "turn", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-center text-xs font-bold text-blue-300 focus:border-blue-500 outline-none"
                    placeholder="T"
                  />
                </div>

                {/* アクション入力 */}
                <div className="flex-1">
                  <textarea
                    value={move.action}
                    onChange={(e) => updateMove(move.id, "action", e.target.value)}
                    placeholder="動きを入力..."
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