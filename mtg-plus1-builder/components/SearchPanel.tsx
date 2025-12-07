import { useState, useMemo, useEffect } from "react";
import { Card } from "@/types";
import { List as ListIcon, LayoutGrid, Filter, Search, X, Loader2 } from "lucide-react";
import CardView from "./CardView";

type Props = {
  searchResults: Card[];
  loading: boolean;
  onSearch: (query: string) => void;
  onAdd: (card: Card, target: "main" | "side") => void;
  language: string;
  expansionSetCode?: string;
  expansionSetName?: string;
};

// --- 定数・辞書定義 ---

// マナシンボル
const MANA_BUTTONS = [
  { value: "w", symbol: "W", glow: "shadow-yellow-500/50" },
  { value: "u", symbol: "U", glow: "shadow-blue-500/50" },
  { value: "b", symbol: "B", glow: "shadow-purple-900/50" },
  { value: "r", symbol: "R", glow: "shadow-red-500/50" },
  { value: "g", symbol: "G", glow: "shadow-green-500/50" },
  { value: "c", symbol: "C", glow: "shadow-slate-400/50" },
];

// カードタイプ (検索用ID)
const CARD_TYPES = [
  "Creature", "Instant", "Sorcery", "Enchantment", 
  "Artifact", "Planeswalker", "Land", "Battle"
];

// カードタイプの表示名辞書
const TYPE_LABELS: Record<string, { ja: string; en: string }> = {
  Creature: { en: "Creature", ja: "クリーチャー" },
  Instant: { en: "Instant", ja: "インスタント" },
  Sorcery: { en: "Sorcery", ja: "ソーサリー" },
  Enchantment: { en: "Enchantment", ja: "エンチャント" },
  Artifact: { en: "Artifact", ja: "アーティファクト" },
  Planeswalker: { en: "Planeswalker", ja: "PW" },
  Land: { en: "Land", ja: "土地" },
  Battle: { en: "Battle", ja: "バトル" },
};

// UIテキスト辞書
const UI_TEXT = {
  ja: {
    reset: "リセット",
    color: "色",
    type: "カードタイプ (単一選択)",
    subtype: "サブタイプ",
    subtypePlaceholderDefault: "タイプ未選択",
    subtypePlaceholderPrefix: "のサブタイプ...",
    manaValue: "マナ",
    manaValuePlaceholder: "例: 3",
    rarity: "レアリティ",
    results: "結果",
    searchPlaceholder: "カード名 (日本語で検索)",
    setLabel: "収録セット",
    setAll: "すべて",
    setFdn: "Foundations (FDN)",
    setExp: "Expansion",
  },
  en: {
    reset: "Reset",
    color: "Color",
    type: "Type (Single Select)",
    subtype: "Subtype",
    subtypePlaceholderDefault: "Select Type first",
    subtypePlaceholderPrefix: "subtype...",
    manaValue: "MV",
    manaValuePlaceholder: "e.g. 3",
    rarity: "Rarity",
    results: "Results",
    searchPlaceholder: "Card Name (English)",
    setLabel: "Set",
    setAll: "All",
    setFdn: "Foundations (FDN)",
    setExp: "Expansion",
  },
};

// レアリティ選択肢辞書
const RARITY_OPTIONS = [
  { value: "", label: { ja: "指定なし", en: "Any" } },
  { value: "common", label: { ja: "コモン", en: "Common" } },
  { value: "uncommon", label: { ja: "アンコモン", en: "Uncommon" } },
  { value: "rare", label: { ja: "レア", en: "Rare" } },
  { value: "mythic", label: { ja: "神話レア", en: "Mythic" } },
];

const CATALOG_MAP: Record<string, string> = {
  Creature: "creature-types",
  Artifact: "artifact-types",
  Enchantment: "enchantment-types",
  Land: "land-types",
  Planeswalker: "planeswalker-types",
  Battle: "battle-types",
  Instant: "spell-types",
  Sorcery: "spell-types",
};

