"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, DeckCard, EXPANSIONS, LANGUAGES, Expansion, TurnMove } from "@/types";
import SearchPanel from "@/components/SearchPanel";
import DeckPanel from "@/components/DeckPanel";
import InfoPanel from "@/components/InfoPanel"; // ★追加
import Footer from "@/components/Footer";
import AnalysisPanel from "@/components/AnalysisPanel"; 
import SampleHandPanel from "@/components/SampleHandPanel"; 
import { useAllowedSets } from "@/hooks/useAllowedSets";
import { useBannedCards } from "@/hooks/useBannedCards";

import { Search as SearchIcon, BarChart3, Play, Info } from "lucide-react";

export default function BuilderPage() {
  const [selectedSet, setSelectedSet] = useState("fdn");
  const [language, setLanguage] = useState("ja");
  
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  
  // デッキ情報
  const [deckName, setDeckName] = useState("Untitled Deck");
  const [deckComment, setDeckComment] = useState("");
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [sideboard, setSideboard] = useState<DeckCard[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [keyCardIds, setKeyCardIds] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<"search" | "analysis" | "sample" | "info">("search");

  // ★変更: 詳細情報のState
  const [archetype, setArchetype] = useState("");
  const [concepts, setConcepts] = useState("");
  const [colors, setColors] = useState<string[]>([]);

  // 文字列ではなく構造化データに変更
  const [turnMoves, setTurnMoves] = useState<TurnMove[]>([
    { id: "1", turn: "1", action: "" },
    { id: "2", turn: "2", action: "" },
    { id: "3", turn: "3", action: "" },
  ]);

  // ★追加: 表示設定用State (初期値はtrue=表示)
  const [showArchetype, setShowArchetype] = useState(true);
  const [showConcepts, setShowConcepts] = useState(true);
  const [showTurnMoves, setShowTurnMoves] = useState(true);

  const { allowedSets, loading: setsLoading } = useAllowedSets();

  const { bannedMap } = useBannedCards();
  const simpleBannedMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(bannedMap).forEach(([setCode, list]) => {
      map[setCode] = list.map(item => item.name);
    });
    return map;
  }, [bannedMap]);

  const displayExpansions = useMemo(() => {
    if (setsLoading) return EXPANSIONS;
    if (allowedSets.length === 0) return EXPANSIONS;
    return allowedSets;
  }, [allowedSets, setsLoading]);

  const expansionNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    displayExpansions.forEach(ex => {
      map[ex.code] = language === "ja" ? ex.name_ja : ex.name_en;
    });
    return map;
  }, [displayExpansions, language]);

  const formatCardData = (card: Card): Card => {
    const newCard = { ...card };
    const clean = (str?: string) => str?.replace(/[（(].*?[）)]/g, "") || undefined;

    if (newCard.card_faces) {
      newCard.card_faces = newCard.card_faces.map((face: any) => ({
        ...face,
        printed_name: clean(face.printed_name) 
      }));
    }

    if (newCard.printed_name) {
      newCard.printed_name = clean(newCard.printed_name);
    } 
    
    if (!newCard.printed_name && newCard.card_faces) {
      const faceNames = newCard.card_faces.map((f: any) => f.printed_name || f.name);
      const joinedName = faceNames.join(" // ");
      if (joinedName && joinedName !== " // ") {
        newCard.printed_name = joinedName;
      }
    }
    return newCard;
  };

  // LocalStorage読み込み
  useEffect(() => {
    const savedData = localStorage.getItem("mtg-plus1-deck");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setDeck((parsed.cards || []).map((c: any) => formatCardData(c) as DeckCard));
          setSideboard((parsed.sideboard || []).map((c: any) => formatCardData(c) as DeckCard));
          
          setDeckName(parsed.name || "Untitled Deck");
          setDeckComment(parsed.comment || ""); 
          if (parsed.selectedSet) setSelectedSet(parsed.selectedSet);
          if (parsed.language) setLanguage(parsed.language);
          if (parsed.keyCardIds) setKeyCardIds(parsed.keyCardIds);

          // ★追加: 詳細情報の読み込み
          if (parsed.archetype) setArchetype(parsed.archetype);
          if (parsed.concepts) setConcepts(parsed.concepts);
          
          // 旧データ(文字列)と新データ(配列)の互換性維持
          if (parsed.turnMoves) {
            if (Array.isArray(parsed.turnMoves)) {
              setTurnMoves(parsed.turnMoves);
            } else if (typeof parsed.turnMoves === 'string') {
              setTurnMoves([{ id: "legacy", turn: "Memo", action: parsed.turnMoves }]);
            }
          }

        } else if (Array.isArray(parsed)) {
          setDeck(parsed.map((c: any) => formatCardData(c) as DeckCard));
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  // LocalStorage保存
  useEffect(() => {
    if (deck.length > 0 || deckName !== "Untitled Deck") {
      const dataToSave = {
        name: deckName,
        comment: deckComment,
        cards: deck,
        sideboard: sideboard,
        selectedSet: selectedSet,
        language: language,
        keyCardIds: keyCardIds,
        // ★追加: 詳細情報も保存
        archetype,
        concepts,
        turnMoves,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("mtg-plus1-deck", JSON.stringify(dataToSave));
    }
  }, [deck, sideboard, deckName, deckComment, selectedSet, language, keyCardIds, archetype, concepts, turnMoves]); // 依存配列に追加

  const executeSearch = async (queryWithOptions: string) => {
    if (!queryWithOptions) return;
    setLoading(true);
    
    try {
      // 1. 基本設定
      // Foundations関連セット (FDN, FBB=ビギナー, J25=ジャンプスタート) をすべて対象にする
      const targetSets = new Set(['fdn']); 
      if (selectedSet) targetSets.add(selectedSet);
      
      const setsQuery = Array.from(targetSets).map(s => `set:${s}`).join(" OR ");
      const baseQuery = `(${setsQuery}) unique:prints`;
      const langQuery = language === 'ja' ? `(lang:ja OR lang:en)` : `lang:en`;
      
      // Aルート用のクエリ（通常検索）
      const primaryQuery = `${baseQuery} ${langQuery} ${queryWithOptions}`;
      
      const promises = [];

      // ヘルパー: 404エラーを「0件」として扱うfetchラッパー
      const safeFetch = (url: string) => {
        return fetch(url)
          .then(async (res) => {
            if (res.status === 404) return []; // 404なら空配列を返して終了
            if (!res.ok) {
              console.warn(`API Warning: ${res.status}`);
              return [];
            }
            const json = await res.json();
            return json.data || [];
          })
          .catch(e => {
            console.error("Fetch failed:", e);
            return [];
          });
      };

      // --- A. メイン検索 (セット指定あり) ---
      promises.push(
        safeFetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(primaryQuery)}`)
      );

      // --- B. クロス検索 (日本語入力時のみ発動) ---
      const hasJapaneseInput = /[ぁ-んァ-ン一-龠]/.test(queryWithOptions);
      
      if (language === 'ja' && hasJapaneseInput) {
        
        // ★★★ 修正ポイント: 検索ワードからセット指定やカッコを強制削除する ★★★
        // 例: "解呪 (set:fdn)" -> "解呪 "
        // これにより「全セットから『解呪』を探す」ことが可能になる
        let cleanQuery = queryWithOptions
          .replace(/\(s:[a-zA-Z0-9]+\s+OR\s+s:[a-zA-Z0-9]+\)/gi, "") // (s:fdn OR s:...) の除去
          .replace(/set:[a-zA-Z0-9]+/gi, "") // set:xxx の除去
          .replace(/s:[a-zA-Z0-9]+/gi, "")   // s:xxx の除去
          .replace(/[()]/g, "")              // 残ったカッコの除去
          .trim();

        if (cleanQuery) {
          // 1. クリーンになった単語だけで、全セットから日本語カードを探す
          const nameQuery = `${cleanQuery} lang:ja unique:prints`;
          
          const oracleSearchPromise = safeFetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(nameQuery)}`)
            .then(async (jaCards: any[]) => {
              if (jaCards.length === 0) return [];

              // 見つかった日本語カードから Oracle ID を抽出
              const oracleIds = jaCards.map((c: any) => c.oracle_id).filter(Boolean);
              // 重複排除して、URLエラー防止のため「上位20件」に絞る
              const uniqueOracleIds = Array.from(new Set(oracleIds)).slice(0, 20);

              if (uniqueOracleIds.length === 0) return [];

              // 2. そのIDを持つカードを、Foundations関連セット等からピンポイント検索
              const oracleQueryPart = uniqueOracleIds.map(id => `oracle_id:${id}`).join(" OR ");
              const targetSetQuery = `(${oracleQueryPart}) (${setsQuery}) unique:prints`;
              
              const targetCards = await safeFetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(targetSetQuery)}`);

              // 3. 英語版のデータに、日本語名を上書きして返す
              return targetCards.map((engCard: any) => {
                const originalJa = jaCards.find((ja: any) => ja.oracle_id === engCard.oracle_id);
                if (originalJa) {
                  const formattedJa = formatCardData(originalJa);
                  return {
                    ...engCard,
                    printed_name: formattedJa.printed_name,
                    card_faces: engCard.card_faces ? engCard.card_faces.map((face: any, idx: number) => ({
                      ...face,
                      printed_name: formattedJa.card_faces?.[idx]?.printed_name || face.printed_name
                    })) : undefined
                  };
                }
                return engCard;
              });
            });
            
          promises.push(oracleSearchPromise);
        }
      }

      // 3. 結果の統合
      const results = await Promise.all(promises);
      const allCards = results.flat();
      
      const uniqueCardsMap = new Map();
      allCards.forEach((c: any) => {
        if (c && c.oracle_id) { // oracle_idをキーにして同一カードをまとめる
          const existing = uniqueCardsMap.get(c.oracle_id);
          const formattedNew = formatCardData(c);

          if (!existing) {
            uniqueCardsMap.set(c.oracle_id, formattedNew);
          } else {
            // 既にリストにある場合、より良い条件の方を残す
            let replace = false;

            // 基準1: 言語 (日本語優先)
            if (existing.lang !== 'ja' && formattedNew.lang === 'ja') {
              replace = true;
            }
            // 基準2: 同じ言語なら、コレクション番号が若い方(通常版)を優先
            else if (existing.lang === formattedNew.lang) {
              const numA = parseInt(existing.collector_number, 10);
              const numB = parseInt(formattedNew.collector_number, 10);
              if (!isNaN(numB) && (isNaN(numA) || numB < numA)) {
                replace = true;
              }
            }

            if (replace) {
              uniqueCardsMap.set(c.oracle_id, formattedNew);
            }
          }
        }
      });

      setSearchResults(Array.from(uniqueCardsMap.values()));

    } catch (error) {
      console.error("Search critical error:", error);
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

      const basicLandNames = uniqueNames.filter(name => BASIC_LANDS.includes(name));
      const otherNames = uniqueNames.filter(name => !BASIC_LANDS.includes(name));

      const getScore = (c: Card) => {
        let score = 0;
        const cSet = c.set.toLowerCase();
        if (cSet === selectedSet.toLowerCase()) score += 10000;
        else if (cSet === 'fdn') score += 5000;
        if (c.lang === language) score += 1000;
        else if (c.lang === 'en') score += 500;
        if (cSet === 'plist' || cSet === 'mb1' || cSet.length > 3) score -= 100;
        if (!isNaN(Number(c.collector_number))) score += 50; 
        if (BASIC_LANDS.includes(c.name) && c.full_art) score += 20;
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
                bestCardMap.set(name, formatCardData(candidates[0]));
              }
            });
          }
        } catch (e) { console.error("Land search error", e); }
      }

      // Phase 2: その他のカード
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
                bestCardMap.set(name, formatCardData(candidates[0]));
                foundNames.add(name);
              }
            });
          }
        } catch (e) { console.error("Priority search error", e); }
        await new Promise(r => setTimeout(r, 100));
      }

      // Phase 3: フォールバック
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
                    bestCardMap.set(name, formatCardData(candidates[0]));
                  }
                }
              });
            }
          } catch (e) { console.error("Fallback search error", e); }
          await new Promise(r => setTimeout(r, 100));
        }
      }

      // Phase 4: 疑似日本語化パッチ
      if (language === 'ja') {
        const hasJapanese = (str?: string) => str && /[ぁ-んァ-ン一-龠]/.test(str);

        const targets = Array.from(bestCardMap.entries()).filter(([_, card]) => {
          if (card.lang !== 'ja') return true;
          return !hasJapanese(card.printed_name);
        });
        
        if (targets.length > 0) {
          const oracleIds = targets.map(([_, card]) => (card as any).oracle_id).filter(Boolean);
          
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
                   
                   targets.forEach(([name, originalCard]) => {
                      const jaMatch = foundJaCards.find(c => 
                        c.oracle_id === (originalCard as any).oracle_id &&
                        (hasJapanese(c.printed_name) || (c.card_faces && c.card_faces.some((f:any) => hasJapanese(f.printed_name))))
                      );

                      if (jaMatch) {
                         const formattedJa = formatCardData(jaMatch);
                         bestCardMap.set(name, {
                            ...originalCard,
                            printed_name: formattedJa.printed_name, 
                            card_faces: originalCard.card_faces?.map((face: any, idx: number) => ({
                                ...face,
                                printed_name: formattedJa.card_faces?.[idx]?.printed_name || face.printed_name
                            })) || formattedJa.card_faces
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
    setDeckName("Untitled Deck");
    setDeckComment("");
    setKeyCardIds([]); 
  };

  return (
    <main className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      
      <header className="p-3 bg-slate-950 border-b border-slate-800 flex gap-4 items-center shrink-0">
        <h1 className="text-lg font-bold mr-2 text-blue-400">MtG PLUS1</h1>
        <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)} className="p-1.5 rounded bg-slate-800 border border-slate-700 text-sm max-w-[200px]" disabled={setsLoading}>
          {displayExpansions.map((set) => <option key={set.code} value={set.code}>{language === "ja" ? set.name_ja : set.name_en}</option>)}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="p-1.5 rounded bg-slate-800 border border-slate-700 text-sm font-bold w-40">
          {LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
        </select>
      </header>

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          
          {/* 左パネル (タブ切り替え対応) */}
          <Panel defaultSize={50} minSize={30} className="flex flex-col">
            
            {/* タブナビゲーション */}
            <div className="flex border-b border-slate-800 bg-slate-900">
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "search" ? "bg-slate-800 text-blue-400 border-b-2 border-blue-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
              >
                <SearchIcon size={14} /> Search
              </button>
              <button
                onClick={() => setActiveTab("analysis")}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "analysis" ? "bg-slate-800 text-purple-400 border-b-2 border-purple-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
              >
                <BarChart3 size={14} /> Stats
              </button>
              <button
                onClick={() => setActiveTab("sample")}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "sample" ? "bg-slate-800 text-green-400 border-b-2 border-green-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
              >
                <Play size={14} /> Solitaire
              </button>
              {/* ★追加: Infoタブ */}
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "info" ? "bg-slate-800 text-yellow-400 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
              >
                <Info size={14} /> Info
              </button>
            </div>

            {/* コンテンツ切り替え (CSS hiddenを使用) */}
            <div className="flex-1 overflow-hidden relative bg-slate-900/50">
              
              {/* 1. Search Panel */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "search" ? "z-10" : "hidden"}`}>
                <SearchPanel 
                  searchResults={searchResults} 
                  loading={loading} 
                  onSearch={executeSearch}
                  onAdd={addToDeck}
                  language={language}
                  expansionSetCode={selectedSet}
                  expansionSetName={expansionNameMap[selectedSet]}
                />
              </div>
              
              {/* 2. Analysis Panel */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "analysis" ? "z-10" : "hidden"}`}>
                <AnalysisPanel deck={deck} />
              </div>

              {/* 3. Sample Hand Panel */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "sample" ? "z-10" : "hidden"}`}>
                <SampleHandPanel deck={deck} />
              </div>

              {/* ★追加: 4. Info Panel */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "info" ? "z-10" : "hidden"}`}>
                <InfoPanel 
                  colors={colors} setColors={setColors}
                  archetype={archetype} setArchetype={setArchetype}
                  concepts={concepts} setConcepts={setConcepts}
                  turnMoves={turnMoves} setTurnMoves={setTurnMoves}
                  // 表示設定
                  showArchetype={showArchetype} setShowArchetype={setShowArchetype}
                  showConcepts={showConcepts} setShowConcepts={setShowConcepts}
                  showTurnMoves={showTurnMoves} setShowTurnMoves={setShowTurnMoves}
                />
              </div>

            </div>
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
              bannedCardsMap={simpleBannedMap}
              // ★追加: 詳細情報と表示設定を渡す
              archetype={archetype}
              colors={colors}
              concepts={concepts}
              turnMoves={turnMoves}
              showArchetype={showArchetype}
              showConcepts={showConcepts}
              showTurnMoves={showTurnMoves}
            />
          </Panel>
        </PanelGroup>
      </div>
      <Footer />
    </main>
  );
}