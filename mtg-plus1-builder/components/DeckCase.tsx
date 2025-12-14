import { ReactNode } from "react";
import { Clock } from "lucide-react";
import { getDeckColorName, getDeckGradientStyle } from "@/lib/mtg"; // 作成した関数
import ManaSymbol from "./ManaSymbol"; // 作成したコンポーネント

type DeckProps = {
  id: string;
  name: string;
  selectedSet: string;
  language: string;
  createdAt: string;
  colors: string[]; // ['U', 'R'] など
};

export default function DeckCard({ deck, children }: { deck: DeckProps, children?: ReactNode }) {
  // グラデーションスタイルの取得
  const gradientStyle = getDeckGradientStyle(deck.colors);
  
  // デッキカラー名 (例: "イゼット")
  const deckColorName = getDeckColorName(deck.colors, 'ja');

  return (
    <div 
      className="group relative bg-slate-900/80 rounded-xl p-5 transition-all duration-300 flex flex-col hover:shadow-lg hover:-translate-y-1 border border-slate-800"
      style={gradientStyle} // ★ここで枠線の色を適用
    >
      {/* ホバー時の光エフェクト */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />

      {/* ヘッダー情報 */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg truncate pr-2 group-hover:text-blue-400 transition-colors">
            {deck.name}
          </h3>
          
          <div className="flex items-center gap-2 mt-2">
            {/* セット名・言語 */}
            <span className="bg-slate-950/50 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-800 uppercase tracking-wide">
              {deck.selectedSet}
            </span>
            <span className="bg-slate-950/50 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-800 uppercase tracking-wide">
              {deck.language}
            </span>

            {/* 区切り線 */}
            <div className="h-4 w-px bg-slate-700 mx-1"></div>

            {/* マナシンボルとデッキタイプ名 */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {deck.colors.length > 0 ? (
                  // WUBRG順に並び替えて表示したい場合はここでもソート処理を入れる
                  // (getDeckGradientStyle内でソートしていますが、表示用にも必要なら)
                  ['W','U','B','R','G','C']
                    .filter(c => deck.colors.includes(c))
                    .map(c => <ManaSymbol key={c} color={c} />)
                ) : (
                  <ManaSymbol color="C" />
                )}
              </div>
              
              {/* デッキタイプ名（イゼット、エスパーなど） */}
              {deckColorName && (
                <span className="text-xs text-slate-400 font-medium">
                  {deckColorName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* フッター情報 & アクションボタン */}
      <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Clock size={12} />
          {new Date(deck.createdAt).toLocaleDateString()}
        </div>
        
        <div className="flex gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}