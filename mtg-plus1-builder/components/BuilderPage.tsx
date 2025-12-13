"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, DeckCard, EXPANSIONS, LANGUAGES, Expansion, TurnMove } from "@/types";
import { DeckData } from "@/types/deck"; // 型定義ファイルをインポート
import { createDeck, updateDeck } from "@/app/actions/deck"; // Server Actions

import SearchPanel from "@/components/SearchPanel";
import DeckPanel from "@/components/DeckPanel";
import InfoPanel from "@/components/InfoPanel";
import Footer from "@/components/Footer";
import ShareModal from "@/components/ShareModal";
import AnalysisPanel from "@/components/AnalysisPanel"; 
import SampleHandPanel from "@/components/SampleHandPanel"; 
import HelpModal from "@/components/BuilderHelpModal";
import UserMenu from "@/components/UserMenu";
import { useAllowedSets } from "@/hooks/useAllowedSets";
import { useBannedCards } from "@/hooks/useBannedCards";
import { useAuth } from "@/context/AuthContext";

import { Search as SearchIcon, BarChart3, Play, Info, CloudUpload, Save, Share2, HelpCircle } from "lucide-react";

// Props定義: 編集モード時はこれらの値が渡される
type BuilderPageProps = {
  initialData?: DeckData;
  deckId?: string;
  editKey?: string;
};