export default function SearchPanel({ 
  searchResults, 
  loading, 
  onSearch, 
  onAdd, 
  language,
  expansionSetCode = "neo",
  expansionSetName = "Kamigawa: Neon Dynasty" // デフォルト値
}: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // 現在の言語設定に基づいたテキストセットを取得
  const currentLang = (language === "en" ? "en" : "ja") as "ja" | "en";
  const t = UI_TEXT[currentLang];

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>(""); 
  const [subtype, setSubtype] = useState("");
  const [manaValue, setManaValue] = useState("");
  const [rarity, setRarity] = useState("");
  const [setFilter, setSetFilter] = useState<"all" | "fdn" | "expansion">("all");

  const [targetBoard, setTargetBoard] = useState<"main" | "side">("main"); 

  const [subtypeCatalogs, setSubtypeCatalogs] = useState<Record<string, string[]>>({});
  const [loadingSubtypes, setLoadingSubtypes] = useState(false);

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleType = (type: string) => {
    setSelectedType((prev) => (prev === type ? "" : type));
    setSubtype("");
  };

  useEffect(() => {
    if (!selectedType || !CATALOG_MAP[selectedType]) return;
    const slug = CATALOG_MAP[selectedType];
    if (subtypeCatalogs[slug]) return;

    const fetchCatalog = async () => {
      setLoadingSubtypes(true);
      try {
        const res = await fetch(`https://api.scryfall.com/catalog/${slug}`);
        const data = await res.json();
        setSubtypeCatalogs(prev => ({ ...prev, [slug]: data.data || [] }));
      } catch (error) {
        console.error("Failed to fetch subtypes", error);
      } finally {
        setLoadingSubtypes(false);
      }
    };

    fetchCatalog();
  }, [selectedType, subtypeCatalogs]);

  const availableSubtypes = useMemo(() => {
    if (!selectedType) return [];
    const slug = CATALOG_MAP[selectedType];
    if (!slug || !subtypeCatalogs[slug]) return [];
    return subtypeCatalogs[slug];
  }, [selectedType, subtypeCatalogs]);

  const handleSearch = () => {
    let finalQuery = query;
    if (selectedColors.length > 0) finalQuery += ` c:${selectedColors.join("")}`;
    if (selectedType) finalQuery += ` t:${selectedType}`;
    if (subtype) finalQuery += ` t:${subtype}`;
    if (manaValue) finalQuery += ` mv=${manaValue}`;
    if (rarity) finalQuery += ` r:${rarity}`;

    // セットフィルターの適用
    if (setFilter === "fdn") {
      finalQuery += ` s:fdn`;
    } else if (setFilter === "expansion") {
      finalQuery += ` s:${expansionSetCode}`;
    } else {
      finalQuery += ` (s:fdn OR s:${expansionSetCode})`;
    }

    onSearch(finalQuery.trim());
  };

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedType("");
    setSubtype("");
    setManaValue("");
    setRarity("");
    setSetFilter("all");
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 p-2 rounded bg-slate-800 border border-slate-700 text-sm focus:border-blue-500 outline-none transition-colors"
          />
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded border border-slate-700 transition-colors ${showFilters ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 hover:bg-slate-700'}`}
            title="詳細検索フィルター"
          >
            <Filter size={18} className="text-white" />
          </button>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 px-4 py-2 rounded text-sm font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? "..." : <Search size={16} />}
          </button>
        </div>

        {showFilters && (
          <div className="p-3 bg-slate-800 rounded border border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-2 relative">
            
            <button 
              onClick={clearFilters}
              className="absolute top-2 right-2 text-xs text-slate-400 hover:text-white flex items-center gap-1 z-10"
            >
              <X size={12} /> {t.reset}
            </button>

            {/* --- 1行目: 色選択 & セット選択 (コンパクト化) --- */}
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              {/* 色選択 */}
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-bold">{t.color}</label>
                <div className="flex gap-2">
                  {MANA_BUTTONS.map((btn) => {
                    const isSelected = selectedColors.includes(btn.value);
                    return (
                      <button
                        key={btn.value}
                        onClick={() => toggleColor(btn.value)}
                        className={`
                          relative w-7 h-7 rounded-full transition-all duration-200 ease-in-out
                          ${isSelected 
                            ? `scale-110 opacity-100 grayscale-0 shadow-lg ${btn.glow}` 
                            : "opacity-40 grayscale hover:opacity-70 hover:grayscale-0"
                          }
                        `}
                      >
                        <img
                          src={`https://svgs.scryfall.io/card-symbols/${btn.symbol}.svg`}
                          alt={btn.symbol}
                          className="w-full h-full drop-shadow-sm"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* セット選択 (右側に配置してスペース有効活用) */}
              <div className="flex-1 min-w-[180px]">
                 <label className="text-xs text-slate-400 block mb-1 font-bold">{t.setLabel}</label>
                 <select 
                   value={setFilter} 
                   onChange={(e) => setSetFilter(e.target.value as "all" | "fdn" | "expansion")}
                   className="w-full p-1.5 h-8 rounded bg-slate-700 border border-slate-600 text-xs truncate"
                 >
                   <option value="all">{t.setAll}</option>
                   <option value="fdn">{t.setFdn}</option>
                   <option value="expansion">
                     {/* ★修正: セット名を表示 */}
                     {expansionSetName} ({expansionSetCode.toUpperCase()})
                   </option>
                 </select>
              </div>
            </div>

            {/* --- 2行目: カードタイプ (維持) --- */}
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-bold">{t.type}</label>
              <div className="flex flex-wrap gap-1">
                {CARD_TYPES.map((type) => {
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`
                        px-2 py-1 rounded text-xs border transition-colors
                        ${isSelected 
                          ? "bg-blue-600 border-blue-500 text-white font-bold" 
                          : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                        }
                      `}
                    >
                      {TYPE_LABELS[type][currentLang]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* --- 3行目: サブタイプ / マナ総量 / レアリティ (グリッドでまとめる) --- */}
            <div className="grid grid-cols-12 gap-3 items-end">
              {/* サブタイプ (幅広) */}
              <div className="col-span-6 sm:col-span-5 relative">
                 <div className="flex justify-between items-end mb-1">
                   <label className="text-xs text-slate-400 font-bold">{t.subtype}</label>
                   {loadingSubtypes && <Loader2 size={10} className="animate-spin text-blue-400"/>}
                 </div>
                 <div className="relative">
                   <input
                    type="text"
                    list="subtype-list"
                    value={subtype}
                    onChange={(e) => setSubtype(e.target.value)}
                    placeholder={selectedType ? t.subtypePlaceholderPrefix : t.subtypePlaceholderDefault}
                    className="w-full p-1.5 h-8 rounded bg-slate-700 border border-slate-600 text-xs focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    disabled={!selectedType}
                   />
                   <datalist id="subtype-list">
                     {availableSubtypes.map(s => <option key={s} value={s} />)}
                   </datalist>
                   {subtype && (
                     <button onClick={() => setSubtype("")} className="absolute right-2 top-2 text-slate-400 hover:text-white">
                       <X size={12} />
                     </button>
                   )}
                 </div>
              </div>

              {/* マナ総量 (幅狭) */}
              <div className="col-span-3 sm:col-span-3">
                <label className="text-xs text-slate-400 block mb-1 font-bold">{t.manaValue}</label>
                <input
                  type="number"
                  value={manaValue}
                  onChange={(e) => setManaValue(e.target.value)}
                  placeholder={t.manaValuePlaceholder}
                  className="w-full p-1.5 h-8 rounded bg-slate-700 border border-slate-600 text-xs"
                />
              </div>

              {/* レアリティ (中くらい) */}
              <div className="col-span-3 sm:col-span-4">
                 <label className="text-xs text-slate-400 block mb-1 font-bold">{t.rarity}</label>
                 <select 
                   value={rarity} 
                   onChange={(e) => setRarity(e.target.value)}
                   className="w-full p-1.5 h-8 rounded bg-slate-700 border border-slate-600 text-xs"
                 >
                   {RARITY_OPTIONS.map(opt => (
                     <option key={opt.value} value={opt.value}>{opt.label[currentLang]}</option>
                   ))}
                 </select>
              </div>
            </div>

          </div>
        )}

        <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
          <button 
            onClick={() => setTargetBoard("main")}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${targetBoard === "main" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Main
          </button>
          <button 
            onClick={() => setTargetBoard("side")}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${targetBoard === "side" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Side
          </button>
        </div>

        <div className="flex justify-between items-center mt-2">
           <span className="text-xs font-bold text-slate-400">{t.results}: {searchResults.length}</span>
           <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
            <button onClick={() => setViewMode("list")} className={`p-1 rounded ${viewMode === "list" ? "bg-slate-600 text-white" : "text-slate-400"}`}><ListIcon size={14} /></button>
            <button onClick={() => setViewMode("grid")} className={`p-1 rounded ${viewMode === "grid" ? "bg-slate-600 text-white" : "text-slate-400"}`}><LayoutGrid size={14} /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <CardView 
          cards={searchResults} 
          mode={viewMode} 
          onAction={(card) => onAdd(card, targetBoard)} 
          actionType="add" 
        />
      </div>
    </div>
  );
}