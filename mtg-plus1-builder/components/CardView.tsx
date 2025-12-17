import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, DeckCard } from "@/types";
import { PlusCircle, MinusCircle, AlertTriangle, Plus, Minus, Star, Ban, CheckCircle2 } from "lucide-react"; // CheckCircle2を追加
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
  readOnly?: boolean;
};

// --- カード画像プレビュー用ポータル (変更なし) ---
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

// --- エラーメッセージ用ポータル (変更なし) ---
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
  keyCardIds = [], 
  onToggleKeyCard,
  readOnly = false,
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

  // ★追加: アクション時のフィードバック用State (フラッシュさせるカードID)
  const [flashingCardId, setFlashingCardId] = useState<string | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>, imageUrl: string | undefined) => {
    // ★修正: モバイル幅(768px未満)の場合はプレビューを表示しない
    if (window.innerWidth < 768) return;

    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setHoveredImageUrl(null);
    setPopupState(null);

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
    }, 250);
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

  const handleQuantityDecrease = (card: T, currentQuantity: number) => {
    if (currentQuantity <= 1) {
      handleActionWithFeedback(card);
    } else {
      onQuantityChange?.(card, -1);
    }
  };

  // ★追加: アクション実行時にフィードバックを表示するラッパー関数
  const handleActionWithFeedback = (card: T) => {
    if (readOnly) return;

    // 元のアクションを実行
    onAction(card);

    // 追加(add)の場合、視覚的フィードバックを与える
    if (actionType === "add") {
      setFlashingCardId(card.id);
      setTimeout(() => {
        setFlashingCardId(null);
      }, 500); // 0.5秒後に消す
    }
  };

  // ■■■ グリッドモード ■■■
  if (mode === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-2 pb-5">
        {cards.map((card, idx) => {
          const quantity = "quantity" in card ? (card as DeckCard).quantity : 0;
          const imageUrl = getImageUrl(card);
          const displayName = getCardName(card);
          const isKeyCard = keyCardIds.includes(card.id);
          const error = validationErrors[card.id];
          const isBanned = error?.includes("BANNED");
          
          // ★追加: フラッシュ中かどうか
          const isFlashing = flashingCardId === card.id;

          return (
            <div
              key={`${card.id}-${idx}`}
              onClick={() => handleActionWithFeedback(card)} // ラッパー関数を使用
              className={`
                relative group
                ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-105 transition-transform"}
              `}
              onMouseEnter={(e) => handleMouseEnter(e, imageUrl)}
              onMouseLeave={handleMouseLeave}
            >
              <div className={`relative aspect-[5/7] rounded-md overflow-hidden shadow-sm transition-all duration-300 hover:z-10 
                ${error ? "ring-2 ring-red-500" : "bg-slate-800"}
                ${isFlashing ? "ring-4 ring-green-500 scale-105 brightness-110" : ""} 
              `}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={card.name}
                    className={`w-full h-full object-cover ${isBanned ? "grayscale opacity-70" : ""}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-1 text-center text-[10px] text-slate-400 bg-slate-800">
                    {displayName}
                  </div>
                )}

                {/* フラッシュ時のオーバーレイアイコン */}
                {isFlashing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 z-20 animate-in fade-in zoom-in duration-200">
                    <CheckCircle2 className="text-white w-10 h-10 drop-shadow-lg" />
                  </div>
                )}

                {/* キーカード表示 (DeckAreaのみ) */}
                {isDeckArea && (
                  <>
                    {/* ReadOnly: キーカードの場合のみ静的に表示 */}
                    {readOnly && isKeyCard && (
                        <div className="absolute top-0.5 left-0.5 p-1 rounded-full shadow-sm bg-yellow-500/80 text-white z-10">
                             <Star size={12} fill="currentColor" />
                        </div>
                    )}
                    {/* Editable: トグルボタンを表示 */}
                    {!readOnly && onToggleKeyCard && (
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleKeyCard(card.id);
                        }}
                        className={`absolute top-0.5 left-0.5 p-1 rounded-full shadow-sm backdrop-blur-sm transition-all z-10 ${
                            isKeyCard 
                            ? "bg-yellow-500/80 text-white opacity-100" 
                            : "bg-slate-900/40 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-900/80 hover:text-white"
                        }`}
                        title="キーカードに設定"
                        >
                        <Star size={12} fill={isKeyCard ? "currentColor" : "none"} />
                        </button>
                    )}
                  </>
                )}

                {/* 数量バッジ (DeckAreaのみ) */}
                {isDeckArea && (
                  <div className="absolute bottom-0 right-0 bg-slate-900/90 text-white px-1.5 py-0.5 text-[10px] font-bold rounded-tl border-t border-l border-slate-700">
                    x{quantity}
                  </div>
                )}

                {/* エラー表示 */}
                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none p-1 text-center">
                    {isBanned ? (
                      <Ban className="text-red-500 w-8 h-8 drop-shadow-md mb-1" />
                    ) : (
                      <AlertTriangle className="text-red-500 w-6 h-6 drop-shadow-md mb-1" />
                    )}
                  </div>
                )}

                {/* 検索結果（非デッキエリア）用の追加ボタンオーバーレイ (ReadOnly時は非表示) */}
                {!isDeckArea && !readOnly && !isFlashing && (
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    {actionType === "remove" ? (
                      <MinusCircle className="text-red-400 w-8 h-8 drop-shadow-lg" />
                    ) : (
                      <PlusCircle className="text-white w-8 h-8 drop-shadow-lg" />
                    )}
                  </div>
                )}
              </div>
              
              {/* デッキエリア用の操作ボタン（グリッド下） - ReadOnly時は非表示 */}
              {isDeckArea && quantity > 0 && !readOnly && (
                <div className="mt-1 flex justify-center items-center gap-0.5 bg-slate-800/90 rounded border border-slate-700 p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleQuantityDecrease(card, quantity); }}
                      className="p-0.5 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-[10px] font-bold w-4 text-center text-white select-none">{quantity}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onQuantityChange?.(card, 1); }}
                      className="p-0.5 hover:bg-slate-700 text-slate-400 hover:text-green-400 rounded transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                </div>
              )}
            </div>
          );
        })}
        {hoveredImageUrl && popupState && (
          <PortalPopup 
             imageUrl={hoveredImageUrl} 
             position={popupState} 
             side={popupState.side} 
          />
        )}
        {activeError && <PortalErrorTooltip message={activeError.message} rect={activeError.rect} />}
      </div>
    );
  }

  // ■■■ リスト表示モード ■■■
  return (
    <>
      <ul className="space-y-0.5 p-2">
        {cards.map((card, idx) => {
          const quantity = "quantity" in card ? (card as DeckCard).quantity : 0;
          const manaCost = getManaCost(card);
          const imageUrl = getImageUrl(card);
          const isKeyCard = keyCardIds.includes(card.id);
          const displayName = getCardName(card);
          const error = validationErrors[card.id];
          const isBanned = error?.includes("BANNED");
          
          // ★追加: フラッシュ中かどうか
          const isFlashing = flashingCardId === card.id;

          return (
            <li
              key={`${card.id}-${idx}`}
              onMouseEnter={(e) => handleMouseEnter(e, imageUrl)}
              onMouseLeave={handleMouseLeave}
              // readOnlyならアクション無効、DeckAreaならボタン操作のみとするため行クリック無効
              onClick={() => !isDeckArea && !readOnly && handleActionWithFeedback(card)}
              className={`
                relative flex justify-between items-center py-1 px-2 rounded border group select-none transition-all duration-300
                ${error 
                  ? "border-red-500 bg-red-950/30"
                  : isFlashing 
                    ? "bg-green-500/30 border-green-400"  // ★追加: フラッシュ時のスタイル
                    : "bg-slate-800/80 border-transparent"
                }
                ${!readOnly && !error && !isFlashing ? "hover:border-slate-600 hover:bg-slate-700 cursor-pointer" : ""}
                ${readOnly ? "cursor-default" : ""}
              `}
            >
              {/* キーカードマーク (DeckAreaのみ) */}
              {isDeckArea && (
                  <>
                    {/* ReadOnly: キーカードなら静的表示 */}
                    {readOnly && isKeyCard && (
                        <div className="p-1 rounded shrink-0 mr-1 text-yellow-400">
                             <Star size={16} fill="currentColor" />
                        </div>
                    )}
                    {/* Editable: トグルボタン */}
                    {!readOnly && onToggleKeyCard && (
                        <button
                        onClick={(e) => { e.stopPropagation(); onToggleKeyCard(card.id); }}
                        className={`p-1 rounded transition-colors shrink-0 mr-1 ${
                            isKeyCard 
                            ? "text-yellow-400 hover:text-yellow-300" 
                            : "text-slate-600 hover:text-slate-400"
                        }`}
                        >
                        <Star size={16} fill={isKeyCard ? "currentColor" : "none"} />
                        </button>
                    )}
                 </>
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
                
                {/* ★追加: リストモードでの追加完了アイコン */}
                {isFlashing && (
                  <CheckCircle2 size={16} className="text-green-400 ml-2 animate-in fade-in zoom-in" />
                )}
              </div>

              {error && (
                <div 
                  className="relative shrink-0 mx-2"
                  onMouseEnter={(e) => handleErrorMouseEnter(e, error)}
                  onMouseLeave={handleErrorMouseLeave}
                >
                  {isBanned ? (
                    <Ban size={18} className="text-red-500 animate-pulse" />
                  ) : (
                    <AlertTriangle size={18} className="text-red-500 animate-pulse" />
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded uppercase border border-slate-800">
                  {card.set}
                </span>

                {/* 操作ボタン類 (ReadOnly時はすべて非表示) */}
                {!readOnly && (
                    <>
                        {isDeckArea ? (
                        <div className="flex items-center bg-slate-900 rounded border border-slate-700 ml-2" onClick={(e) => e.stopPropagation()}>
                            <button 
                            type="button"
                            onClick={() => handleQuantityDecrease(card, quantity)}
                            className="p-1 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-l transition-colors"
                            >
                            <Minus size={14} />
                            </button>
                            <div className="w-[1px] h-4 bg-slate-700"></div>
                            <button 
                            type="button"
                            onClick={() => onQuantityChange?.(card, 1)}
                            className="p-1 hover:bg-slate-700 text-slate-300 hover:text-green-400 rounded-r transition-colors"
                            >
                            <Plus size={14} />
                            </button>
                        </div>
                        ) : (
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleActionWithFeedback(card); }}
                            className="text-slate-500 hover:text-white p-1 transition-colors ml-1"
                        >
                            {actionType === "remove" ? (
                            <MinusCircle size={18} className="text-red-400" />
                            ) : (
                            <PlusCircle size={18} />
                            )}
                        </button>
                        )}
                    </>
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