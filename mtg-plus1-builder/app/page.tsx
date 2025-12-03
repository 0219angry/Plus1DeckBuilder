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
  }, [deck, deckName]);

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
        if (newDeck[idx].quantity < 4) {
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
    
    // ヘルパー: 指定リストを変換
    const convertList = async (list: DeckCard[]) => {
      const newList: DeckCard[] = [];
      for (const card of list) {
        try {
          const url = `https://api.scryfall.com/cards/${card.set}/${card.collector_number}/${language}`;
          const res = await fetch(url);
          if (res.ok) {
            const data: Card = await res.json();
            newList.push({ ...data, quantity: card.quantity });
          } else { newList.push(card); }
        } catch { newList.push(card); }
        await new Promise(r => setTimeout(r, 50));
      }
      return newList;
    };

    try {
      const newMain = await convertList(deck);
      setDeck(newMain);
      const newSide = await convertList(sideboard);
      setSideboard(newSide);
    } finally { setProcessing(false); }
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