export default function BuilderPage({ initialData, deckId, editKey }: BuilderPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  // --- State定義 (初期値をPropsから設定可能に) ---
  const [selectedSet, setSelectedSet] = useState(initialData?.selectedSet || "fdn");
  const [language, setLanguage] = useState(initialData?.language || "ja");
  
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  
  // デッキ情報
  const [deckName, setDeckName] = useState(initialData?.name || "Untitled Deck");
  const [builderName, setBuilderName] = useState(initialData?.builderName || "");
  const [deck, setDeck] = useState<DeckCard[]>(initialData?.cards || []);
  const [sideboard, setSideboard] = useState<DeckCard[]>(initialData?.sideboard || []);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // 保存中フラグ

  const [keyCardIds, setKeyCardIds] = useState<string[]>(initialData?.keyCardIds || []);

  const [activeTab, setActiveTab] = useState<"search" | "analysis" | "sample" | "info">("search");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 詳細情報
  const [archetype, setArchetype] = useState(initialData?.archetype || "");
  const [concepts, setConcepts] = useState(initialData?.concepts || "");
  const [colors, setColors] = useState<string[]>(initialData?.colors || []);

  const [turnMoves, setTurnMoves] = useState<TurnMove[]>(initialData?.turnMoves || [
    { id: "1", turn: "1", action: "" },
    { id: "2", turn: "2", action: "" },
    { id: "3", turn: "3", action: "" },
  ]);

  // 表示設定 (初期値はtrue)
  const [showArchetype, setShowArchetype] = useState(true);
  const [showConcepts, setShowConcepts] = useState(true);
  const [showTurnMoves, setShowTurnMoves] = useState(true);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // --- Hooks ---
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

  // --- Helpers ---
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

  // --- Effects: データの読み込みと保存 ---

  // 1. LocalStorage読み込み (新規作成モード時のみ)
  useEffect(() => {
    // サーバーからデータを受け取っている(編集モード)場合はLSを無視
    if (initialData) return;

    const savedData = localStorage.getItem("mtg-plus1-deck");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setDeck((parsed.cards || []).map((c: any) => formatCardData(c) as DeckCard));
          setSideboard((parsed.sideboard || []).map((c: any) => formatCardData(c) as DeckCard));
          
          setDeckName(parsed.name || "Untitled Deck");
          if (parsed.selectedSet) setSelectedSet(parsed.selectedSet);
          if (parsed.language) setLanguage(parsed.language);
          if (parsed.keyCardIds) setKeyCardIds(parsed.keyCardIds);

          if (parsed.archetype) setArchetype(parsed.archetype);
          if (parsed.colors) setColors(parsed.colors);
          if (parsed.builderName) setBuilderName(parsed.builderName);
          if (parsed.concepts) setConcepts(parsed.concepts);
          
          if (parsed.turnMoves) {
            if (Array.isArray(parsed.turnMoves)) {
              setTurnMoves(parsed.turnMoves);
            } else if (typeof parsed.turnMoves === 'string') {
              setTurnMoves([{ id: "legacy", turn: "Memo", action: parsed.turnMoves }]);
            }
          }
        } else if (Array.isArray(parsed)) {
          // 旧データ形式互換
          setDeck(parsed.map((c: any) => formatCardData(c) as DeckCard));
        }
      } catch (e) { console.error(e); }
    }
  }, [initialData]);

  // 2. LocalStorage保存 (新規作成モード時のみ自動保存)
  useEffect(() => {
    // 編集モード(deckIdがある)時は自動保存しない（意図しない上書き防止）
    if (deckId) return;

    if (deck.length > 0 || deckName !== "Untitled Deck") {
      const dataToSave = {
        name: deckName,
        builderName,
        userId: user?.uid,
        cards: deck,
        sideboard: sideboard,
        selectedSet: selectedSet,
        language: language,
        keyCardIds: keyCardIds,
        colors,
        archetype,
        concepts,
        turnMoves,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("mtg-plus1-deck", JSON.stringify(dataToSave));
    }
  }, [deck, sideboard, deckName, builderName, selectedSet, language, keyCardIds, colors, archetype, concepts, turnMoves, deckId]);


  // --- Server Actions: クラウド保存 ---
  const handleCloudSave = async () => {
    if (deck.length === 0 && sideboard.length === 0) {
        alert("デッキが空です");
        return;
    }
    const message = deckId 
        ? "変更内容をクラウドに更新保存しますか？" 
        : "デッキをクラウドに保存して、共有URLを発行しますか？";
    
    if (!confirm(message)) return;

    setIsSaving(true);

    // 保存用ペイロード作成
    const savePayload: DeckData = {
        name: deckName,
        builderName,
        cards: deck,
        sideboard,
        selectedSet,
        language,
        keyCardIds,
        colors,
        archetype,
        concepts,
        turnMoves,
        updatedAt: new Date().toISOString()
    };

    try {
        if (deckId && editKey) {
            // A. 更新モード
            const result = await updateDeck(deckId, editKey, savePayload);
            if (result.success) {
                alert("保存しました！");
                setIsShareModalOpen(true);
            }
        } else {
            // B. 新規作成モード
            const result = await createDeck(savePayload);
            if (result.success) {
                // ローカルストレージをクリアするかは運用次第ですが、
                // ここでは編集ページへの遷移を優先します
                router.push(result.editUrl!); 
            }
        }
    } catch (e) {
        console.error("Save failed:", e);
        alert("保存に失敗しました。時間を置いて試してください。");
    } finally {
        setIsSaving(false);
    }
  };


  // --- 検索ロジック (既存コード維持) ---
  const executeSearch = async (queryWithOptions: string) => {
    if (!queryWithOptions) return;
    setLoading(true);
    
    try {
      const targetSets = new Set(['fdn']); 
      if (selectedSet) targetSets.add(selectedSet);
      
      const setsQuery = Array.from(targetSets).map(s => `set:${s}`).join(" OR ");
      const baseQuery = `(${setsQuery}) unique:prints`;
      const langQuery = language === 'ja' ? `(lang:ja OR lang:en)` : `lang:en`;
      
      const primaryQuery = `${baseQuery} ${langQuery} ${queryWithOptions}`;
      
      const promises = [];

      const safeFetch = (url: string) => {
        return fetch(url)
          .then(async (res) => {
            if (res.status === 404) return [];
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

      promises.push(
        safeFetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(primaryQuery)}`)
      );

      const hasJapaneseInput = /[ぁ-んァ-ン一-龠]/.test(queryWithOptions);
      
      if (language === 'ja' && hasJapaneseInput) {
        let cleanQuery = queryWithOptions
          .replace(/\(s:[a-zA-Z0-9]+\s+OR\s+s:[a-zA-Z0-9]+\)/gi, "")
          .replace(/set:[a-zA-Z0-9]+/gi, "")
          .replace(/s:[a-zA-Z0-9]+/gi, "")
          .replace(/[()]/g, "")
          .trim();

        if (cleanQuery) {
          const nameQuery = `${cleanQuery} lang:ja unique:prints`;
          const oracleSearchPromise = safeFetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(nameQuery)}`)
            .then(async (jaCards: any[]) => {
              if (jaCards.length === 0) return [];
              const oracleIds = jaCards.map((c: any) => c.oracle_id).filter(Boolean);
              const uniqueOracleIds = Array.from(new Set(oracleIds)).slice(0, 20);
              if (uniqueOracleIds.length === 0) return [];

              const oracleQueryPart = uniqueOracleIds.map(id => `oracle_id:${id}`).join(" OR ");
              const targetSetQuery = `(${oracleQueryPart}) (${setsQuery}) unique:prints`;
              
              const targetCards = await safeFetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(targetSetQuery)}`);

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

      const results = await Promise.all(promises);
      const allCards = results.flat();
      
      const uniqueCardsMap = new Map();
      allCards.forEach((c: any) => {
        if (c && c.oracle_id) {
          const existing = uniqueCardsMap.get(c.oracle_id);
          const formattedNew = formatCardData(c);

          if (!existing) {
            uniqueCardsMap.set(c.oracle_id, formattedNew);
          } else {
            let replace = false;
            if (existing.lang !== 'ja' && formattedNew.lang === 'ja') {
              replace = true;
            }
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

  // --- デッキ操作ロジック ---
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

      // Phase 1: Basic Lands
      if (basicLandNames.length > 0) {
        const landConditions = basicLandNames.map(name => `name:"${name}"`).join(" OR ");
        const landQuery = `(${landConditions}) (set:${selectedSet} OR set:fdn) (lang:${language} OR lang:en) unique:prints`;
        try {
          const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(landQuery)}`);
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

      // Phase 2: Other Cards
      const foundNames = new Set<string>();
      for (let i = 0; i < otherNames.length; i += BATCH_SIZE) {
        const batchNames = otherNames.slice(i, i + BATCH_SIZE);
        const nameConditions = batchNames.map(name => `name:"${name}"`).join(" OR ");
        const setCondition = selectedSet === 'fdn' ? `set:fdn` : `(set:${selectedSet} OR set:fdn)`;
        const query = `(${nameConditions}) ${setCondition} (lang:${language} OR lang:en)`;
        try {
          const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query + " unique:prints")}`);
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

      // Phase 3: Fallback
      const missingNames = otherNames.filter(name => !foundNames.has(name));
      if (missingNames.length > 0) {
        for (let i = 0; i < missingNames.length; i += BATCH_SIZE) {
          const batchNames = missingNames.slice(i, i + BATCH_SIZE);
          const nameConditions = batchNames.map(name => `name:"${name}"`).join(" OR ");
          const query = `(${nameConditions}) (lang:${language} OR lang:en) unique:prints`;
          try {
            const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
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

      // Phase 4: Pseudo-Japanese Patch
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
                const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
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
    if(!confirm("デッキをリセットしますか？")) return;
    setDeck([]);
    setSideboard([]);
    setDeckName("Untitled Deck");
    setKeyCardIds([]); 
    // リセット時、もし編集モードならURLはそのままに中身だけ空にする
  };

  return (
    <main className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      
      {/* Header: 保存ボタンと編集モード表示を追加 */}
      <header className="p-3 bg-slate-950 border-b border-slate-800 flex gap-4 items-center shrink-0 justify-between">
        <div className="flex items-center gap-4">
          
          {/* ロゴとバッジをまとめるコンテナ */}
          <div className="flex items-center mr-2">
            <Link 
              href="/" 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {/* +1 ロゴアイコン */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
                +1
              </div>
              {/* タイトルテキスト */}
              <h1 className="text-lg font-bold text-blue-400">MtG PLUS1</h1>
            </Link>

            {/* Edit Mode バッジ (リンクの外側に配置) */}
            {deckId && (
              <span className="ml-3 text-[10px] uppercase tracking-wider text-slate-400 border border-slate-700 bg-slate-900 px-2 py-0.5 rounded select-none">
                Edit Mode
              </span>
            )}
          </div>
            <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)} className="p-1.5 rounded bg-slate-800 border border-slate-700 text-sm max-w-[200px]" disabled={setsLoading}>
              {displayExpansions.map((set) => <option key={set.code} value={set.code}>{language === "ja" ? set.name_ja : set.name_en}</option>)}
            </select>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="p-1.5 rounded bg-slate-800 border border-slate-700 text-sm font-bold w-40">
              {LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
            </select>
        </div>

        {/* 保存アクションエリア */}
        <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              title="使い方を見る"
            >
              <HelpCircle size={20} />
            </button>
            {/* 共有ボタン (保存済みの場合のみ表示) */}
            {deckId && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded font-bold transition-colors"
                title="共有リンクを表示"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">Links</span>
              </button>
            )}
            <button 
                onClick={handleCloudSave} 
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-1.5 rounded font-bold transition-all ${
                    isSaving 
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                }`}
            >
                {isSaving ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        Saving...
                    </span>
                ) : (
                    <>
                        {deckId ? <Save size={18} /> : <CloudUpload size={18} />}
                        {deckId ? "保存 (Update)" : "保存して共有"}
                    </>
                )}
            </button>
            <UserMenu />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          
          {/* 左パネル */}
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
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "info" ? "bg-slate-800 text-yellow-400 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
              >
                <Info size={14} /> Info
              </button>
            </div>

            {/* コンテンツ切り替え */}
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

              {/* 4. Info Panel */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "info" ? "z-10" : "hidden"}`}>
                <InfoPanel 
                  colors={colors} setColors={setColors}
                  builderName={builderName} setBuilderName={setBuilderName}
                  archetype={archetype} setArchetype={setArchetype}
                  concepts={concepts} setConcepts={setConcepts}
                  turnMoves={turnMoves} setTurnMoves={setTurnMoves}
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
              builderName={builderName}
              onChangeDeckName={setDeckName}
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

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {deckId && (
        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          deckId={deckId} 
          editKey={editKey} 
        />
      )}
      <Footer />
    </main>
  );
}