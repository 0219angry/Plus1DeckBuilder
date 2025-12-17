"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, DeckCard, EXPANSIONS, LANGUAGES, Expansion, TurnMove } from "@/types";
import { DeckData } from "@/types/deck"; 
import { createDeck, updateDeck } from "@/app/actions/deck"; 

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

// Icons
import { 
  Search as SearchIcon, 
  BarChart3, 
  Play, 
  Info, 
  Layers, 
  Menu,
  Settings,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import BuilderHeader from "./BuilderHeader";

type BuilderPageProps = {
  initialData?: DeckData;
  deckId?: string;
  editKey?: string;
};

export default function BuilderPage({ initialData, deckId, editKey }: BuilderPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // --- State定義 ---
  const [selectedSet, setSelectedSet] = useState(initialData?.selectedSet || "fdn");
  const [language, setLanguage] = useState(initialData?.language || "ja");
  
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  
  // デッキ情報
  const [deckName, setDeckName] = useState(initialData?.name || "Untitled Deck");
  const [builderName, setBuilderName] = useState(initialData?.builderName || "");
  const [visibility, setVisibility] = useState<'private' | 'limit' | 'public'>(initialData?.visibility || "limit");
  const [deck, setDeck] = useState<DeckCard[]>(initialData?.cards || []);
  const [sideboard, setSideboard] = useState<DeckCard[]>(initialData?.sideboard || []);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [keyCardIds, setKeyCardIds] = useState<string[]>(initialData?.keyCardIds || []);

  // Desktop Tab State
  const [activeTab, setActiveTab] = useState<"search" | "analysis" | "sample" | "info">("search");
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<"deck" | "search" | "analysis" | "menu">("deck");
  
  // Mobile Settings State
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

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

  // --- Effects ---
  useEffect(() => {
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
          if (parsed.visibility) setVisibility(parsed.visibility);
          if (parsed.concepts) setConcepts(parsed.concepts);
          
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
  }, [initialData]);

  useEffect(() => {
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
        visibility,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("mtg-plus1-deck", JSON.stringify(dataToSave));
    }
  }, [deck, sideboard, deckName, builderName, selectedSet, language, keyCardIds, colors, archetype, concepts, turnMoves, visibility, deckId]);

  useEffect(() => {
    if (user?.displayName && builderName === "") {
      setBuilderName(user.displayName);
    }
  }, [user, builderName]);

  useEffect(() => {
    if (searchParams.get('saved') === 'true') {
      setIsShareModalOpen(true);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('saved');
      const newPath = `${window.location.pathname}?${newParams.toString()}`;
      window.history.replaceState(null, '', newPath);
    }
  }, [searchParams]);

  // --- Save Logic ---
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
        visibility,
        updatedAt: new Date().toISOString(),
        userId: user?.uid || undefined,
    };

    try {
        if (deckId && editKey) {
            const result = await updateDeck(deckId, editKey, savePayload);
            if (result.success) {
                alert("保存しました！");
                localStorage.removeItem("mtg-plus1-deck");
                setIsShareModalOpen(true);
            }
        } else {
            const result = await createDeck(savePayload);
            if (result.success) {
                localStorage.removeItem("mtg-plus1-deck");
                router.push(`${result.editUrl}&saved=true`); 
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
      let allCards = results.flat();
      
// 3. 【重要】言語補完パッチ (Language Patch)
      if (language === 'ja') {
        // 現在の結果で「日本語版」が存在するカードのIDを記録
        const jaMap = new Set(allCards.filter((c: any) => c.lang === 'ja').map((c: any) => c.oracle_id));
        
        // 「英語版はあるが、日本語版がまだリストにない」カードのIDを抽出
        // ★修正点: ここで .slice(0, 50) を削除し、全量を取得します
        const missingJaOracleIds = Array.from(new Set(
          allCards
            .filter((c: any) => c.lang === 'en' && !jaMap.has(c.oracle_id))
            .map((c: any) => c.oracle_id)
        ));

        if (missingJaOracleIds.length > 0) {
          // ★修正点: URLの長さ制限（HTTP 414エラー）を防ぐため、バッチサイズごとに分割してリクエスト
          const BATCH_SIZE = 50; 

          for (let i = 0; i < missingJaOracleIds.length; i += BATCH_SIZE) {
            // 今回処理するIDの塊を作成
            const batchIds = missingJaOracleIds.slice(i, i + BATCH_SIZE);
            
            const idsQuery = batchIds.map(id => `oracle_id:${id}`).join(" OR ");
            const patchQuery = `(${idsQuery}) lang:ja unique:prints`;
            
            // パッチ検索実行 (awaitで順次実行してサーバー負荷を抑える)
            const patchResults = await safeFetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(patchQuery)}`);
            
            if (patchResults.length > 0) {
              allCards = [...allCards, ...patchResults];
            }
          }
        }
      }

      // 4. マージと優先順位付け (Deduplication with Priority)
      const uniqueCardsMap = new Map();
      
      allCards.forEach((rawCard: any) => {
        if (!rawCard || !rawCard.oracle_id) return;

        const formattedNew = formatCardData(rawCard);
        const existing = uniqueCardsMap.get(rawCard.oracle_id);

        if (!existing) {
          uniqueCardsMap.set(rawCard.oracle_id, formattedNew);
        } else {
          // === 優先順位の判定ロジック ===
          let shouldReplace = false;

          const isNewMatchLang = formattedNew.lang === language; // ページ設定と言語が一致するか
          const isOldMatchLang = existing.lang === language;

          const isTargetSet = (setCode: string) => targetSets.has(setCode);

          // ケースA: 英語FDN版(existing) が既にあって、後から 日本語過去版(formattedNew) が来た場合
          if (isNewMatchLang && !isOldMatchLang) {
            
            // ★重要判定: 「既存はFDNだが、新しい日本語版はFDNではない（過去のカード）」場合
            if (isTargetSet(existing.set) && !isTargetSet(formattedNew.set)) {
              
              // FDNのカード(existing)をベースにして、テキスト情報だけ日本語(formattedNew)で上書きする
              const hybridCard = {
                ...existing, // 1. ベースはFDN（画像、セット、番号、ID、リーガル情報はこれで完璧）

                // 2. テキスト情報だけ日本語版から注入
                name: formattedNew.name,
                printed_name: formattedNew.printed_name ?? formattedNew.name,
              };

              uniqueCardsMap.set(rawCard.oracle_id, hybridCard);
            } else {
              // Scryfallが更新されて、本当にFDNの日本語データが来た場合などは、素直に全部置き換える
              uniqueCardsMap.set(rawCard.oracle_id, formattedNew);
            }
            
          }
          // ルール2: 言語条件が同じなら、その他の優先度（コレクション番号など）
          else if (isNewMatchLang === isOldMatchLang) {
             // 例: 番号が若い方を優先（通常版優先など）
             const numA = parseInt(existing.collector_number, 10);
             const numB = parseInt(formattedNew.collector_number, 10);
             if (!isNaN(numB) && (isNaN(numA) || numB < numA)) {
               shouldReplace = true;
             }
          }

          if (shouldReplace) {
            uniqueCardsMap.set(rawCard.oracle_id, formattedNew);
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
    setArchetype("");
    setColors([]);
    setConcepts("");
    setTurnMoves([
        { id: "1", turn: "1", action: "" },
        { id: "2", turn: "2", action: "" },
        { id: "3", turn: "3", action: "" },
    ]);
  };

  return (
    <main className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      
      {/* Header Area: Wrapped in relative z-50 to stay on top */}
      <div className="relative z-50 shrink-0 shadow-md bg-slate-950 flex flex-col">
        
        {/* Main Header */}
        <div className="relative z-20">
            <BuilderHeader
                deckName={deckName}
                onChangeDeckName={setDeckName}
                selectedSet={selectedSet}
                onSetChange={setSelectedSet}
                language={language}
                onLanguageChange={setLanguage}
                visibility={visibility}
                onVisibilityChange={setVisibility}
                onSave={handleCloudSave}
                isSaving={isSaving}
                onOpenHelp={() => setIsHelpOpen(true)}
                deckId={deckId}
                onOpenShare={() => setIsShareModalOpen(true)}
            />
        </div>

        {/* Mobile: Settings Toggle Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-1 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
            <span className="truncate max-w-[200px]">
                Set: {expansionNameMap[selectedSet]} / {language === 'ja' ? 'JPN' : 'ENG'}
            </span>
            <button 
                onClick={() => setIsMobileSettingsOpen(!isMobileSettingsOpen)}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 py-1"
            >
                <Settings size={14} />
                <span>Deck Settings</span>
                {isMobileSettingsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
        </div>

        {/* Mobile: Settings Drawer */}
        {isMobileSettingsOpen && (
            <div className="md:hidden bg-slate-800 p-4 border-b border-slate-700 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl relative z-10">
                {/* Expansion Selection */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Expansion Set</label>
                    <select 
                        value={selectedSet} 
                        onChange={(e) => setSelectedSet(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {displayExpansions.map((ex) => (
                            <option key={ex.code} value={ex.code}>
                                {language === "ja" ? ex.name_ja : ex.name_en} ({ex.code.toUpperCase()})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Language & Visibility */}
                <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-bold text-slate-400">Language</label>
                        <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="ja">日本語</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    <div className="flex-1 space-y-1">
                         <label className="text-xs font-bold text-slate-400">Visibility</label>
                         <select
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="limit">限定公開 (URL)</option>
                            <option value="public">全体公開</option>
                            <option value="private">非公開</option>
                        </select>
                    </div>
                </div>

                {/* Close Button */}
                <div className="pt-2">
                    <button 
                        onClick={() => setIsMobileSettingsOpen(false)}
                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-200 transition-colors"
                    >
                        Close Settings
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* =========================================
          Desktop View (md以上) - 左右分割パネル
         ========================================= */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden relative z-0">
        <PanelGroup direction="horizontal">
          
          {/* Left Panel */}
          <Panel defaultSize={50} minSize={30} className="flex flex-col">
            <div className="flex border-b border-slate-800 bg-slate-900">
              <button onClick={() => setActiveTab("search")} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "search" ? "bg-slate-800 text-blue-400 border-b-2 border-blue-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}>
                <SearchIcon size={14} /> Search
              </button>
              <button onClick={() => setActiveTab("analysis")} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "analysis" ? "bg-slate-800 text-purple-400 border-b-2 border-purple-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}>
                <BarChart3 size={14} /> Stats
              </button>
              <button onClick={() => setActiveTab("sample")} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "sample" ? "bg-slate-800 text-green-400 border-b-2 border-green-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}>
                <Play size={14} /> Solitaire
              </button>
              <button onClick={() => setActiveTab("info")} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "info" ? "bg-slate-800 text-yellow-400 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}>
                <Info size={14} /> Info
              </button>
            </div>

            <div className="flex-1 overflow-hidden relative bg-slate-900/50">
              {activeTab === "search" && (
                <div className="absolute inset-0 flex flex-col">
                  <SearchPanel 
                    searchResults={searchResults} loading={loading} onSearch={executeSearch} onAdd={addToDeck}
                    language={language} expansionSetCode={selectedSet} expansionSetName={expansionNameMap[selectedSet]}
                  />
                </div>
              )}
              {activeTab === "analysis" && <div className="absolute inset-0 flex flex-col"><AnalysisPanel deck={deck} /></div>}
              {activeTab === "sample" && <div className="absolute inset-0 flex flex-col"><SampleHandPanel deck={deck} /></div>}
              {activeTab === "info" && (
                <div className="absolute inset-0 flex flex-col">
                  <InfoPanel 
                    colors={colors} setColors={setColors} builderName={builderName} setBuilderName={setBuilderName}
                    archetype={archetype} setArchetype={setArchetype} concepts={concepts} setConcepts={setConcepts}
                    turnMoves={turnMoves} setTurnMoves={setTurnMoves} showArchetype={showArchetype} setShowArchetype={setShowArchetype}
                    showConcepts={showConcepts} setShowConcepts={setShowConcepts} showTurnMoves={showTurnMoves} setShowTurnMoves={setShowTurnMoves}
                  />
                </div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-slate-950 hover:bg-blue-600/50 transition-colors flex items-center justify-center">
            <div className="w-0.5 h-8 bg-slate-700 rounded" />
          </PanelResizeHandle>

          {/* Right Panel (Deck List) */}
          <Panel defaultSize={50} minSize={30}>
            <DeckPanel 
              deck={deck} sideboard={sideboard} deckName={deckName} builderName={builderName}
              onChangeDeckName={setDeckName} onRemove={removeFromDeck} onUnifyLanguage={unifyDeckLanguage}
              onImportDeck={handleImportDeck} isProcessing={processing} selectedSet={selectedSet}
              onQuantityChange={handleQuantityChange} language={language} keyCardIds={keyCardIds}
              onToggleKeyCard={handleToggleKeyCard} onResetDeck={handleResetDeck} bannedCardsMap={simpleBannedMap}
              archetype={archetype} colors={colors} concepts={concepts} turnMoves={turnMoves}
              showArchetype={showArchetype} showConcepts={showConcepts} showTurnMoves={showTurnMoves}
            />
          </Panel>
        </PanelGroup>
        <Footer />
      </div>

      {/* =========================================
          Mobile View (md未満) - タブ切り替え + ボトムナビ
         ========================================= */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden relative z-0">
        <div className="flex-1 overflow-hidden relative">
          
          {/* Deck View */}
          <div className={`absolute inset-0 flex flex-col bg-slate-900 transition-transform duration-300 ${mobileTab === 'deck' ? 'translate-x-0' : '-translate-x-full hidden'}`}>
            <DeckPanel 
              deck={deck} sideboard={sideboard} deckName={deckName} builderName={builderName}
              onChangeDeckName={setDeckName} onRemove={removeFromDeck} onUnifyLanguage={unifyDeckLanguage}
              onImportDeck={handleImportDeck} isProcessing={processing} selectedSet={selectedSet}
              onQuantityChange={handleQuantityChange} language={language} keyCardIds={keyCardIds}
              onToggleKeyCard={handleToggleKeyCard} onResetDeck={handleResetDeck} bannedCardsMap={simpleBannedMap}
              archetype={archetype} colors={colors} concepts={concepts} turnMoves={turnMoves}
              showArchetype={showArchetype} showConcepts={showConcepts} showTurnMoves={showTurnMoves}
            />
          </div>

          {/* Search View */}
          <div className={`absolute inset-0 flex flex-col bg-slate-900 ${mobileTab === 'search' ? 'z-10' : 'hidden'}`}>
             <SearchPanel 
                searchResults={searchResults} loading={loading} onSearch={executeSearch} onAdd={addToDeck}
                language={language} expansionSetCode={selectedSet} expansionSetName={expansionNameMap[selectedSet]}
              />
          </div>

          {/* Analysis View */}
          <div className={`absolute inset-0 flex flex-col bg-slate-900 ${mobileTab === 'analysis' ? 'z-10' : 'hidden'}`}>
             <AnalysisPanel deck={deck} />
          </div>

          {/* Menu / Info View */}
          <div className={`absolute inset-0 flex flex-col bg-slate-900 overflow-y-auto ${mobileTab === 'menu' ? 'z-10' : 'hidden'}`}>
             <div className="p-2 space-y-4 pb-20">
                <div className="bg-slate-800 p-2 rounded">
                  <h3 className="text-sm font-bold text-slate-400 mb-2 px-2">Solitaire</h3>
                  <div className="h-64 relative border border-slate-700 rounded overflow-hidden">
                     <SampleHandPanel deck={deck} />
                  </div>
                </div>
                
                <div className="bg-slate-800 p-2 rounded">
                  <h3 className="text-sm font-bold text-slate-400 mb-2 px-2">Deck Info</h3>
                  <div className="relative">
                    <InfoPanel 
                      colors={colors} setColors={setColors} builderName={builderName} setBuilderName={setBuilderName}
                      archetype={archetype} setArchetype={setArchetype} concepts={concepts} setConcepts={setConcepts}
                      turnMoves={turnMoves} setTurnMoves={setTurnMoves} showArchetype={showArchetype} setShowArchetype={setShowArchetype}
                      showConcepts={showConcepts} setShowConcepts={setShowConcepts} showTurnMoves={showTurnMoves} setShowTurnMoves={setShowTurnMoves}
                    />
                  </div>
                </div>
             </div>
             {/* Mobile用: メニューの一番下に追加 */}
              <div className="pt-4 pb-8">
                <Footer />
              </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="h-14 bg-slate-950 border-t border-slate-800 flex items-center justify-around z-20 shrink-0">
          <button 
            onClick={() => setMobileTab("deck")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mobileTab === 'deck' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <Layers size={20} />
            <span className="text-[10px]">Deck</span>
          </button>
          
          <button 
            onClick={() => setMobileTab("search")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mobileTab === 'search' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <SearchIcon size={20} />
            <span className="text-[10px]">Search</span>
          </button>

          <button 
            onClick={() => setMobileTab("analysis")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mobileTab === 'analysis' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <BarChart3 size={20} />
            <span className="text-[10px]">Stats</span>
          </button>

          <button 
            onClick={() => setMobileTab("menu")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mobileTab === 'menu' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <Menu size={20} />
            <span className="text-[10px]">Menu</span>
          </button>
        </div>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {deckId && (
        <ShareModal 
          isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} 
          deckId={deckId} editKey={editKey} 
        />
      )}
    </main>
  );
}