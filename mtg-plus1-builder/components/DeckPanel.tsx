import { useState, useMemo } from "react";
import { DeckCard, Card, TurnMove } from "@/types";
import { List as ListIcon, LayoutGrid, Check, RefreshCw, Download, Sparkles, ChevronDown, Upload, Image as ImageIcon, Loader2, MessageSquare, Trash2 } from "lucide-react";
import CardView from "./CardView";
import ImportModal from "./ImportModal";
import { generateDeckImageCanvas, DeckImageConfig } from "@/lib/deck-image-generator";

type Props = {
  deck: DeckCard[];
  sideboard: DeckCard[]; 
  deckName: string;
  builderName: string;
  onChangeDeckName: (name: string) => void;
  onRemove: (card: DeckCard, target: "main" | "side") => void; 
  onQuantityChange: (card: DeckCard, amount: number, target: "main" | "side") => void;
  onUnifyLanguage: () => void;
  onImportDeck: (main: DeckCard[], side: DeckCard[], deckName?: string) => void;
  isProcessing: boolean;
  selectedSet: string;
  language: string;
  additionalLegalSets?: string[];
  keyCardIds?: string[];
  onToggleKeyCard?: (id: string) => void;
  onResetDeck: () => void;
  bannedCardsMap?: Record<string, string[]>;

  // 詳細情報と表示設定
  archetype?: string;
  colors?: string[];
  concepts?: string;
  turnMoves?: TurnMove[];
  showArchetype?: boolean;
  showConcepts?: boolean;
  showTurnMoves?: boolean;

  readonly? : boolean; // 閲覧モードフラグ
};

// 定数定義
const BASIC_LAND_NAMES_EN = ["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"];
const SNOW_BASIC_LAND_NAMES_EN = ["Snow-Covered Plains", "Snow-Covered Island", "Snow-Covered Swamp", "Snow-Covered Mountain", "Snow-Covered Forest"];
const ALL_BASIC_LAND_NAMES = [...BASIC_LAND_NAMES_EN, ...SNOW_BASIC_LAND_NAMES_EN, "平地", "島", "沼", "山", "森", "荒地", "冠雪の平地", "冠雪の島", "冠雪の沼", "冠雪の山", "冠雪の森"];
const BASIC_LAND_TRANSLATION: Record<string, string> = { "Plains": "平地", "Island": "島", "Swamp": "沼", "Mountain": "山", "Forest": "森", "Wastes": "荒地", "Snow-Covered Plains": "冠雪の平地", "Snow-Covered Island": "冠雪の島", "Snow-Covered Swamp": "冠雪の沼", "Snow-Covered Mountain": "冠雪の山", "Snow-Covered Forest": "冠雪の森" };
const CATEGORY_PRIORITY: Record<string, number> = { "Creature": 1, "Planeswalker": 2, "Battle": 3, "Instant": 4, "Sorcery": 5, "Artifact": 6, "Enchantment": 7, "Land": 8, "Other": 9 };

