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

export default function CardView<T extends Card>({
  cards,
  mode,
  onAction,
  actionType,
  isDeckArea = false,
}: Props<T>) {

  // 画像URLを取得するヘルパー関数
  const getImageUrl = (card: Card) => {
    if (card.image_uris?.normal) return card.image_uris.normal;
    // 両面カードの場合、表面(0番目)の画像を使用
    if (card.card_faces && card.card_faces[0]?.image_uris?.normal) {
      return card.card_faces[0].image_uris.normal;
    }
    return undefined;
  };

  // マナコストを取得するヘルパー関数
  const getManaCost = (card: Card) => {
    if (card.mana_cost) return card.mana_cost;
    // 両面カードの場合、表面のマナコストを使用
    if (card.card_faces && card.card_faces[0]?.mana_cost) {
      return card.card_faces[0].mana_cost;
    }
    return undefined;
  };

  if (mode === "grid") {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 p-2">
        {cards.map((card, idx) => {
          const quantity = "quantity" in card ? (card as DeckCard).quantity : 0;
          const imageUrl = getImageUrl(card); // ここで取得
          const manaCost = getManaCost(card); // ここで取得

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
                  className="rounded w-full"
                  loading="lazy"
                />
              ) : (
                <div className="aspect-[5/7] bg-slate-700 flex items-center justify-center rounded p-2 text-center text-sm">
                  {card.printed_name ?? card.name}
                </div>
              )}
              
              {/* マナコストオーバーレイ */}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded z-10">
                {actionType === "remove" ? (
                  <MinusCircle className="text-red-400 w-10 h-10" />
                ) : (
                  <PlusCircle className="text-white w-10 h-10" />
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

  // リストモード
  return (
    <ul className="space-y-1 p-2">
      {cards.map((card, idx) => {
        const quantity = "quantity" in card ? (card as DeckCard).quantity : 0;
        const manaCost = getManaCost(card); // ここで取得

        return (
          <li
            key={`${card.id}-${idx}`}
            onClick={() => onAction(card)}
            className="flex justify-between items-center bg-slate-700 p-2 rounded hover:bg-slate-600 cursor-pointer group select-none"
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
              
              <span className="truncate">
                {card.printed_name ?? card.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs text-slate-400 bg-slate-800 px-1 rounded uppercase">
                {card.set}
              </span>
              <button className="text-slate-400 hover:text-white p-1">
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
  );
}