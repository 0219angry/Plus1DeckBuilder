"use client";

import { useState, useEffect, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, DeckCard, EXPANSIONS, LANGUAGES, Expansion } from "@/types";
import SearchPanel from "@/components/SearchPanel";
import DeckPanel from "@/components/DeckPanel";
import Footer from "@/components/Footer";
import { useAllowedSets } from "@/hooks/useAllowedSets";

export default function Home() {
  const [selectedSet, setSelectedSet] = useState("neo");
  const [language, setLanguage] = useState("ja");
  
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  
  // デッキ情報
  const [deckName, setDeckName] = useState("Untitled Deck");
  const [deckComment, setDeckComment] = useState(""); // 【追加】デッキコメント
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [sideboard, setSideboard] = useState<DeckCard[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { allowedSets, loading: setsLoading } = useAllowedSets();

  const displayExpansions = useMemo(() => {
    if (setsLoading) return EXPANSIONS;
    if (allowedSets.length === 0) return EXPANSIONS;
    return allowedSets;
  }, [allowedSets, setsLoading]);

  const legalSetCodes = useMemo(() => {
    return displayExpansions.map(ex => ex.code);
  }, [displayExpansions]);

  // LocalStorage読み込み
  useEffect(() => {
    const savedData = localStorage.getItem("mtg-plus1-deck");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setDeck(parsed.cards || []);
          setSideboard(parsed.sideboard || []);
          setDeckName(parsed.name || "Untitled Deck");
          setDeckComment(parsed.comment || ""); // 【追加】コメント読み込み
          if (parsed.selectedSet) setSelectedSet(parsed.selectedSet);
          if (parsed.language) setLanguage(parsed.language);
        } else if (Array.isArray(parsed)) {
          setDeck(parsed);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  // LocalStorage保存
  useEffect(() => {
    if (deck.length > 0 || deckName !== "Untitled Deck") {
      const dataToSave = {
        name: deckName,
        comment: deckComment, // 【追加】コメント保存
        cards: deck,
        sideboard: sideboard,
        selectedSet: selectedSet,
        language: language,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("mtg-plus1-deck", JSON.stringify(dataToSave));
    }
  }, [deck, sideboard, deckName, deckComment, selectedSet, language]);

  const executeSearch = async (queryWithOptions: string) => {
    if (!queryWithOptions) return;
    setLoading(true);
    try {
      let baseQuery = `(set:fdn OR set:${selectedSet}) lang:${language} unique:cards`;
      let finalQuery = `${baseQuery} ${queryWithOptions}`;
      
      let url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(finalQuery)}`;
      let res = await fetch(url);
      let data = await res.json();

      if ((!data.data || data.data.length === 0) && language === 'ja') {
        console.log("No results in Japanese, trying English fallback...");
        baseQuery = `(set:fdn OR set:${selectedSet}) lang:en unique:cards`;
        finalQuery = `${baseQuery} ${queryWithOptions}`;
        url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(finalQuery)}`;
        res = await fetch(url);
        data = await res.json();
      }

      setSearchResults(data.data || []);
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToDeck = (card: Card, target: "main" | "side" = "main") => {
    const setTargetDeck = target === "main" ? setDeck : setSideboard;
    setTargetDeck((prev) => {
      const idx = prev.findIndex((c) => c.id === card.id);
      if (idx >= 0) {
        const newDeck = [...prev];
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

  const handleQuantityChange = (targetCard: DeckCard, amount: number, target: "main" | "side") => {
    const updateList = (list: DeckCard[]) => {
      return list.map(card => {
        if (card.id === targetCard.id) {
          const newQuantity = Math.max(1, card.quantity + amount);
          return { ...card, quantity: newQuantity };
        }
        return card;
      });
    };
    if (target === "main") {
      setDeck(prev => updateList(prev));
    } else {
      setSideboard(prev => updateList(prev));
    }
  };

  // 言語統一処理
  const unifyDeckLanguage = async () => {
    const BASIC_LANDS = ["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"];
    
    if ((deck.length === 0 && sideboard.length === 0) || !confirm(`デッキ内の言語を「${language === 'ja' ? '日本語' : '英語'}」に統一しますか？`)) return;
    
    setProcessing(true);

    try {
      const allCards = [...deck, ...sideboard];
      const uniqueNames = Array.from(new Set(allCards.map(c => c.name)));
      const bestCardMap = new Map<string, Card>();

      const BATCH_SIZE = 20;

      // 1. 基本土地とそれ以外を分ける
      const basicLandNames = uniqueNames.filter(name => BASIC_LANDS.includes(name));
      const otherNames = uniqueNames.filter(name => !BASIC_LANDS.includes(name));

      // 優先度スコア計算
      const getScore = (c: Card) => {
        let score = 0;
        const cSet = c.set.toLowerCase();

        // 1. セット優先
        if (cSet === selectedSet.toLowerCase()) score += 10000;
        else if (cSet === 'fdn') score += 5000;
        
        // 2. 言語優先
        if (c.lang === language) score += 1000;
        else if (c.lang === 'en') score += 500;
        
        // 3. その他
        if (cSet === 'plist' || cSet === 'mb1' || cSet.length > 3) score -= 100;
        if (!isNaN(Number(c.collector_number))) score += 50; 
        
        if (BASIC_LANDS.includes(c.name) && c.full_art) {
            score += 20;
        }

        return score;
      };

      // Phase 1: 基本土地
      if (basicLandNames.length > 0) {
        const landConditions = basicLandNames.map(name => `name:"${name}"`).join(" OR ");
        const landQuery = `(${landConditions}) (set:${selectedSet} OR set:fdn) (lang:${language} OR lang:en) unique:prints`;
        
        try {
          const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(landQuery)}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const foundLands: Card[] = data.data || [];
            
            basicLandNames.forEach(name => {
              const candidates = foundLands.filter(c => c.name === name);
              if (candidates.length > 0) {
                candidates.sort((a, b) => getScore(b) - getScore(a));
                bestCardMap.set(name, candidates[0]);
              }
            });
          }
        } catch (e) { console.error("Land search error", e); }
      }

      // Phase 2: その他のカード（セット優先検索）
      const foundNames = new Set<string>();

      for (let i = 0; i < otherNames.length; i += BATCH_SIZE) {
        const batchNames = otherNames.slice(i, i + BATCH_SIZE);
        const nameConditions = batchNames.map(name => `name:"${name}"`).join(" OR ");
        const setCondition = selectedSet === 'fdn' ? `set:fdn` : `(set:${selectedSet} OR set:fdn)`;
        const query = `(${nameConditions}) ${setCondition} (lang:${language} OR lang:en)`;
        
        try {
          const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query + " unique:prints")}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const foundCards: Card[] = data.data || [];
            batchNames.forEach(name => {
              const candidates = foundCards.filter(c => c.name === name);
              if (candidates.length > 0) {
                candidates.sort((a, b) => getScore(b) - getScore(a));
                bestCardMap.set(name, candidates[0]);
                foundNames.add(name);
              }
            });
          }
        } catch (e) { console.error("Priority search error", e); }
        await new Promise(r => setTimeout(r, 100));
      }

      // Phase 3: フォールバック検索
      const missingNames = otherNames.filter(name => !foundNames.has(name));
      
      if (missingNames.length > 0) {
        for (let i = 0; i < missingNames.length; i += BATCH_SIZE) {
          const batchNames = missingNames.slice(i, i + BATCH_SIZE);
          const nameConditions = batchNames.map(name => `name:"${name}"`).join(" OR ");
          const query = `(${nameConditions}) (lang:${language} OR lang:en) unique:prints`;
          
          try {
            const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              const foundCards: Card[] = data.data || [];
              batchNames.forEach(name => {
                const candidates = foundCards.filter(c => c.name === name);
                if (candidates.length > 0) {
                  candidates.sort((a, b) => getScore(b) - getScore(a));
                  if (!bestCardMap.has(name)) bestCardMap.set(name, candidates[0]);
                }
              });
            }
          } catch (e) { console.error("Fallback search error", e); }
          await new Promise(r => setTimeout(r, 100));
        }
      }

      const updateList = (list: DeckCard[]) => {
        return list.map(card => {
          const bestVersion = bestCardMap.get(card.name);
          if (bestVersion) return { ...bestVersion, quantity: card.quantity };
          return card;
        });
      };

      setDeck(updateList(deck));
      setSideboard(updateList(sideboard));

    } catch (error) {
      console.error(error);
      alert("変換中にエラーが発生しました。");
    } finally {
      setProcessing(false);
    }
  };

  const handleImportDeck = (newMain: DeckCard[], newSide: DeckCard[], importedName?: string) => {
    if (confirm("現在のデッキを上書きしてインポートしますか？")) {
      setDeck(newMain);
      setSideboard(newSide);
      if (importedName) {
        setDeckName(importedName);
      } else {
        setDeckName("Imported Deck");
      }
    }
  };

  return (
    <main className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      
      <header className="p-3 bg-slate-950 border-b border-slate-800 flex gap-4 items-center shrink-0">
        <h1 className="text-lg font-bold mr-2 text-blue-400">MtG PLUS1</h1>
        
        <select
          value={selectedSet}
          onChange={(e) => setSelectedSet(e.target.value)}
          className="p-1.5 rounded bg-slate-800 border border-slate-700 text-sm max-w-[200px]"
          disabled={setsLoading}
        >
          {displayExpansions.map((set) => (
            <option key={set.code} value={set.code}>
              {language === "ja" ? set.name_ja : set.name_en}
            </option>
          ))}
        </select>
        
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
              deckComment={deckComment} // 【追加】
              onChangeDeckComment={setDeckComment} // 【追加】
              onRemove={removeFromDeck} 
              onUnifyLanguage={unifyDeckLanguage}
              onImportDeck={handleImportDeck}
              isProcessing={processing}
              selectedSet={selectedSet}
              onQuantityChange={handleQuantityChange}
              language={language}
            />
          </Panel>
        </PanelGroup>
      </div>
      <Footer />
    </main>
  );
}