"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, DeckCard, EXPANSIONS, LANGUAGES, Expansion } from "@/types";
import SearchPanel from "@/components/SearchPanel";
import DeckPanel from "@/components/DeckPanel";
import Footer from "@/components/Footer";
import AnalysisPanel from "@/components/AnalysisPanel"; 
import SampleHandPanel from "@/components/SampleHandPanel"; 
import { useAllowedSets } from "@/hooks/useAllowedSets";
import { useBannedCards } from "@/hooks/useBannedCards";

import { Search as SearchIcon, BarChart3, Play } from "lucide-react";

export default function Home() {
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

  const [activeTab, setActiveTab] = useState<"search" | "analysis" | "sample">("search");

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

  // エキスパンション名のマップ (コード -> 正式名称)
  const expansionNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    displayExpansions.forEach(ex => {
      map[ex.code] = language === "ja" ? ex.name_ja : ex.name_en;
    });
    return map;
  }, [displayExpansions, language]);

  // --- 共通データ整形関数 ---
  // Scryfallのデータを整形（日本語名の補完、フリガナ削除）
  const formatCardData = (card: Card): Card => {
    const newCard = { ...card };
    
    // フリガナ削除ヘルパー
    const clean = (str?: string) => str?.replace(/[（(].*?[）)]/g, "") || undefined;

    // 1. 各面 (card_faces) のクリーニング
    // 先に各面の printed_name を綺麗にしておく
    if (newCard.card_faces) {
      newCard.card_faces = newCard.card_faces.map((face: any) => ({
        ...face,
        printed_name: clean(face.printed_name) 
      }));
    }

    // 2. トップレベルの名前 (printed_name) の解決
    if (newCard.printed_name) {
      // 既にトップレベルに日本語名があれば、それをクリーニング
      newCard.printed_name = clean(newCard.printed_name);
    } 
    
    // ★修正ポイント: else if で繋げず、printed_nameがない場合は常に結合を試みる
    // lang判定も削除し、データが存在すれば必ず結合する
    if (!newCard.printed_name && newCard.card_faces) {
      // 各面の「日本語名(printed_name)」があればそれを使い、なければ「英語名(name)」を使う
      const faceNames = newCard.card_faces.map((f: any) => f.printed_name || f.name);
      const joinedName = faceNames.join(" // ");
      
      // 結合した名前が存在すればセットする
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
          // ★修正: formatCardDataの結果を as DeckCard でキャストする
          setDeck((parsed.cards || []).map((c: any) => formatCardData(c) as DeckCard));
          setSideboard((parsed.sideboard || []).map((c: any) => formatCardData(c) as DeckCard));
          
          setDeckName(parsed.name || "Untitled Deck");
          setDeckComment(parsed.comment || ""); 
          if (parsed.selectedSet) setSelectedSet(parsed.selectedSet);
          if (parsed.language) setLanguage(parsed.language);
          if (parsed.keyCardIds) setKeyCardIds(parsed.keyCardIds);
        } else if (Array.isArray(parsed)) {
          // ★修正: こちらも同様にキャスト
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
        keyCardIds: keyCardIds, // キーカードも保存
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("mtg-plus1-deck", JSON.stringify(dataToSave));
    }
  }, [deck, sideboard, deckName, deckComment, selectedSet, language, keyCardIds]);

  const executeSearch = async (queryWithOptions: string) => {
    if (!queryWithOptions) return;
    setLoading(true);
    try {
      // ベースクエリの構築
      let baseQuery = `(set:fdn OR set:${selectedSet}) lang:${language} unique:cards`;
      let finalQuery = `${baseQuery} ${queryWithOptions}`;
      
      let url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(finalQuery)}`;
      let res = await fetch(url);
      let data = await res.json();

      // 日本語で見つからない場合のフォールバック（英語検索）
      if ((!data.data || data.data.length === 0) && language === 'ja') {
        baseQuery = `(set:fdn OR set:${selectedSet}) lang:en unique:cards`;
        finalQuery = `${baseQuery} ${queryWithOptions}`;
        url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(finalQuery)}`;
        res = await fetch(url);
        data = await res.json();
      }

      const rawResults: Card[] = data.data || [];
      
      // ★★★ ここを追加・修正 ★★★
      // 検索結果のカードデータにも整形処理（両面カードの名前結合、フリガナ削除）を適用する
      const formattedResults = rawResults.map(card => formatCardData(card));

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
                // ★修正: formatCardDataを使用
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
                // ★修正: formatCardDataを使用
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
                    // ★修正: formatCardDataを使用
                    bestCardMap.set(name, formatCardData(candidates[0]));
                  }
                }
              });
            }
          } catch (e) { console.error("Fallback search error", e); }
          await new Promise(r => setTimeout(r, 100));
        }
      }

      // Phase 4: 疑似日本語化パッチ (デバッグログ付き修正版)
      if (language === 'ja') {
        const hasJapanese = (str?: string) => str && /[ぁ-んァ-ン一-龠]/.test(str);

        // 修正対象の抽出
        const targets = Array.from(bestCardMap.entries()).filter(([_, card]) => {
          if (card.lang !== 'ja') return true;
          // 日本語版データなのに、表示名に日本語が含まれていないものを対象にする
          const isInvalidJa = !hasJapanese(card.printed_name);
          return isInvalidJa;
        });
        
        // ▼ログ: どのカードが「日本語化が必要」と判定されたか
        console.log("Phase 4 Targets:", targets.map(([name, c]) => ({ 
            name, 
            lang: c.lang, 
            current_printed_name: c.printed_name,
            oracle_id: (c as any).oracle_id 
        })));

        if (targets.length > 0) {
          const oracleIds = targets.map(([_, card]) => (card as any).oracle_id).filter(Boolean);
          
          for (let i = 0; i < oracleIds.length; i += BATCH_SIZE) {
             const batchIds = oracleIds.slice(i, i + BATCH_SIZE);
             const idConditions = batchIds.map(oid => `oracle_id:${oid}`).join(" OR ");
             // どのセットでも良いので日本語版を探す
             const query = `(${idConditions}) lang:ja unique:prints`;

             console.log(`Phase 4 Query [Batch ${i/BATCH_SIZE + 1}]:`, query);

             try {
                const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;
                const res = await fetch(url);
                if (res.ok) {
                   const data = await res.json();
                   const foundJaCards: any[] = data.data || [];
                   
                   // ▼ログ: APIが見つけてきた日本語カード候補
                   console.log(`Phase 4 Found Candidates:`, foundJaCards.map(c => ({
                       name: c.name,
                       printed_name: c.printed_name,
                       set: c.set
                   })));

                   targets.forEach(([name, originalCard]) => {
                      // 自分のOracle IDを持ち、かつ「ちゃんと日本語名が入っている」データを優先して探す
                      const jaMatch = foundJaCards.find(c => 
                        c.oracle_id === (originalCard as any).oracle_id &&
                        (hasJapanese(c.printed_name) || (c.card_faces && c.card_faces.some((f:any) => hasJapanese(f.printed_name))))
                      );

                      if (jaMatch) {
                         const formattedJa = formatCardData(jaMatch);
                         
                         // ▼ログ: 適用成功
                         console.log(`✅ Applying Japanese Patch: ${name} -> ${formattedJa.printed_name}`);

                         bestCardMap.set(name, {
                            ...originalCard,
                            printed_name: formattedJa.printed_name, 
                            card_faces: originalCard.card_faces?.map((face: any, idx: number) => ({
                                ...face,
                                printed_name: formattedJa.card_faces?.[idx]?.printed_name || face.printed_name
                            })) || formattedJa.card_faces
                         });
                      } else {
                         // ▼ログ: 対象だったが見つからなかった（または条件を満たす日本語版がなかった）
                         if (batchIds.includes((originalCard as any).oracle_id)) {
                             console.warn(`❌ No valid Japanese version found for: ${name}`);
                         }
                      }
                   });
                } else {
                    console.error("Phase 4 API Error:", res.status);
                }
             } catch (e) { console.error("Pseudo-Japanese patch error", e); }
             await new Promise(r => setTimeout(r, 100));
          }
        } else {
            console.log("Phase 4: No targets found (All cards seem to have Japanese names).");
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
            />
          </Panel>
        </PanelGroup>
      </div>
      <Footer />
    </main>
  );
}