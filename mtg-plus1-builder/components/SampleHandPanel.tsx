import { useState } from "react";
import { DeckCard } from "@/types";
import { Play, RefreshCw } from "lucide-react";

type Props = {
  deck: DeckCard[];
};

export default function SampleHandPanel({ deck }: Props) {
  const [hand, setHand] = useState<DeckCard[]>([]);
  const [library, setLibrary] = useState<DeckCard[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);

  // デッキを展開してシャッフルする関数
  const shuffleAndDraw = () => {
    const flatDeck: DeckCard[] = [];
    deck.forEach(card => {
      for (let i = 0; i < card.quantity; i++) {
        // 一意なキーにするためにIDにインデックスを付与
        flatDeck.push({ ...card, id: `${card.id}-${i}` });
      }
    });

    for (let i = flatDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flatDeck[i], flatDeck[j]] = [flatDeck[j], flatDeck[i]];
    }

    const newHand = flatDeck.slice(0, 7);
    const newLib = flatDeck.slice(7);

    setHand(newHand);
    setLibrary(newLib);
    setIsShuffled(true);
  };

  const drawOne = () => {
    if (library.length === 0) return;
    const [card, ...rest] = library;
    setHand(prev => [...prev, card]);
    setLibrary(rest);
  };

  // ★追加: カードを捨てる関数
  const discardCard = (uniqueId: string) => {
    setHand(prev => prev.filter(c => c.id !== uniqueId));
  };

  return (
    <div className="h-full bg-slate-900/50 flex flex-col">
      {/* ツールバー */}
      <div className="p-3 border-b border-slate-800 flex gap-2">
        <button 
          onClick={shuffleAndDraw}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          {isShuffled ? <RefreshCw size={14}/> : <Play size={14}/>}
          {isShuffled ? "New Hand (7)" : "Start Simulator"}
        </button>
        {isShuffled && (
          <button 
            onClick={drawOne}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs border border-slate-700 font-bold"
            title="1枚引く"
          >
            Draw 1
          </button>
        )}
      </div>

      {/* 手札表示エリア */}
      <div className="flex-1 overflow-y-auto p-4">
        {hand.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <Play size={32} className="opacity-20" />
            <p className="text-sm">ボタンを押して初手をチェック</p>
          </div>
        ) : (
          // ★変更: 横4列 (grid-cols-4) に固定
          <div className="grid grid-cols-4 gap-3">
            {hand.map((card) => (
              <div 
                key={card.id} 
                onClick={() => discardCard(card.id)} // ★追加: クリックで捨てる
                className="relative group animate-in zoom-in-90 duration-300 aspect-[5/7] bg-slate-800 rounded-lg overflow-hidden shadow-md cursor-pointer hover:ring-2 hover:ring-red-500/70 transition-all"
                title="クリックして捨てる"
              >
                <img 
                  src={card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal} 
                  alt={card.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                


                {/* ホバー時の「×」アイコン（オプション） */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity pointer-events-none">
                  <span className="text-red-500 font-bold text-lg drop-shadow-md">✕</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ステータスバー */}
      {isShuffled && (
        <div className="p-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
          <span>Hand: {hand.length}</span>
          <span>Library: {library.length}</span>
        </div>
      )}
    </div>
  );
}