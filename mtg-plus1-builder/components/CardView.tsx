import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, DeckCard } from "@/types";
import { PlusCircle, MinusCircle } from "lucide-react";
import ManaCost from "./ManaCost";

type Props<T extends Card> = {
  cards: T[];
  mode: "grid" | "list";
  onAction: (card: T) => void;
  actionType: "add" | "remove";
  isDeckArea?: boolean;
};

// 【修正】sideプロパティを追加（矢印の位置調整用）
const PortalPopup = ({ 
  imageUrl, 
  position, 
  side 
}: { 
  imageUrl: string, 
  position: { top: number, left: number },
  side: "left" | "right" 
}) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-[9999] w-64 pointer-events-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-150"
      style={{ top: position.top, left: position.left }}
    >
      {/* 矢印の表示位置を side によって切り替え */}
      <div 
        className={`
          absolute top-6 w-4 h-4 bg-slate-900 rotate-45 border-slate-600
          ${side === "right" 
            ? "-left-2 border-l border-b"  // 右に出る時＝矢印は左
            : "-right-2 border-r border-t" // 左に出る時＝矢印は右
          }
        `}
      ></div>
      
      <img
        src={imageUrl}
        alt="Card Image"
        className="w-full rounded-xl border-2 border-slate-600 bg-slate-900"
      />
    </div>,
    document.body
  );
};

export default function CardView<T extends Card>({
  cards,
  mode,
  onAction,
  actionType,
  isDeckArea = false,
}: Props<T>) {

  const getImageUrl = (card: Card) => {
    if (card.image_uris?.normal) return card.image_uris.normal;
    if (card.card_faces && card.card_faces[0]?.image_uris?.normal) {
      return card.card_faces[0].image_uris.normal;
    }
    return undefined;
  };

  const getManaCost = (card: Card) => {
    if (card.mana_cost) return card.mana_cost;
    if (card.card_faces && card.card_faces[0]?.mana_cost) {
      return card.card_faces[0].mana_cost;
    }
    return undefined;
  };

  const [hoveredImageUrl, setHoveredImageUrl] = useState<string | null>(null);
  
  // 【修正】位置情報に side ("left" | "right") を追加
  const [popupState, setPopupState] = useState<{ top: number, left: number, side: "left" | "right" } | null>(null);
  
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLLIElement>, imageUrl: string | undefined) => {
    if (!imageUrl) return;
    
    const target = e.currentTarget;
    
    hoverTimeout.current = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const POPUP_WIDTH = 256; // w-64 = 16rem = 256px
      const GAP = 12;
      const windowWidth = window.innerWidth;

      // デフォルトは右側に表示
      let left = rect.right + GAP;
      let side: "left" | "right" = "right";

      // もし右端からはみ出るなら、左側に表示する
      if (left + POPUP_WIDTH > windowWidth) {
        left = rect.left - POPUP_WIDTH - GAP;
        side = "left";
      }

      setPopupState({
        top: rect.top - 40, 
        left: left,
        side: side
      });
      setHoveredImageUrl(imageUrl);
    }, 200); 
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredImageUrl(null);
    setPopupState(null);
  };

  if (mode === "grid") {
    // ... (gridモードは変更なし) ...
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 p-2 pb-20">
        {cards.map((card, idx) => {
          const quantity = "quantity" in card ? (card as DeckCard).quantity : 0;
          const imageUrl = getImageUrl(card);
          const manaCost = getManaCost(card);

          return (
            <div
              key={`${card.id}-${idx}`}
              onClick={() => onAction(card)}
              className="cursor-pointer hover:scale-105 transition-transform relative group"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={card.name}
                  className="rounded w-full shadow-md"
                  loading="lazy"
                />
              ) : (
                <div className="aspect-[5/7] bg-slate-800 flex items-center justify-center rounded p-2 text-center text-sm border border-slate-700">
                  {card.printed_name ?? card.name}
                </div>
              )}
              
              {manaCost && (
                <div className="absolute top-1 left-1 bg-black/60 rounded px-1 py-0.5 backdrop-blur-sm shadow-sm">
                  <ManaCost manaCost={manaCost} size="sm" />
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded z-10">
                {actionType === "remove" ? (
                  <MinusCircle className="text-red-400 w-10 h-10 drop-shadow-lg" />
                ) : (
                  <PlusCircle className="text-white w-10 h-10 drop-shadow-lg" />
                )}
              </div>
              {isDeckArea && quantity > 0 && (
                <div className="absolute bottom-2 left-2 bg-black/80 text-white font-bold px-2 py-0.5 rounded text-sm shadow-md z-20 pointer-events-none">
                  ×{quantity}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // リスト表示モード
  return (
    <>
      <ul className="space-y-1 p-2 pb-20">
        {cards.map((card, idx) => {
          const quantity = "quantity" in card ? (card as DeckCard).quantity : 0;
          const manaCost = getManaCost(card);
          const imageUrl = getImageUrl(card);

          return (
            <li
              key={`${card.id}-${idx}`}
              onMouseEnter={(e) => handleMouseEnter(e, imageUrl)}
              onMouseLeave={handleMouseLeave}
              onClick={() => onAction(card)}
              className="relative flex justify-between items-center bg-slate-800/80 p-2 rounded border border-transparent hover:border-slate-600 hover:bg-slate-700 cursor-pointer group select-none transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                {isDeckArea && quantity > 0 && (
                  <span className="font-bold text-blue-300 w-6 shrink-0 text-right">
                    {quantity}x
                  </span>
                )}
                
                <div className="w-20 shrink-0 flex justify-end">
                  <ManaCost manaCost={manaCost} />
                </div>
                
                <span className="truncate font-medium text-slate-200">
                  {card.printed_name ?? card.name}
                </span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded uppercase border border-slate-800">
                  {card.set}
                </span>
                <button className="text-slate-500 hover:text-white p-1 transition-colors">
                  {actionType === "remove" ? (
                    <MinusCircle size={16} className="text-red-400" />
                  ) : (
                    <PlusCircle size={16} />
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* 【修正】popupState を使って表示 */}
      {hoveredImageUrl && popupState && (
        <PortalPopup 
           imageUrl={hoveredImageUrl} 
           position={popupState} 
           side={popupState.side} // sideを渡す
        />
      )}
    </>
  );
}