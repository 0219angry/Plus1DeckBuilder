"use client";

import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, DeckCard, EXPANSIONS, LANGUAGES } from "@/types";
import SearchPanel from "@/components/SearchPanel";
import DeckPanel from "@/components/DeckPanel";
import Footer from "@/components/Footer";

export default function Home() {
  const [selectedSet, setSelectedSet] = useState("neo");
  const [language, setLanguage] = useState("ja");
  
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  
  // デッキ名ステート
  const [deckName, setDeckName] = useState("Untitled Deck");
  const [deck, setDeck] = useState<DeckCard[]>([]);           // メイン
  const [sideboard, setSideboard] = useState<DeckCard[]>([]); // サイド
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // LocalStorage読み込み (マイグレーション対応)
  useEffect(() => {
    const savedData = localStorage.getItem("mtg-plus1-deck");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // 新形式: { name, cards, sideboard } に対応させる
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setDeck(parsed.cards || []);
          setSideboard(parsed.sideboard || []); // サイドボード復元
          setDeckName(parsed.name || "Untitled Deck");
        } else if (Array.isArray(parsed)) {
          // 旧形式互換
          setDeck(parsed);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  // LocalStorage保存 (オブジェクト形式)
  useEffect(() => {
    if (deck.length > 0 || deckName !== "Untitled Deck") {
      const dataToSave = {
        name: deckName,
        cards: deck,
        sideboard: sideboard,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("mtg-plus1-deck", JSON.stringify(dataToSave));
    }
  }, [deck, sideboard, deckName]);

  // 検索処理
  const executeSearch = async (queryWithOptions: string) => {
    if (!queryWithOptions) return;
    setLoading(true);
    try {
      const baseQuery = `(set:fdn OR set:${selectedSet}) lang:${language} unique:cards`;
      const finalQuery = `${baseQuery} ${queryWithOptions}`;
      
      const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(finalQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // デッキ操作
  const addToDeck = (card: Card, target: "main" | "side" = "main") => {
    const setTargetDeck = target === "main" ? setDeck : setSideboard;
    
    setTargetDeck((prev) => {
      const idx = prev.findIndex((c) => c.id === card.id);
      if (idx >= 0) {
        const newDeck = [...prev];
        // 4枚制限 (基本土地以外)
        if (newDeck[idx].type_line.includes("Basic Land") || newDeck[idx].quantity < 4) {
             newDeck[idx] = { ...newDeck[idx], quantity: newDeck[idx].quantity + 1 };
        }
        return newDeck;
      }
      return [...prev, { ...card, quantity: 1 }];
    });
  };

  const removeFromDeck = (card: Card, target: "main" | "side") => {
    const setTargetDeck = target === "main" ? setDeck : setSideboard;

    setTargetDeck((prev) => {
      const next = prev.map((c) => {
        if (c.id === card.id) return { ...c, quantity: c.quantity - 1 };
        return c;
      }).filter((c) => c.quantity > 0);
      return next;
    });
  };

const unifyDeckLanguage = async () => {
    if ((deck.length === 0 && sideboard.length === 0) || !confirm("デッキ内の言語を統一しますか？")) return;
    setProcessing(true);

    try {
      // 1. デッキとサイドボードに含まれる「ユニークなカード（セット+番号）」を抽出
      const allCards = [...deck, ...sideboard];
      const uniqueKeys = new Set<string>();
      const cardsToFetch: { set: string; cn: string }[] = [];

      allCards.forEach(card => {
        const key = `${card.set}:${card.collector_number}`;
        if (!uniqueKeys.has(key)) {
          uniqueKeys.add(key);
          cardsToFetch.push({ set: card.set, cn: card.collector_number });
        }
      });

      if (cardsToFetch.length === 0) {
        setProcessing(false);
        return;
      }

      // 2. Scryfall Search APIを使ってバッチ取得 (URL長制限回避のため30枚ずつチャンク分割)
      // クエリ例: (set:neo cn:1 lang:ja) or (set:neo cn:2 lang:ja) ...
      const BATCH_SIZE = 30;
      const fetchedCardsMap = new Map<string, Card>();

      for (let i = 0; i < cardsToFetch.length; i += BATCH_SIZE) {
        const chunk = cardsToFetch.slice(i, i + BATCH_SIZE);
        
        // クエリの組み立て
        const queryParts = chunk.map(c => `(set:${c.set} cn:${c.cn} lang:${language})`);
        const query = queryParts.join(" or ");
        
        try {
          // unique:prints を指定して特定の版・言語を狙う
          const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`;
          const res = await fetch(url);
          const data = await res.json();

          if (data.data) {
            data.data.forEach((c: Card) => {
              // 取得したカードをマップに保存 (Key: set:cn)
              fetchedCardsMap.set(`${c.set}:${c.collector_number}`, c);
            });
          }
        } catch (e) {
          console.error("Batch fetch failed", e);
        }
        
        // API負荷軽減のウェイト (検索APIは少し重いため)
        await new Promise(r => setTimeout(r, 100));
      }

      // 3. 取得したデータでデッキを更新するヘルパー関数
      const updateList = (list: DeckCard[]) => {
        return list.map(card => {
          const key = `${card.set}:${card.collector_number}`;
          const newCardData = fetchedCardsMap.get(key);
          
          if (newCardData) {
            // 見つかった場合はデータを差し替え（枚数は維持）
            return { ...newCardData, quantity: card.quantity };
          }
          // 見つからなかった（その言語版が存在しない等）場合は元のまま
          return card;
        });
      };

      // デッキとサイドを更新
      setDeck(updateList(deck));
      setSideboard(updateList(sideboard));

    } catch (error) {
      console.error("Language unification failed", error);
      alert("変換中にエラーが発生しました。");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      
      {/* 復活させたヘッダーエリア */}
      <header className="p-3 bg-slate-950 border-b border-slate-800 flex gap-4 items-center shrink-0">
        <h1 className="text-lg font-bold mr-2 text-blue-400">MtG PLUS1</h1>
        
        {/* セット選択 */}
        <select
          value={selectedSet}
          onChange={(e) => setSelectedSet(e.target.value)}
          className="p-1.5 rounded bg-slate-800 border border-slate-700 text-sm"
        >
          {EXPANSIONS.map((set) => (
            <option key={set.code} value={set.code}>
              {set.name}
            </option>
          ))}
        </select>
        
        {/* 言語選択 */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="p-1.5 rounded bg-slate-800 border border-slate-700 text-sm font-bold w-20"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </header>

      {/* メインエリア */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          
          <Panel defaultSize={50} minSize={30}>
            <SearchPanel 
              searchResults={searchResults} 
              loading={loading} 
              onSearch={executeSearch}
              onAdd={addToDeck}
              language={language}
            />
          </Panel>

          <PanelResizeHandle className="w-2 bg-slate-950 hover:bg-blue-600/50 transition-colors flex items-center justify-center">
            <div className="w-0.5 h-8 bg-slate-700 rounded" />
          </PanelResizeHandle>

          <Panel defaultSize={50} minSize={30}>
            <DeckPanel 
              deck={deck}
              sideboard={sideboard}
              deckName={deckName}
              onChangeDeckName={setDeckName}
              onRemove={removeFromDeck} 
              onUnifyLanguage={unifyDeckLanguage}
              isProcessing={processing}
            />
          </Panel>

        </PanelGroup>
      </div>
      <Footer />
    </main>
  );
}