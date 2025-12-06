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
  const [deckComment, setDeckComment] = useState(""); 
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [sideboard, setSideboard] = useState<DeckCard[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [keyCardIds, setKeyCardIds] = useState <string[]>([]);

  const { allowedSets, loading: setsLoading } = useAllowedSets();

  const displayExpansions = useMemo(() => {
    if (setsLoading) return EXPANSIONS;
    if (allowedSets.length === 0) return EXPANSIONS;
    return allowedSets;
  }, [allowedSets, setsLoading]);

  const legalSetCodes = useMemo(() => {
    return displayExpansions.map(ex => ex.code);
  }, [displayExpansions]);

  // ★追加: セットコード -> セット名のマップを作成
  const expansionNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    displayExpansions.forEach(ex => {
      // 言語設定に応じて日本語名か英語名を採用
      map[ex.code] = language === "ja" ? ex.name_ja : ex.name_en;
    });
    return map;
  }, [displayExpansions, language]);

  // LocalStorage読み込み (変更なし)
  useEffect(() => {
    const savedData = localStorage.getItem("mtg-plus1-deck");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setDeck(parsed.cards || []);
          setSideboard(parsed.sideboard || []);
          setDeckName(parsed.name || "Untitled Deck");
          setDeckComment(parsed.comment || ""); 
          if (parsed.selectedSet) setSelectedSet(parsed.selectedSet);
          if (parsed.language) setLanguage(parsed.language);
        } else if (Array.isArray(parsed)) {
          setDeck(parsed);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  // LocalStorage保存 (変更なし)
  useEffect(() => {
    if (deck.length > 0 || deckName !== "Untitled Deck") {
      const dataToSave = {
        name: deckName,
        comment: deckComment,
        cards: deck,
        sideboard: sideboard,
        selectedSet: selectedSet,
        language: language,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("mtg-plus1-deck", JSON.stringify(dataToSave));
    }
  }, [deck, sideboard, deckName, deckComment, selectedSet, language]);

  const formatCardData = (card: Card): Card => {
    const newCard = { ...card };

    // フリガナ削除ヘルパー
    const clean = (str?: string) => str?.replace(/[（(].*?[）)]/g, "") || "";

    // 1. 各面 (card_faces) のクリーニング
    if (newCard.card_faces) {
      newCard.card_faces = newCard.card_faces.map(face => ({
        ...face,
        printed_name: clean(face.printed_name)
      }));
    }

    // 2. トップレベルの名前 (printed_name) の解決
    if (newCard.printed_name) {
      // 既に日本語名があれば、フリガナだけ消す
      newCard.printed_name = clean(newCard.printed_name);
    } else if (newCard.card_faces && newCard.lang === "ja") {
      // ★ここが重要: 日本語版なのにトップレベル名がない場合（両面カードなど）
      // 各面の日本語名を " // " で結合して生成する
      const joinedName = newCard.card_faces
        .map(f => f.printed_name || f.name) // さっきクリーニングした名前を使う
        .join(" // ");
      
      if (joinedName && joinedName !== " // ") {
        newCard.printed_name = joinedName;
      }
    }

    return newCard;
  };

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
        // 日本語で見つからない場合、英語で再検索
        baseQuery = `(set:fdn OR set:${selectedSet}) lang:en unique:cards`;
        finalQuery = `${baseQuery} ${queryWithOptions}`;
        url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(finalQuery)}`;
        res = await fetch(url);
        data = await res.json();
      }

      const rawResults: Card[] = data.data || [];
      
      // ★ここで整形処理を通す
      const formattedResults = rawResults.map(formatCardData);

      setSearchResults(formattedResults);
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

// 言語統一処理 (両面カード対応版)
  const unifyDeckLanguage = async () => {
    const BASIC_LANDS = ["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"];

    const cleanName = (name: string | undefined) => {
      if (!name) return name;
      // 全角・半角括弧とその中身を削除
      return name.replace(/[（(].*?[）)]/g, "");
    };

    const cleanCardData = (card: Card): Card => {
      const newCard = { ...card };
      // トップレベルのクリーニング
      if (newCard.printed_name) {
        newCard.printed_name = cleanName(newCard.printed_name);
      }
      // 各面のクリーニング
      if (newCard.card_faces) {
        newCard.card_faces = newCard.card_faces.map(face => ({
          ...face,
          printed_name: cleanName(face.printed_name)
        }));
      }
      return newCard;
    };
    
    if ((deck.length === 0 && sideboard.length === 0) || !confirm(`デッキ内の言語を「${language === 'ja' ? '日本語' : '英語'}」に統一しますか？`)) return;
    
    setProcessing(true);

    try {
      const allCards = [...deck, ...sideboard];
      const uniqueNames = Array.from(new Set(allCards.map(c => c.name)));
      const bestCardMap = new Map<string, Card>();

      const BATCH_SIZE = 20;

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
                bestCardMap.set(name, cleanCardData(candidates[0]));
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
                bestCardMap.set(name, cleanCardData(candidates[0]));
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
                  if (!bestCardMap.has(name)) {
                    bestCardMap.set(name, cleanCardData(candidates[0]));
                  }
                }
              });
            }
          } catch (e) { console.error("Fallback search error", e); }
          await new Promise(r => setTimeout(r, 100));
        }
      }

      // Phase 4: 疑似日本語化パッチ（修正版）
      if (language === 'ja') {
        const englishCardEntries = Array.from(bestCardMap.entries()).filter(([_, card]) => card.lang !== 'ja');
        if (englishCardEntries.length > 0) {
          const oracleIds = englishCardEntries.map(([_, card]) => (card as any).oracle_id).filter(Boolean);
          for (let i = 0; i < oracleIds.length; i += BATCH_SIZE) {
             const batchIds = oracleIds.slice(i, i + BATCH_SIZE);
             const idConditions = batchIds.map(oid => `oracle_id:${oid}`).join(" OR ");
             const query = `(${idConditions}) lang:ja unique:prints`;
             try {
                const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;
                const res = await fetch(url);
                if (res.ok) {
                   const data = await res.json();
                   const foundJaCards: any[] = data.data || [];
                   
                   englishCardEntries.forEach(([name, originalCard]) => {
                      const jaMatch = foundJaCards.find(c => c.oracle_id === (originalCard as any).oracle_id);
                      if (jaMatch) {
                         // 日本語版データを整形（ここで名前結合が行われる）
                         const formattedJa = formatCardData(jaMatch);

                         // 英語版のベースに、日本語版の名前情報を注入
                         bestCardMap.set(name, {
                            ...originalCard,
                            printed_name: formattedJa.printed_name, // "パラメキア皇帝 // 地獄の..." が入る
                            card_faces: formattedJa.card_faces // 各面の日本語名も入る
                         });
                      }
                   });
                }
             } catch (e) { console.error("Pseudo-Japanese patch error", e); }
             await new Promise(r => setTimeout(r, 100));
          }
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

  const handleToggleKeyCard = (cardId: string) => {
    setKeyCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      } else {
        return [...prev, cardId];
      }
    });
  };

  const handleResetDeck = () => {
    setDeck([]);
    setSideboard([]);
    setDeckName("");
    setDeckComment("");
    setKeyCardIds([]); 
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
          className="p-1.5 rounded bg-slate-800 border border-slate-700 text-sm font-bold w-40"
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
              expansionSetCode={selectedSet}
              // ★追加: 正しいセット名を渡す
              expansionSetName={expansionNameMap[selectedSet]}
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
              deckComment={deckComment} 
              onChangeDeckComment={setDeckComment} 
              onRemove={removeFromDeck} 
              onUnifyLanguage={unifyDeckLanguage}
              onImportDeck={handleImportDeck}
              isProcessing={processing}
              selectedSet={selectedSet}
              onQuantityChange={handleQuantityChange}
              language={language}
              keyCardIds={keyCardIds}
              onToggleKeyCard={handleToggleKeyCard}
              onResetDeck={handleResetDeck}
            />
          </Panel>
        </PanelGroup>
      </div>
      <Footer />
    </main>
  );
}