"use client";

import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { LayoutGrid, List as ListIcon, Trash2, PlusCircle } from "lucide-react";

// 型定義
type Card = {
  id: string;
  name: string;
  set: string;
  mana_cost?: string;
  type_line: string;
  image_uris?: {
    normal: string;
    small?: string;
  };
};

const EXPANSIONS = [
  { code: "dsk", name: "ダスクモーン (DSK)" },
  { code: "blb", name: "ブルームバロウ (BLB)" },
  { code: "otj", name: "サンダー・ジャンクション (OTJ)" },
  { code: "mkm", name: "カルロフ邸 (MKM)" },
  { code: "lci", name: "イクサラン：失われし洞窟 (LCI)" },
  { code: "woe", name: "エルドレインの森 (WOE)" },
  { code: "neo", name: "神河：輝ける世界 (NEO)" },
];

export default function Home() {
  const [selectedSet, setSelectedSet] = useState("neo");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  // 表示モードの状態管理 ( 'grid' | 'list' )
  const [searchViewMode, setSearchViewMode] = useState<"grid" | "list">("grid");
  const [deckViewMode, setDeckViewMode] = useState<"grid" | "list">("list"); // デッキはリスト初期値が便利

  const searchCards = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      // 日本語検索対応版クエリ
      const q = `(set:fdn OR set:${selectedSet}) (${searchQuery} OR lang:ja ${searchQuery}) unique:cards`;
      const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addToDeck = (card: Card) => {
    // IDを一意にするため、単純なオブジェクトコピーではなく新しい参照を作る
    setDeck((prev) => [...prev, { ...card }]);
  };

  const removeFromDeck = (indexToRemove: number) => {
    setDeck((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // 共通のカード表示コンポーネント
  const CardView = ({
    cards,
    mode,
    onAction,
    actionType,
  }: {
    cards: Card[];
    mode: "grid" | "list";
    onAction: (card: Card, index: number) => void;
    actionType: "add" | "remove";
  }) => {
    if (mode === "grid") {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 p-2">
          {cards.map((card, index) => (
            <div
              key={`${card.id}-${index}`}
              onClick={() => onAction(card, index)}
              className="cursor-pointer hover:scale-105 transition-transform relative group"
            >
              {card.image_uris?.normal ? (
                <img
                  src={card.image_uris.normal}
                  alt={card.name}
                  className="rounded w-full"
                  loading="lazy"
                />
              ) : (
                <div className="aspect-[5/7] bg-slate-700 flex items-center justify-center rounded p-2 text-center text-sm">
                  {card.name}
                </div>
              )}
              {/* マウスホバー時にアクションアイコンを表示 */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                {actionType === "add" ? (
                  <PlusCircle className="text-white w-10 h-10" />
                ) : (
                  <Trash2 className="text-red-400 w-10 h-10" />
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // リスト表示モード
    return (
      <ul className="space-y-1 p-2">
        {cards.map((card, index) => (
          <li
            key={`${card.id}-${index}`}
            className="flex justify-between items-center bg-slate-700 p-2 rounded hover:bg-slate-600 cursor-pointer group"
            onClick={() => onAction(card, index)}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {/* セットシンボルなどの代わりに小さなマナコストを表示しても良い */}
              <span className="text-xs font-mono text-yellow-400 w-16 shrink-0">
                {card.mana_cost || "-"}
              </span>
              <span className="truncate">{card.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 bg-slate-800 px-1 rounded uppercase">
                {card.set}
              </span>
              <button className="text-slate-400 hover:text-white">
                {actionType === "add" ? <PlusCircle size={16} /> : <Trash2 size={16} className="text-red-400" />}
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* ヘッダーエリア */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 flex gap-4 items-center shrink-0">
        <h1 className="text-xl font-bold mr-4">MtG PLUS1</h1>
        
        <select
          value={selectedSet}
          onChange={(e) => setSelectedSet(e.target.value)}
          className="p-2 rounded bg-slate-800 border border-slate-700 text-sm"
        >
          {EXPANSIONS.map((set) => (
            <option key={set.code} value={set.code}>
              {set.name}
            </option>
          ))}
        </select>

        <div className="flex-1 max-w-md flex gap-2">
          <input
            type="text"
            placeholder="カード検索 (日/英)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchCards()}
            className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
          <button
            onClick={searchCards}
            disabled={loading}
            className="bg-blue-600 px-4 py-2 rounded text-sm font-bold hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "..." : "検索"}
          </button>
        </div>
      </header>

      {/* メインエリア：可変パネル */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          
          {/* 左パネル: 検索結果 */}
          <Panel defaultSize={50} minSize={20} className="flex flex-col bg-slate-900/50">
            <div className="p-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400">検索結果 ({searchResults.length})</span>
              <div className="flex bg-slate-800 rounded p-1">
                <button
                  onClick={() => setSearchViewMode("list")}
                  className={`p-1 rounded ${searchViewMode === "list" ? "bg-slate-600 text-white" : "text-slate-400"}`}
                >
                  <ListIcon size={16} />
                </button>
                <button
                  onClick={() => setSearchViewMode("grid")}
                  className={`p-1 rounded ${searchViewMode === "grid" ? "bg-slate-600 text-white" : "text-slate-400"}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CardView
                cards={searchResults}
                mode={searchViewMode}
                actionType="add"
                onAction={(card) => addToDeck(card)}
              />
            </div>
          </Panel>

          {/* リサイズハンドル (ドラッグバー) */}
          <PanelResizeHandle className="w-2 bg-slate-950 hover:bg-blue-500/50 transition-colors cursor-col-resize flex items-center justify-center">
            <div className="w-0.5 h-8 bg-slate-700 rounded" />
          </PanelResizeHandle>

          {/* 右パネル: デッキリスト */}
          <Panel defaultSize={50} minSize={20} className="flex flex-col bg-slate-900/50">
            <div className="p-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400">Main Deck ({deck.length})</span>
              <div className="flex bg-slate-800 rounded p-1">
                <button
                  onClick={() => setDeckViewMode("list")}
                  className={`p-1 rounded ${deckViewMode === "list" ? "bg-slate-600 text-white" : "text-slate-400"}`}
                >
                  <ListIcon size={16} />
                </button>
                <button
                  onClick={() => setDeckViewMode("grid")}
                  className={`p-1 rounded ${deckViewMode === "grid" ? "bg-slate-600 text-white" : "text-slate-400"}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CardView
                cards={deck}
                mode={deckViewMode}
                actionType="remove"
                onAction={(_, index) => removeFromDeck(index)}
              />
            </div>
          </Panel>

        </PanelGroup>
      </div>
    </main>
  );
}