export default function DeckPanel({ 
  deck = [], 
  sideboard = [],
  deckName, 
  builderName = "",
  onChangeDeckName, 
  onRemove, 
  onQuantityChange,
  onUnifyLanguage, 
  onImportDeck,
  isProcessing,
  selectedSet,
  language,
  additionalLegalSets = ["fdn"],
  keyCardIds = [], 
  onToggleKeyCard,
  onResetDeck,
  bannedCardsMap = {},
  archetype = "",
  colors = [], 
  concepts = "",
  turnMoves = [],
  showArchetype = true,
  showConcepts = true,
  showTurnMoves = true,
  readonly = false, // デフォルトはfalse
}: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState<"main" | "side">("main");
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const mainCount = deck.reduce((acc, c) => acc + c.quantity, 0);
  const sideCount = sideboard.reduce((acc, c) => acc + c.quantity, 0);

  // バリデーション
  const { validationErrors } = useMemo(() => {
    const errors: Record<string, string> = {};
    const allowedSets = new Set([selectedSet.toLowerCase(), ...(additionalLegalSets || []).map(s => s.toLowerCase())]);
    const allBannedNames = new Set<string>();
    Object.values(bannedCardsMap).forEach(list => list.forEach(name => allBannedNames.add(name)));
    const checkCard = (card: DeckCard) => {
      const cardSet = card.set.toLowerCase();
      if (!allowedSets.has(cardSet)) errors[card.id] = `Invalid Set: ${card.set.toUpperCase()}`;
      if (allBannedNames.has(card.name)) {
        const msg = `BANNED CARD (Global Ban)`;
        errors[card.id] = errors[card.id] ? `${errors[card.id]} / ${msg}` : msg;
      }
      const isBasic = ALL_BASIC_LAND_NAMES.includes(card.name) || ALL_BASIC_LAND_NAMES.includes(card.printed_name || "");
      if (!isBasic && card.quantity > 4) errors[card.id] = errors[card.id] ? `${errors[card.id]} / Max 4 copies` : "Max 4 copies";
    };
    (deck || []).forEach(checkCard);
    (sideboard || []).forEach(checkCard);
    return { validationErrors: errors };
  }, [deck, sideboard, selectedSet, additionalLegalSets, bannedCardsMap]);

  const processCards = (cards: DeckCard[]) => {
    const groups: Record<string, DeckCard[]> = {};
    cards.forEach(card => {
      let category = "Other";
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
          if (translatedName) cardToDisplay = { ...card, printed_name: translatedName };
        } else {
          const { printed_name, ...rest } = card;
          cardToDisplay = rest as DeckCard;
        }
      }
      groups[category].push(cardToDisplay);
    });
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const cmcA = a.cmc ?? 0;
        const cmcB = b.cmc ?? 0;
        if (cmcA !== cmcB) return cmcA - cmcB;
        const nameA = a.printed_name ?? a.name;
        const nameB = b.printed_name ?? b.name;
        return nameA.localeCompare(nameB);
      });
    });
    const sortedCategories = Object.keys(groups).sort((a, b) => (CATEGORY_PRIORITY[a] || 99) - (CATEGORY_PRIORITY[b] || 99));
    return sortedCategories.map(cat => ({ name: cat, cards: groups[cat], count: groups[cat].reduce((sum, c) => sum + c.quantity, 0) }));
  };
  const currentProcessedData = activeTab === "main" ? processCards(deck) : processCards(sideboard);

  const handleExport = (format: "arena" | "mo" | "jp") => {
    const formatCard = (c: DeckCard) => {
      switch (format) {
        case "arena": return `${c.quantity} ${c.name} (${c.set.toUpperCase()}) ${c.collector_number}`;
        case "mo": return `${c.quantity} ${c.name}`;
        case "jp": return `${c.quantity} ${c.printed_name ?? c.name}`;
        default: return "";
      }
    };
    const mainText = deck.map(formatCard).join("\n");
    const sideText = sideboard.map(formatCard).join("\n");
    const headerText = `About\nName (${selectedSet.toUpperCase()}) ${deckName}`;
    const fullText = `${headerText}\n\nDeck\n${mainText}\n\nSideboard\n${sideText}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true); setShowExportMenu(false); setTimeout(() => setCopied(false), 2000);
    });
  };

  const generateDeckImage = async () => {
    if (deck.length === 0) return;
    setIsGeneratingImage(true);

    try {
      const config: DeckImageConfig = {
        deck,
        sideboard,
        deckName,
        builderName,
        selectedSet,
        keyCardIds,
        colors: colors || [],
        archetype: archetype || "",
        concepts: concepts || "",
        turnMoves: turnMoves || [],
        showArchetype: showArchetype ?? true,
        showConcepts: showConcepts ?? true,
        showTurnMoves: showTurnMoves ?? true,
      };

      const dataUrl = await generateDeckImageCanvas(config);

      const link = document.createElement("a");
      link.download = `${deckName.replace(/\s+/g, "_")}_${selectedSet}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportMenu(false);

    } catch (error) {
      console.error("Image generation failed", error);
      alert("画像の生成に失敗しました。");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleReset = () => {
    if (confirm("現在のデッキ内容（カード、名前、コメントなど）をすべて消去しますか？\nこの操作は取り消せません。")) {
      onResetDeck();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col gap-3">
        
        {/* デッキ名 (Readonly対応) */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-500 select-none">
            ({selectedSet.toUpperCase()})
          </span>
          {readonly ? (
            <div className="flex-1 flex flex-col justify-center">
                <span className="text-lg font-bold text-white px-1 truncate" title={deckName}>
                    {deckName}
                </span>
                {builderName && (
                    <span className="text-xs text-slate-400 px-1 truncate">
                        by {builderName}
                    </span>
                )}
            </div>
          ) : (
            <input
                type="text"
                value={deckName}
                onChange={(e) => onChangeDeckName(e.target.value)}
                placeholder="Deck Name"
                className="flex-1 bg-transparent text-lg font-bold text-white placeholder-slate-600 border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none transition-colors px-1"
            />
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
            <button onClick={() => setActiveTab("main")} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === "main" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>Main ({mainCount})</button>
            <button onClick={() => setActiveTab("side")} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === "side" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}>Side ({sideCount})</button>
          </div>
          
          <div className="flex items-center gap-2">
            
            {/* 編集系ボタンは readonly 時は非表示 */}
            {!readonly && (
                <>
                    <button 
                    onClick={handleReset}
                    className="p-1.5 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 border border-slate-700 hover:border-red-800 rounded text-slate-400 transition-colors"
                    title="デッキ内容をリセット"
                    >
                    <Trash2 size={14} />
                    </button>

                    <button onClick={onUnifyLanguage} disabled={isProcessing} className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors" title="全カードの言語を統一">
                    <Sparkles size={14} className={isProcessing ? "animate-spin" : ""} />
                    </button>

                    <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors border border-slate-600" title="テキストからデッキをインポート"><Upload size={14} /><span>Import</span></button>
                </>
            )}
            
            {/* Exportは閲覧モードでも許可 */}
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">{copied ? <Check size={14} /> : <Download size={14} />}<span>Export</span><ChevronDown size={12} /></button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 overflow-hidden">
                  <div className="p-2 text-xs text-slate-400 font-bold border-b border-slate-700">Text Export</div>
                  <button onClick={() => handleExport("arena")} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors">MTG Arena <span className="text-xs text-slate-500">(Importable)</span></button>
                  <button onClick={() => handleExport("mo")} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors">Simple List <span className="text-xs text-slate-500">(Name only)</span></button>
                  <button onClick={() => handleExport("jp")} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors">日本語リスト <span className="text-xs text-slate-500">(Text)</span></button>
                  <div className="p-2 text-xs text-slate-400 font-bold border-b border-t border-slate-700">Image Export</div>
                  <button onClick={generateDeckImage} disabled={isGeneratingImage} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors flex items-center justify-between"><span>Save as Image (.png)</span>{isGeneratingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}</button>
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

      <div className="flex-1 overflow-y-auto px-2 pb-50">
        {currentProcessedData.length > 0 ? (
          currentProcessedData.map((group) => (
            <div key={group.name} className="mb-1">
              <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm py-0.5 px-2 border-b border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center"><span>{group.name}</span><span className="bg-slate-800 px-1.5 rounded text-slate-300">{group.count}</span></div>
              <CardView 
                cards={group.cards} 
                mode={viewMode} 
                // ReadOnly時はアクションを渡さない、またはCardView側で制御する
                // ここではCardViewにreadOnlyを渡す想定
                // @ts-ignore (CardViewの型定義が更新されるまで無視)
                readOnly={readonly}
                onAction={readonly ? () => {} : (c) => onRemove(c, activeTab)} 
                onQuantityChange={readonly ? undefined : (c, amount) => onQuantityChange(c, amount, activeTab)} 
                actionType="remove" 
                isDeckArea={true} 
                validationErrors={validationErrors} 
                keyCardIds={keyCardIds}
                onToggleKeyCard={readonly ? undefined : onToggleKeyCard}
                />
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">{activeTab === "main" ? "デッキにカードがありません" : "サイドボードにカードがありません"}</div>
        )}
      </div>
      {!readonly && (
          <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={(main, side, name) => { onImportDeck(main, side, name); if (name) { onChangeDeckName(name); } }} language={language} selectedSet={selectedSet} />
      )}
    </div>
  );
}