import { useState, useMemo } from "react";
import { DeckCard } from "@/types";
import { List as ListIcon, LayoutGrid, Check, RefreshCw, Download, ChevronDown, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import CardView from "./CardView";
import ImportModal from "./ImportModal";

type Props = {
  deck: DeckCard[];
  sideboard: DeckCard[]; 
  deckName: string;
  onChangeDeckName: (name: string) => void;
  onRemove: (card: DeckCard, target: "main" | "side") => void; 
  onQuantityChange: (card: DeckCard, amount: number, target: "main" | "side") => void;
  onUnifyLanguage: () => void;
  onImportDeck: (main: DeckCard[], side: DeckCard[], deckName?: string) => void;
  isProcessing: boolean;
  selectedSet: string;
  language: string;
  // DB等から取得した「許可する追加エキスパンション」のリスト（省略時は "fdn" のみ）
  additionalLegalSets?: string[]; 
};

// 基本土地の英語名リスト
const BASIC_LAND_NAMES_EN = ["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"];

// 基本土地の日英対応マップ
const BASIC_LAND_TRANSLATION: Record<string, string> = {
  "Plains": "平地",
  "Island": "島",
  "Swamp": "沼",
  "Mountain": "山",
  "Forest": "森",
  "Wastes": "荒地"
};

// 日本語名も含めた基本土地リスト（バリデーション用）
const ALL_BASIC_LAND_NAMES = [
  ...BASIC_LAND_NAMES_EN,
  "平地", "島", "沼", "山", "森", "荒地"
];

// カテゴリの表示順序定義
const CATEGORY_PRIORITY: Record<string, number> = {
  "Creature": 1,
  "Planeswalker": 2,
  "Battle": 3,
  "Instant": 4,
  "Sorcery": 5,
  "Artifact": 6,
  "Enchantment": 7,
  "Land": 8,
  "Other": 9,
};

// 待機用の関数
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function DeckPanel({ 
  deck = [], 
  sideboard = [],
  deckName, 
  onChangeDeckName, 
  onRemove, 
  onQuantityChange,
  onUnifyLanguage, 
  onImportDeck,
  isProcessing,
  selectedSet,
  language,
  additionalLegalSets = ["fdn"]
}: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState<"main" | "side">("main");
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false); // 画像生成中の状態

  const mainCount = deck.reduce((acc, c) => acc + c.quantity, 0);
  const sideCount = sideboard.reduce((acc, c) => acc + c.quantity, 0);

  // --- バリデーションロジック ---
  const { validationErrors } = useMemo(() => {
    const errors: Record<string, string> = {};

    // 許可セットの正規化（小文字化）
    const allowedSets = new Set([
      selectedSet.toLowerCase(),
      ...additionalLegalSets.map(s => s.toLowerCase())
    ]);

    const checkCard = (card: DeckCard) => {
      // セット適合性チェック
      const cardSet = card.set.toLowerCase();
      if (!allowedSets.has(cardSet)) {
        const allowedDisplay = Array.from(allowedSets).map(s => s.toUpperCase()).slice(0, 3).join(", ") + (allowedSets.size > 3 ? "..." : "");
        errors[card.id] = `Invalid Set: ${card.set.toUpperCase()} (Allowed: ${allowedDisplay})`;
      }

      // 4枚制限 (基本土地は除く)
      const isBasic = ALL_BASIC_LAND_NAMES.includes(card.name) || ALL_BASIC_LAND_NAMES.includes(card.printed_name || "");
      
      if (!isBasic && card.quantity > 4) {
        const msg = "Max 4 copies allowed.";
        errors[card.id] = errors[card.id] ? `${errors[card.id]} / ${msg}` : msg;
      }
    };

    (deck || []).forEach(checkCard);
    (sideboard || []).forEach(checkCard);

    return { validationErrors: errors };
  }, [deck, sideboard, selectedSet, additionalLegalSets]);

  // --- カード分類・ソートロジック（表示用） ---
  const processCards = (cards: DeckCard[]) => {
    const groups: Record<string, DeckCard[]> = {};

    cards.forEach(card => {
      let category = "Other";
      // card_facesがある場合は表面（0番目）のtype_lineを使用
      const t = card.card_faces?.[0]?.type_line ?? card.type_line;
      
      if (t.includes("Creature")) category = "Creature";
      else if (t.includes("Planeswalker")) category = "Planeswalker";
      else if (t.includes("Battle")) category = "Battle";
      else if (t.includes("Instant")) category = "Instant";
      else if (t.includes("Sorcery")) category = "Sorcery";
      else if (t.includes("Artifact")) category = "Artifact";
      else if (t.includes("Enchantment")) category = "Enchantment";
      else if (t.includes("Land")) category = "Land";

      if (!groups[category]) groups[category] = [];

      let cardToDisplay = card;
      if (BASIC_LAND_NAMES_EN.includes(card.name)) {
        if (language === "ja") {
          const translatedName = BASIC_LAND_TRANSLATION[card.name];
          if (translatedName) {
            cardToDisplay = { ...card, printed_name: translatedName };
          }
        } else {
          const { printed_name, ...rest } = card;
          cardToDisplay = rest as DeckCard;
        }
      }

      groups[category].push(cardToDisplay);
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        // cmcがundefinedの場合は0として扱う
        const cmcA = a.cmc ?? 0;
        const cmcB = b.cmc ?? 0;
        
        if (cmcA !== cmcB) return cmcA - cmcB;
        
        const nameA = a.printed_name ?? a.name;
        const nameB = b.printed_name ?? b.name;
        return nameA.localeCompare(nameB);
      });
    });

    const sortedCategories = Object.keys(groups).sort((a, b) => {
      return (CATEGORY_PRIORITY[a] || 99) - (CATEGORY_PRIORITY[b] || 99);
    });

    return sortedCategories.map(cat => ({
      name: cat,
      cards: groups[cat],
      count: groups[cat].reduce((sum, c) => sum + c.quantity, 0)
    }));
  };

  const processedMain = useMemo(() => processCards(deck), [deck, language]);
  const processedSide = useMemo(() => processCards(sideboard), [sideboard, language]);
  const currentProcessedData = activeTab === "main" ? processedMain : processedSide;

  // --- エクスポート（テキスト）処理 ---
  const handleExport = (format: "arena" | "mo" | "jp") => {
    const formatCard = (c: DeckCard) => {
      switch (format) {
        case "arena":
          return `${c.quantity} ${c.name} (${c.set.toUpperCase()}) ${c.collector_number}`;
        case "mo":
          return `${c.quantity} ${c.name}`;
        case "jp":
          return `${c.quantity} ${c.printed_name ?? c.name}`;
        default: return "";
      }
    };

    const mainText = deck.map(formatCard).join("\n");
    const sideText = sideboard.map(formatCard).join("\n");
    
    const headerText = `About\nName (${selectedSet.toUpperCase()}) ${deckName}`;

    let contentText = `Deck\n${mainText}`;
    if (sideboard.length > 0) {
        contentText += `\n\nSideboard\n${sideText}`;
    }
    
    const fullText = `${headerText}\n\n${contentText}`;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setShowExportMenu(false);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // --- 画像生成処理 (Canvas) ---
  const generateDeckImage = async () => {
    if (deck.length === 0) return;
    setIsGeneratingImage(true);

    try {
      // --- ヘルパー: 列への分配 ---
      const distributeToColumns = (cardList: DeckCard[]) => {
        const cols: DeckCard[][] = [[], [], [], [], [], [], []];
        cardList.forEach(card => {
          // 画像生成時も表面のタイプを優先
          const typeLine = card.card_faces?.[0]?.type_line ?? card.type_line;
          
          if (typeLine.includes("Land")) {
            cols[6].push(card);
            return;
          }
          // cmcがundefinedの場合は0として扱う
          const cmc = Math.floor(card.cmc ?? 0);
          
          let targetIndex = 0;
          if (cmc <= 1) targetIndex = 0;
          else if (cmc >= 6) targetIndex = 5;
          else targetIndex = cmc - 1; // 2->1, 3->2...
          cols[targetIndex].push(card);
        });
        return cols;
      };

      // --- ヘルパー: 列内ソート ---
      const sortColumns = (cols: DeckCard[][]) => {
        cols.forEach(col => {
          col.sort((a, b) => {
            const typeScore = (c: DeckCard) => {
               // ソート時も表面のタイプを優先
               const t = c.card_faces?.[0]?.type_line ?? c.type_line;
               
               if (t.includes("Creature")) return 1;
               if (t.includes("Planeswalker")) return 2;
               if (t.includes("Instant")) return 3;
               if (t.includes("Sorcery")) return 4;
               if (t.includes("Enchantment")) return 5;
               if (t.includes("Artifact")) return 6;
               return 7;
            };
            const tsA = typeScore(a);
            const tsB = typeScore(b);
            if (tsA !== tsB) return tsA - tsB;
            return a.name.localeCompare(b.name);
          });
        });
      };

      // 1. データ準備
      const mainColumns = distributeToColumns(deck);
      sortColumns(mainColumns);

      const sideColumns = distributeToColumns(sideboard);
      sortColumns(sideColumns);

      // 2. 描画設定
      const CARD_WIDTH = 180;
      const CARD_HEIGHT = 250;
      const COL_GAP = 20;
      const HEADER_HEIGHT = 80;
      const COL_HEADER_HEIGHT = 80;
      // 【修正】間隔を広げてバッジが隠れないようにする (35 -> 60)
      const STACK_OFFSET = 60; 
      const SIDEBOARD_OFFSET = 60; 
      
      const getColumnHeight = (cards: DeckCard[]) => {
         if (cards.length === 0) return 0;
         return CARD_HEIGHT + (Math.max(0, cards.length - 1) * STACK_OFFSET);
      };

      // メインデッキの高さ計算
      const mainColHeights = mainColumns.map(getColumnHeight);
      const maxMainHeight = Math.max(...mainColHeights, 100);

      // サイドボードの高さ計算 (カードがある場合のみ)
      const hasSideboard = sideboard.length > 0;
      const sideColHeights = sideColumns.map(getColumnHeight);
      const maxSideHeight = hasSideboard ? Math.max(...sideColHeights, 100) : 0;

      const canvasWidth = (CARD_WIDTH * 7) + (COL_GAP * 8);
      
      // 全体の高さ
      let canvasHeight = HEADER_HEIGHT + COL_HEADER_HEIGHT + maxMainHeight + 40;
      if (hasSideboard) {
        // サイドボード分の高さ: セクションタイトル + 列ヘッダー + カード高さ
        canvasHeight += SIDEBOARD_OFFSET + COL_HEADER_HEIGHT + maxSideHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed");

      // 背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(1, "#1e293b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // ヘッダー情報
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(`(${selectedSet.toUpperCase()}) ${deckName}`, 40, 50);
      
      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px sans-serif";
      ctx.fillText(`${mainCount} Main / ${sideCount} Side`, 40, 75);

      // 画像ロード関数
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load ${url}`));
          const separator = url.includes("?") ? "&" : "?";
          img.src = `${url}${separator}t=${new Date().getTime()}`;
        });
      };

      // アイコン描画
      const drawIcon = (ctx: CanvasRenderingContext2D, type: "creature" | "spell", x: number, y: number, size: number, color: string) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (type === "creature") {
          ctx.beginPath();
          ctx.moveTo(size * 0.2, size * 0.8); ctx.lineTo(size * 0.8, size * 0.2);
          ctx.moveTo(size * 0.3, size * 0.7); ctx.lineTo(size * 0.45, size * 0.85);
          ctx.moveTo(size * 0.15, size * 0.55); ctx.lineTo(size * 0.3, size * 0.7);
          ctx.moveTo(size * 0.15, size * 0.85); ctx.lineTo(size * 0.3, size * 0.7);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(size * 0.55, size * 0.05); ctx.lineTo(size * 0.25, size * 0.55);
          ctx.lineTo(size * 0.55, size * 0.55); ctx.lineTo(size * 0.45, size * 0.95);
          ctx.lineTo(size * 0.75, size * 0.45); ctx.lineTo(size * 0.45, size * 0.45);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      };

      // --- 共通描画関数: 指定されたY座標から列を描画 ---
      const drawCardRows = async (columns: DeckCard[][], startY: number, showHeaderLabels: boolean) => {
        const columnLabels = ["1", "2", "3", "4", "5", "6+", "Land"];
        
        for (let colIdx = 0; colIdx < 7; colIdx++) {
          const colCards = columns[colIdx];
          const x = COL_GAP + (colIdx * (CARD_WIDTH + COL_GAP));
          
          // 列ヘッダー情報の描画
          const centerX = x + CARD_WIDTH / 2;
          ctx.textAlign = "center";

          // ラベル (1, 2, ... Land)
          if (showHeaderLabels) {
            ctx.fillStyle = "#f1f5f9";
            ctx.font = "bold 28px sans-serif";
            ctx.fillText(columnLabels[colIdx], centerX, startY + 30);
          }
          
          const total = colCards.reduce((a, c) => a + c.quantity, 0);
          
          if (total > 0) {
              ctx.fillStyle = "#cbd5e1";
              ctx.font = "bold 16px sans-serif";
              ctx.fillText(`${total} Cards`, centerX, startY + 52);

              // 内訳表示 (Land列以外)
              if (colIdx < 6) {
                   const creatures = colCards.filter(c => {
                     const t = c.card_faces?.[0]?.type_line ?? c.type_line;
                     return t.includes("Creature");
                   }).reduce((a, c) => a + c.quantity, 0);
                   const nonCreatures = total - creatures;
                   
                   ctx.fillStyle = "#94a3b8";
                   const iconSize = 14;
                   const textY = startY + 74;
                   
                   const creTextWidth = ctx.measureText(`${creatures}`).width;
                   const spellTextWidth = ctx.measureText(`${nonCreatures}`).width;
                   const spacer = 20;
                   const totalContentWidth = creTextWidth + iconSize + spacer + spellTextWidth + iconSize;
                   
                   let currentX = centerX - (totalContentWidth / 2);

                   ctx.textAlign = "left";
                   ctx.fillText(`${creatures}`, currentX, textY);
                   currentX += creTextWidth + 4;
                   drawIcon(ctx, "creature", currentX, textY - 12, iconSize, "#94a3b8");
                   currentX += iconSize + 10; 

                   ctx.fillText("|", currentX, textY);
                   currentX += 10; 

                   ctx.fillText(`${nonCreatures}`, currentX, textY);
                   currentX += spellTextWidth + 4;
                   drawIcon(ctx, "spell", currentX, textY - 12, iconSize, "#94a3b8");
              }
          } else {
               ctx.fillStyle = "#475569";
               ctx.textAlign = "center";
               ctx.font = "14px sans-serif";
               ctx.fillText("-", centerX, startY + 52);
          }
          ctx.textAlign = "left";

          // カード描画ループ
          let cardY = startY + COL_HEADER_HEIGHT;
          
          for (const card of colCards) {
            const imageUrl = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
            if (imageUrl) {
              try {
                await sleep(100); // Wait for rate limit
                const img = await loadImage(imageUrl);
                
                // 影
                ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                
                ctx.drawImage(img, x, cardY, CARD_WIDTH, CARD_HEIGHT);
                ctx.shadowColor = "transparent";
                
                // 【修正】枚数バッジ: 1枚でも表示し、マナコストと被らない位置に調整
                // 25px(マナコストエリア) + 20px(余裕) = 45px
                const badgeSize = 18;
                const badgeX = x + CARD_WIDTH - 25;
                const badgeY = cardY + 45; // マナコストの下

                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0,0,0,0.85)";
                ctx.fill();
                ctx.strokeStyle = "#94a3b8";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 18px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`x${card.quantity}`, badgeX, badgeY + 1);
                ctx.textAlign = "left";
                ctx.textBaseline = "alphabetic";
                
                cardY += STACK_OFFSET;
              } catch (e) {
                console.error(e);
                // Placeholder
                ctx.fillStyle = "#334155";
                ctx.fillRect(x, cardY, CARD_WIDTH, CARD_HEIGHT);
                ctx.fillStyle = "#fff";
                ctx.font = "12px sans-serif";
                ctx.fillText(card.name.substring(0, 15), x + 5, cardY + 20);
                cardY += STACK_OFFSET;
              }
            }
          }
        }
      };

      // 3. メインデッキ描画実行
      await drawCardRows(mainColumns, HEADER_HEIGHT, true);

      // 4. サイドボード描画実行
      if (hasSideboard) {
        const sideStartY = HEADER_HEIGHT + COL_HEADER_HEIGHT + maxMainHeight + SIDEBOARD_OFFSET;
        
        // Sideboardタイトル
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("Sideboard", 40, sideStartY - 15);
        
        // 区切り線
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, sideStartY - 10);
        ctx.lineTo(canvasWidth - 40, sideStartY - 10);
        ctx.stroke();

        await drawCardRows(sideColumns, sideStartY, true);
      }

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${deckName.replace(/\s+/g, "_")}_${selectedSet}.png`;
      link.href = dataUrl;
      link.click();

      setShowExportMenu(false);

    } catch (error) {
      console.error("Image generation failed", error);
      alert("画像の生成に失敗しました。\n(CORS制限または通信エラーの可能性があります)");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col gap-3">
        
        {/* デッキ名 */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-500 select-none">
            ({selectedSet.toUpperCase()})
          </span>
          <input
            type="text"
            value={deckName}
            onChange={(e) => onChangeDeckName(e.target.value)}
            placeholder="Deck Name"
            className="w-full bg-transparent text-lg font-bold text-white placeholder-slate-600 border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none transition-colors px-1"
          />
        </div>

        <div className="flex justify-between items-center">
          {/* メイン/サイド切り替えタブ */}
          <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
            <button
              onClick={() => setActiveTab("main")}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === "main" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Main ({mainCount})
            </button>
            <button
              onClick={() => setActiveTab("side")}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === "side" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Side ({sideCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
               onClick={onUnifyLanguage}
               disabled={isProcessing}
               className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors"
               title="全カードの言語を統一"
             >
               <RefreshCw size={14} className={isProcessing ? "animate-spin" : ""} />
             </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors border border-slate-600"
              title="テキストからデッキをインポート"
            >
              <Upload size={14} />
              <span>Import</span>
            </button>

            {/* エクスポートメニュー */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
              >
                {copied ? <Check size={14} /> : <Download size={14} />}
                <span>Export</span>
                <ChevronDown size={12} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 overflow-hidden">
                  <div className="p-2 text-xs text-slate-400 font-bold border-b border-slate-700">Text Export</div>
                  <button onClick={() => handleExport("arena")} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors">
                    MTG Arena <span className="text-xs text-slate-500">(Importable)</span>
                  </button>
                  <button onClick={() => handleExport("mo")} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors">
                    Simple List <span className="text-xs text-slate-500">(Name only)</span>
                  </button>
                  <button onClick={() => handleExport("jp")} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors">
                    日本語リスト <span className="text-xs text-slate-500">(Text)</span>
                  </button>
                  
                  <div className="p-2 text-xs text-slate-400 font-bold border-b border-t border-slate-700">Image Export</div>
                  <button 
                    onClick={generateDeckImage} 
                    disabled={isGeneratingImage}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span>Save as Image (.png)</span>
                    {isGeneratingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  </button>
                </div>
              )}
              {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />}
            </div>

            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            
            <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
              <button onClick={() => setViewMode("list")} className={`p-1 rounded ${viewMode === "list" ? "bg-slate-600 text-white" : "text-slate-400"}`}><ListIcon size={14} /></button>
              <button onClick={() => setViewMode("grid")} className={`p-1 rounded ${viewMode === "grid" ? "bg-slate-600 text-white" : "text-slate-400"}`}><LayoutGrid size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-10">
        {/* カテゴリごとに CardView を展開 */}
        {currentProcessedData.length > 0 ? (
          currentProcessedData.map((group) => (
            <div key={group.name} className="mb-1">
              <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm py-0.5 px-2 border-b border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                <span>{group.name}</span>
                <span className="bg-slate-800 px-1.5 rounded text-slate-300">{group.count}</span>
              </div>
              <CardView 
                cards={group.cards} 
                mode={viewMode} 
                onAction={(c) => onRemove(c, activeTab)} 
                onQuantityChange={(c, amount) => onQuantityChange(c, amount, activeTab)} 
                actionType="remove" 
                isDeckArea={true} 
                validationErrors={validationErrors}
              />
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">
            {activeTab === "main" ? "デッキにカードがありません" : "サイドボードにカードがありません"}
          </div>
        )}
      </div>

      <ImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        onImport={(main, side, name) => {
          onImportDeck(main, side, name);
          if (name) {
            onChangeDeckName(name);
          }
        }}
      />
    </div>
  );
}