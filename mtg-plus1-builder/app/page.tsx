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
  
  // デッキ名ステート
  const [deckName, setDeckName] = useState("Untitled Deck");
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [sideboard, setSideboard] = useState<DeckCard[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Firestoreから許可セットを取得
  const { allowedSets, loading: setsLoading } = useAllowedSets();

  // 表示用エキスパンションリストの生成
  const displayExpansions = useMemo(() => {
    if (setsLoading) return EXPANSIONS;
    if (allowedSets.length === 0) return EXPANSIONS;
    return allowedSets;
  }, [allowedSets, setsLoading]);

  // DeckPanelに渡すためのコード配列を作成
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
        cards: deck,
        sideboard: sideboard,
        selectedSet: selectedSet,
        language: language,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("mtg-plus1-deck", JSON.stringify(dataToSave));
    }
  }, [deck, sideboard, deckName, selectedSet, language]);

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

  const unifyDeckLanguage = async () => {
    const BASIC_LANDS = ["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"];
    
    if ((deck.length === 0 && sideboard.length === 0) || !confirm("デッキ内の言語を統一しますか？\n（基本土地は選択したセットに、範囲外のカードは適正なセットに自動変換されます）")) return;
    
    setProcessing(true);

    try {
      const allCards = [...deck, ...sideboard];
      const validCardKeys = new Set<string>();
      const nameSearchKeys = new Set<string>();

      allCards.forEach(card => {
        const isBasic = BASIC_LANDS.includes(card.name);
        const isSetValid = card.set.toLowerCase() === "fdn" || card.set.toLowerCase() === selectedSet.toLowerCase();

        if (isBasic) {
          nameSearchKeys.add(card.name);
        } else if (!isSetValid) {
          nameSearchKeys.add(card.name);
        } else {
          validCardKeys.add(`${card.set.toLowerCase()}:${card.collector_number}`);
        }
      });

      const queryParts: string[] = [];
      validCardKeys.forEach(key => {
        const [s, cn] = key.split(":");
        queryParts.push(`(set:${s} cn:"${cn}" lang:${language})`);
      });
      nameSearchKeys.forEach(name => {
        queryParts.push(`(name:"${name}" (set:${selectedSet} OR set:fdn) lang:${language})`);
      });

      if (queryParts.length === 0) {
        setProcessing(false);
        return;
      }

      const BATCH_SIZE = 15;
      const fetchedCardsMap = new Map<string, Card>();
      const fetchedNameMap = new Map<string, Card>();

      for (let i = 0; i < queryParts.length; i += BATCH_SIZE) {
        const chunk = queryParts.slice(i, i + BATCH_SIZE);
        const query = chunk.join(" or ");
        try {
          const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`;
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();

          if (data.data) {
            data.data.forEach((c: Card) => {
              if (c.lang !== language) return;
              fetchedCardsMap.set(`${c.set.toLowerCase()}:${c.collector_number}`, c);
              const existing = fetchedNameMap.get(c.name);
              if (!existing) {
                fetchedNameMap.set(c.name, c);
              } else {
                const currentIsSelected = existing.set.toLowerCase() === selectedSet.toLowerCase();
                const newIsSelected = c.set.toLowerCase() === selectedSet.toLowerCase();
                const isBasic = BASIC_LANDS.includes(c.name);
                let shouldUpdate = false;

                if (newIsSelected && !currentIsSelected) {
                  shouldUpdate = true;
                } else if (newIsSelected === currentIsSelected) {
                    if (isBasic && !!c.full_art !== !!existing.full_art) {
                        shouldUpdate = !!c.full_art;
                    } else {
                        const numA = parseInt(c.collector_number);
                        const numB = parseInt(existing.collector_number);
                        if (!isNaN(numA) && !isNaN(numB)) {
                          if (numA < numB) shouldUpdate = true;
                        } else {
                          if (c.collector_number < existing.collector_number) shouldUpdate = true;
                        }
                    }
                }
                if (shouldUpdate) {
                    fetchedNameMap.set(c.name, c);
                }
              }
            });
          }
        } catch (e) { console.error("Batch error", e); }
        await new Promise(r => setTimeout(r, 100));
      }

      const updateList = (list: DeckCard[]) => {
        return list.map(card => {
          const isBasic = BASIC_LANDS.includes(card.name);
          const isSetValid = card.set.toLowerCase() === "fdn" || card.set.toLowerCase() === selectedSet.toLowerCase();
          if (isBasic || !isSetValid) {
            const newCard = fetchedNameMap.get(card.name);
            if (newCard) return { ...newCard, quantity: card.quantity };
          }
          const key = `${card.set.toLowerCase()}:${card.collector_number}`;
          const newCardById = fetchedCardsMap.get(key);
          if (newCardById) return { ...newCardById, quantity: card.quantity };
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
        
        {/* セット選択（Firestore連動 + 日英対応） */}
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