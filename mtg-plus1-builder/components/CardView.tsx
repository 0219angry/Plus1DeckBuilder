import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, DeckCard } from "@/types";
import { PlusCircle, MinusCircle, AlertTriangle, Plus, Minus, Star, Ban } from "lucide-react";
import ManaCost from "./ManaCost";

type Props<T extends Card> = {
  cards: T[];
  mode: "grid" | "list";
  onAction: (card: T) => void;
  onQuantityChange?: (card: T, amount: number) => void; 
  actionType: "add" | "remove";
  isDeckArea?: boolean;
  validationErrors?: Record<string, string>;
  keyCardIds?: string[];
  onToggleKeyCard?: (id: string) => void;
};

// --- カード画像プレビュー用ポータル ---
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
      <div 
        className={`
          absolute top-6 w-4 h-4 bg-slate-900 rotate-45 border-slate-600
          ${side === "right" 
            ? "-left-2 border-l border-b"
            : "-right-2 border-r border-t"
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

// --- エラーメッセージ用ポータル ---
const PortalErrorTooltip = ({ 
  message, 
  rect 
}: { 
  message: string, 
  rect: DOMRect 
}) => {
  if (typeof document === "undefined") return null;

  const top = rect.top - 10;
  const left = rect.left + (rect.width / 2);

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
      style={{ 
        top: top, 
        left: left,
        transform: "translate(-50%, -100%)"
      }}
    >
      <div className="bg-red-600 text-white text-xs px-3 py-1.5 rounded shadow-lg max-w-[250px] relative">
        {message}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600"></div>
      </div>
    </div>,
    document.body
  );
};

export default function CardView<T extends Card>({
  cards,
  mode,
  onAction,
  onQuantityChange,
  actionType,
  isDeckArea = false,
  validationErrors = {},
  keyCardIds = [],    // デフォルト値
  onToggleKeyCard,
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

  const getCardName = (card: Card) => {
    if (card.card_faces && card.card_faces.length > 1) {
      return card.card_faces
        .map((face) => face.printed_name ?? face.name)
        .join(" // ");
    }
    return card.printed_name ?? card.name;
  };

  const [hoveredImageUrl, setHoveredImageUrl] = useState<string | null>(null);
  const [popupState, setPopupState] = useState<{ top: number, left: number, side: "left" | "right" } | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const [activeError, setActiveError] = useState<{ message: string, rect: DOMRect } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLLIElement>, imageUrl: string | undefined) => {
    if (!imageUrl) return;
    const target = e.currentTarget;
    hoverTimeout.current = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const POPUP_WIDTH = 256;
      const GAP = 12;
      const windowWidth = window.innerWidth;

      let left = rect.right + GAP;
      let side: "left" | "right" = "right";

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

  const handleErrorMouseEnter = (e: React.MouseEvent, message: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveError({ message, rect });
  };

  const handleErrorMouseLeave = () => {
    setActiveError(null);
  };

  // 枚数減少時のハンドラ: 1枚なら削除、それ以外なら-1
  const handleQuantityDecrease = (card: T, currentQuantity: number) => {
    if (currentQuantity <= 1) {
      onAction(card);
    } else {
      onQuantityChange?.(card, -1);
    }
  };

  // グリッドモード
  if (mode === "grid") {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 p-2 pb-20">
        {cards.map((card, idx) => {
          const quantity = "quantity" in card ? (card as DeckCard).quantity : 0;
          const imageUrl = getImageUrl(card);
          const manaCost = getManaCost(card);
          const displayName = getCardName(card);
          const isKeyCard = keyCardIds.includes(card.id);
          const error = validationErrors[card.id];
          const isBanned = error?.includes("BANNED");

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
                  className={`rounded w-full shadow-md ${
                    error ? "ring-2 ring-red-500 ring-offset-2 ring-offset-slate-900" : ""
                  }`}
                  loading="lazy"
                />
              ) : (
                <div className="aspect-[5/7] bg-slate-800 flex items-center justify-center rounded p-2 text-center text-sm border border-slate-700">
                  {displayName}
                </div>
              )}
              
              {isDeckArea && onToggleKeyCard && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleKeyCard(card.id);
                    }}
                    className={`absolute top-1 left-1 p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-all z-10 ${
                      isKeyCard 
                        ? "bg-yellow-500/20 text-yellow-400 opacity-100" 
                        : "bg-slate-900/40 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-900/80 hover:text-white"
                    }`}
                    title="キーカードに設定"
                  >
                    <Star size={16} fill={isKeyCard ? "currentColor" : "none"} />
                  </button>
                )}

              {/* グリッド用エラー表示 */}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none p-2 text-center">
                  {isBanned ? (
                    <Ban className="text-red-500 w-12 h-12 drop-shadow-md mb-1" />
                  ) : (
                    <AlertTriangle className="text-red-500 w-10 h-10 drop-shadow-md mb-1" />
                  )}
                  <span className="text-red-100 font-bold text-xs bg-red-900/80 px-2 py-1 rounded">
                    {isBanned ? "BANNED" : "INVALID"}
                  </span>
                </div>
              )}

              {/* ホバー時のオーバーレイアクション（検索結果等はこれのみ） */}
              {!isDeckArea && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded z-10">
                  {actionType === "remove" ? (
                    <MinusCircle className="text-red-400 w-10 h-10 drop-shadow-lg" />
                  ) : (
                    <PlusCircle className="text-white w-10 h-10 drop-shadow-lg" />
                  )}
                </div>
              )}

              {/* 【修正】デッキエリアの場合: 枚数調整コントロールを表示 */}
              {isDeckArea && quantity > 0 && (
                <div 
                  className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6 rounded-b flex items-end justify-center z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()} // 親のクリックイベント(カード削除など)を防止
                >
                  <div className="flex items-center gap-1 bg-slate-900/90 rounded border border-slate-600 shadow-xl backdrop-blur-sm">
                    <button 
                      type="button"
                      onClick={() => handleQuantityDecrease(card, quantity)}
                      className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-red-400 rounded-l transition-colors"
                      title="-1"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-white select-none">
                      {quantity}
                    </span>
                    <button 
                      type="button"
                      onClick={() => onQuantityChange?.(card, 1)}
                      className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-green-400 rounded-r transition-colors"
                      title="+1"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* デッキエリアかつホバーしていない時の簡易枚数表示（左下） */}
              {isDeckArea && quantity > 0 && (
                <div className="absolute bottom-2 left-2 bg-black/80 text-white font-bold px-2 py-0.5 rounded text-sm shadow-md z-20 pointer-events-none group-hover:opacity-0 transition-opacity">
                  ×{quantity}
                </div>
              )}
            </div>
          );
        })}
        {activeError && <PortalErrorTooltip message={activeError.message} rect={activeError.rect} />}
      </div>
    );
  }

  // リスト表示モード
  return (
    <>
      <ul className="space-y-0.5 p-2 pb-3">
        {cards.map((card, idx) => {
          const quantity = "quantity" in card ? (card as DeckCard).quantity : 0;
          const manaCost = getManaCost(card);
          const imageUrl = getImageUrl(card);
          const isKeyCard = keyCardIds.includes(card.id);
          const displayName = getCardName(card);
          const error = validationErrors[card.id];

          return (
            <li
              key={`${card.id}-${idx}`}
              onMouseEnter={(e) => handleMouseEnter(e, imageUrl)}
              onMouseLeave={handleMouseLeave}
              onClick={() => !isDeckArea && onAction(card)}
              className={`
                relative flex justify-between items-center py-1 px-2 rounded border cursor-pointer group select-none transition-colors
                ${error 
                  ? "border-red-500 bg-red-950/30 hover:bg-red-900/40"
                  : "bg-slate-800/80 border-transparent hover:border-slate-600 hover:bg-slate-700"
                }
              `}
            >
              {isDeckArea && onToggleKeyCard && (
                <button
                  onClick={() => onToggleKeyCard(card.id)}
                  className={`p-1 rounded transition-colors ${
                    isKeyCard 
                      ? "text-yellow-400 hover:text-yellow-300" 
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                  title="キーカードに設定"
                >
                  <Star size={16} fill={isKeyCard ? "currentColor" : "none"} />
                </button>
              )}
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                {isDeckArea && quantity > 0 && (
                  <span className="font-bold text-blue-300 w-6 shrink-0 text-right">
                    {quantity}x
                  </span>
                )}
                
                <div className="w-20 shrink-0 flex justify-end">
                  <ManaCost manaCost={manaCost} />
                </div>
                
                <span className={`truncate font-medium text-sm ${error ? "text-red-200" : "text-slate-200"}`}>
                  {displayName}
                </span>
              </div>

              {error && (
                <div 
                  className="relative shrink-0 mx-2"
                  onMouseEnter={(e) => handleErrorMouseEnter(e, error)}
                  onMouseLeave={handleErrorMouseLeave}
                >
                  <AlertTriangle size={18} className="text-red-500 animate-pulse" />
                </div>
              )}
              
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded uppercase border border-slate-800">
                  {card.set}
                </span>

                {isDeckArea ? (
                  <div className="flex items-center bg-slate-900 rounded border border-slate-700 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      type="button"
                      onClick={() => handleQuantityDecrease(card, quantity)}
                      className="p-1 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-l transition-colors"
                      title="-1"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-700"></div>
                    <button 
                      type="button"
                      onClick={() => onQuantityChange?.(card, 1)}
                      className="p-1 hover:bg-slate-700 text-slate-400 hover:text-green-400 rounded-r transition-colors"
                      title="+1"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => onAction(card)}
                    className="text-slate-500 hover:text-white p-1 transition-colors ml-1"
                  >
                    {actionType === "remove" ? (
                      <MinusCircle size={18} className="text-red-400" />
                    ) : (
                      <PlusCircle size={18} />
                    )}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {hoveredImageUrl && popupState && (
        <PortalPopup 
           imageUrl={hoveredImageUrl} 
           position={popupState} 
           side={popupState.side} 
        />
      )}

      {activeError && (
        <PortalErrorTooltip 
          message={activeError.message} 
          rect={activeError.rect} 
        />
      )}
    </>
  );
}