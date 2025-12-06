import { useState, useMemo } from "react";
import { DeckCard, Card } from "@/types";
import { List as ListIcon, LayoutGrid, Check, RefreshCw, Download, ChevronDown, Upload, Image as ImageIcon, Loader2, MessageSquare, Trash2 } from "lucide-react";
import CardView from "./CardView";
import ImportModal from "./ImportModal";

type Props = {
  deck: DeckCard[];
  sideboard: DeckCard[]; 
  deckName: string;
  onChangeDeckName: (name: string) => void;
  deckComment: string; 
  onChangeDeckComment: (comment: string) => void; 
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
};

const BASIC_LAND_NAMES_EN = ["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"];
const ALL_BASIC_LAND_NAMES = [...BASIC_LAND_NAMES_EN, "平地", "島", "沼", "山", "森", "荒地"];
const BASIC_LAND_TRANSLATION: Record<string, string> = {
  "Plains": "平地", "Island": "島", "Swamp": "沼", "Mountain": "山", "Forest": "森", "Wastes": "荒地"
};

const CATEGORY_PRIORITY: Record<string, number> = {
  "Creature": 1, "Planeswalker": 2, "Battle": 3, "Instant": 4, 
  "Sorcery": 5, "Artifact": 6, "Enchantment": 7, "Land": 8, "Other": 9,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function DeckPanel({ 
  deck = [], 
  sideboard = [],
  deckName, 
  onChangeDeckName, 
  deckComment, 
  onChangeDeckComment, 
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
}: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState<"main" | "side">("main");
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false); 

  const mainCount = deck.reduce((acc, c) => acc + c.quantity, 0);
  const sideCount = sideboard.reduce((acc, c) => acc + c.quantity, 0);

  // --- バリデーション ---
  const { validationErrors } = useMemo(() => {
    const errors: Record<string, string> = {};
    const allowedSets = new Set([selectedSet.toLowerCase(), ...(additionalLegalSets || []).map(s => s.toLowerCase())]);
    const checkCard = (card: DeckCard) => {
      const cardSet = card.set.toLowerCase();
      if (!allowedSets.has(cardSet)) errors[card.id] = `Invalid Set: ${card.set.toUpperCase()}`;
      const isBasic = ALL_BASIC_LAND_NAMES.includes(card.name) || ALL_BASIC_LAND_NAMES.includes(card.printed_name || "");
      if (!isBasic && card.quantity > 4) errors[card.id] = errors[card.id] ? `${errors[card.id]} / Max 4 copies` : "Max 4 copies";
    };
    (deck || []).forEach(checkCard);
    (sideboard || []).forEach(checkCard);
    return { validationErrors: errors };
  }, [deck, sideboard, selectedSet, additionalLegalSets]);

  // --- 表示用データ処理 ---
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
    return Object.keys(groups).sort((a, b) => (CATEGORY_PRIORITY[a] || 99) - (CATEGORY_PRIORITY[b] || 99)).map(cat => ({ name: cat, cards: groups[cat], count: groups[cat].reduce((sum, c) => sum + c.quantity, 0) }));
  };

  const currentProcessedData = activeTab === "main" ? processCards(deck) : processCards(sideboard);

  const handleReset = () => {
    if (window.confirm("現在のデッキ内容（カード、名前、コメントなど）をすべて消去しますか？\nこの操作は取り消せません。")) {
      onResetDeck();
    }
  };

  // --- エクスポート ---
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
    navigator.clipboard.writeText(`${headerText}\n\nDeck\n${mainText}\n\nSideboard\n${sideText}`).then(() => {
      setCopied(true); setShowExportMenu(false); setTimeout(() => setCopied(false), 2000);
    });
  };

  // --- 画像生成処理 (Canvas) ---
  const generateDeckImage = async () => {
    if (deck.length === 0) return;
    setIsGeneratingImage(true);

    try {
      // 1. 統計情報の計算
      const nonLandCards = deck.filter(c => !c.type_line.includes("Land"));
      const totalCmc = nonLandCards.reduce((sum, c) => sum + (c.cmc || 0) * c.quantity, 0);
      const totalNonLandCount = nonLandCards.reduce((sum, c) => sum + c.quantity, 0);
      const avgCmc = totalNonLandCount > 0 ? (totalCmc / totalNonLandCount).toFixed(2) : "0.00";
      const rarityCount = { mythic: 0, rare: 0, uncommon: 0, common: 0 };
      deck.forEach(c => { const r = c.rarity?.toLowerCase() || 'common'; if (r in rarityCount) rarityCount[r as keyof typeof rarityCount] += c.quantity; });
      const manaCount = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
      deck.forEach(c => { if (c.mana_cost) { const w = (c.mana_cost.match(/{W}/g) || []).length; const u = (c.mana_cost.match(/{U}/g) || []).length; const b = (c.mana_cost.match(/{B}/g) || []).length; const r = (c.mana_cost.match(/{R}/g) || []).length; const g = (c.mana_cost.match(/{G}/g) || []).length; const colorless = (c.mana_cost.match(/{C}/g) || []).length; manaCount.W += w * c.quantity; manaCount.U += u * c.quantity; manaCount.B += b * c.quantity; manaCount.R += r * c.quantity; manaCount.G += g * c.quantity; manaCount.C += colorless * c.quantity; } });

      // --- 背景画像用キーカード選定ロジック ---
      let bgKeyCard: DeckCard | undefined;
      const artSortFn = (a: Card, b: Card) => {
        const rScore = (c: Card) => { if (c.rarity === 'mythic') return 4; if (c.rarity === 'rare') return 3; if (c.rarity === 'uncommon') return 2; return 1; };
        const ra = rScore(a), rb = rScore(b);
        if (ra !== rb) return rb - ra;
        return (b.cmc || 0) - (a.cmc || 0);
      };

      const candidates = keyCardIds.length > 0
        ? [...deck, ...sideboard].filter(c => keyCardIds.includes(c.id))
        : [...deck];
      
      if (candidates.length > 0) {
        bgKeyCard = candidates.sort(artSortFn)[0];
      }

      const keyArtUrl = bgKeyCard?.image_uris?.art_crop || bgKeyCard?.card_faces?.[0]?.image_uris?.art_crop;

      // 2. カラム分け & ソート
      const columns: DeckCard[][] = [[], [], [], [], [], [], []];
      const addToColumn = (card: DeckCard) => { if (card.type_line.includes("Land")) { columns[6].push(card); return; } const cmc = Math.floor(card.cmc || 0); let idx = cmc <= 1 ? 0 : cmc >= 6 ? 5 : cmc - 1; columns[idx].push(card); };
      deck.forEach(addToColumn);
      const typeScore = (c: DeckCard) => { const t = c.card_faces?.[0]?.type_line ?? c.type_line; if (t.includes("Creature")) return 1; if (t.includes("Planeswalker")) return 2; return 3; };
      columns.forEach(col => col.sort((a, b) => { const tsA = typeScore(a), tsB = typeScore(b); return tsA !== tsB ? tsA - tsB : a.name.localeCompare(b.name); }));
      const sortedSideboard = [...sideboard].sort((a, b) => a.name.localeCompare(b.name));

      // 3. Canvas描画設定
      const CARD_WIDTH = 180; const CARD_HEIGHT = 250; const COL_GAP = 20; const HEADER_HEIGHT = 180; const COL_HEADER_HEIGHT = 40; const STACK_OFFSET = 60; const SIDEBOARD_OFFSET = 60; const FOOTER_HEIGHT = 60;
      const getColumnHeight = (cards: DeckCard[]) => cards.length === 0 ? 0 : CARD_HEIGHT + (Math.max(0, cards.length - 1) * STACK_OFFSET);
      const colHeights = columns.map(getColumnHeight);
      const maxMainHeight = Math.max(...colHeights, 100);
      const sideRows = Math.ceil(sortedSideboard.length / 7);
      const sideHeight = sortedSideboard.length > 0 ? CARD_HEIGHT + (sideRows > 1 ? (sideRows - 1) * (CARD_HEIGHT + 10) : 0) + SIDEBOARD_OFFSET + 40 : 0;
      const canvasWidth = (CARD_WIDTH * 7) + (COL_GAP * 8);
      const canvasHeight = HEADER_HEIGHT + COL_HEADER_HEIGHT + maxMainHeight + sideHeight + FOOTER_HEIGHT;
      const canvas = document.createElement("canvas"); canvas.width = canvasWidth; canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas context failed");
      const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = "Anonymous"; img.onload = () => resolve(img); img.onerror = () => reject(new Error(`Failed to load ${url}`)); const sep = url.includes("?") ? "&" : "?"; img.src = `${url}${sep}t=${new Date().getTime()}`; });

      // 背景描画
      ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      if (keyArtUrl) { try { const bgImg = await loadImage(keyArtUrl); ctx.save(); const scale = Math.max(canvasWidth / bgImg.width, canvasHeight / bgImg.height); const x = (canvasWidth / 2) - (bgImg.width / 2) * scale; const y = (canvasHeight / 2) - (bgImg.height / 2) * scale; ctx.globalAlpha = 0.6; ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale); const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight); grad.addColorStop(0, "rgba(15, 23, 42, 0.9)"); grad.addColorStop(0.2, "rgba(15, 23, 42, 0.4)"); grad.addColorStop(0.5, "rgba(15, 23, 42, 0.3)"); grad.addColorStop(0.8, "rgba(15, 23, 42, 0.4)"); grad.addColorStop(1, "rgba(15, 23, 42, 0.95)"); ctx.globalAlpha = 1; ctx.fillStyle = grad; ctx.fillRect(0, 0, canvasWidth, canvasHeight); ctx.restore(); } catch (e) { console.error("BG load failed", e); } }

      // --- ヘッダー・統計情報描画 ---
      const PADDING_X = 40; const PADDING_Y = 40; const SYMBOL_SIZE = 60; const TITLE_X = PADDING_X + SYMBOL_SIZE + 20;
      try { const setIconUrl = `https://svgs.scryfall.io/sets/${selectedSet}.svg`; const iconImg = await loadImage(setIconUrl); ctx.save(); ctx.filter = "invert(100%)"; let drawW = SYMBOL_SIZE; let drawH = SYMBOL_SIZE; const ratio = iconImg.width / iconImg.height; if (ratio > 1) drawH = SYMBOL_SIZE / ratio; else drawW = SYMBOL_SIZE * ratio; const iconX = PADDING_X + (SYMBOL_SIZE - drawW) / 2; const iconY = PADDING_Y + (SYMBOL_SIZE - drawH) / 2; ctx.drawImage(iconImg, iconX, iconY, drawW, drawH); ctx.restore(); } catch(e) {}
      ctx.shadowColor = "black"; ctx.shadowBlur = 10; ctx.fillStyle = "#ffffff"; ctx.font = "bold 42px sans-serif"; ctx.fillText(`${deckName}`, TITLE_X, 65); ctx.fillStyle = "#94a3b8"; ctx.font = "bold 20px sans-serif"; ctx.fillText(`(${selectedSet.toUpperCase()})  •  Main: ${mainCount} / Side: ${sideCount}`, TITLE_X, 100);
      if (deckComment.trim()) { const commentW = 400; const commentX = canvasWidth - PADDING_X - commentW; const commentY = PADDING_Y; const commentH = 110; ctx.fillStyle = "rgba(15, 23, 42, 0.7)"; ctx.fillRect(commentX, commentY, commentW, commentH); ctx.strokeStyle = "rgba(148, 163, 184, 0.3)"; ctx.strokeRect(commentX, commentY, commentW, commentH); ctx.fillStyle = "#e2e8f0"; ctx.font = "16px sans-serif"; ctx.textBaseline = "top"; const words = deckComment.split(""); let line = ""; let lineY = commentY + 10; const lineHeight = 24; const maxWidth = commentW - 20; for (let n = 0; n < words.length; n++) { const testLine = line + words[n]; const metrics = ctx.measureText(testLine); if (metrics.width > maxWidth && n > 0) { ctx.fillText(line, commentX + 10, lineY); line = words[n]; lineY += lineHeight; if (lineY > commentY + commentH - 20) break; } else { line = testLine; } } ctx.fillText(line, commentX + 10, lineY); ctx.textBaseline = "alphabetic"; }
      const statsStartX = 40; const statsY = 140; const drawRarityDot = (x: number, color: string, count: number, label: string) => { ctx.beginPath(); ctx.arc(x, statsY, 8, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 16px sans-serif"; ctx.fillText(`${count}`, x + 15, statsY + 6); ctx.fillStyle = "#64748b"; ctx.font = "12px sans-serif"; ctx.fillText(label, x + 15, statsY + 22); return 60; }; let currentX = statsStartX; currentX += drawRarityDot(currentX, "#ef4444", rarityCount.mythic, "M"); currentX += drawRarityDot(currentX, "#eab308", rarityCount.rare, "R"); currentX += drawRarityDot(currentX, "#94a3b8", rarityCount.uncommon, "U"); currentX += drawRarityDot(currentX, "#0f172a", rarityCount.common, "C"); ctx.lineWidth = 1; ctx.strokeStyle = "#475569"; [0, 60, 120, 180].forEach(offset => { ctx.beginPath(); ctx.arc(statsStartX + offset, statsY, 8, 0, Math.PI * 2); ctx.stroke(); }); const avgX = statsStartX + 260; ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 24px sans-serif"; ctx.fillText(`${avgCmc}`, avgX, statsY + 6); ctx.fillStyle = "#64748b"; ctx.font = "12px sans-serif"; ctx.fillText("Avg. Mana Value", avgX, statsY + 22);
      const manaX = avgX + 120; const manaSymbols = ["W", "U", "B", "R", "G", "C"] as const; let mOffset = 0; const symbolImgs: Record<string, HTMLImageElement> = {}; const loadSymbolPromises = manaSymbols.map(async (sym) => { if (manaCount[sym] > 0) { try { const url = `https://svgs.scryfall.io/card-symbols/${sym}.svg`; symbolImgs[sym] = await loadImage(url); } catch(e) {} } }); await Promise.all(loadSymbolPromises); manaSymbols.forEach(sym => { if (manaCount[sym] > 0 && symbolImgs[sym]) { const size = 20; ctx.drawImage(symbolImgs[sym], manaX + mOffset - 10, statsY - 10, size, size); ctx.textAlign = "left"; ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 14px sans-serif"; ctx.fillText(`${manaCount[sym]}`, manaX + mOffset + 14, statsY + 5); mOffset += 50; } });
      
      // --- メインデッキ描画 ---
      const columnLabels = ["1", "2", "3", "4", "5", "6+", "Land"];
      // (省略: drawIcon関数)
      const drawIcon = (ctx: CanvasRenderingContext2D, type: "creature" | "spell", x: number, y: number, size: number, color: string) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round"; if (type === "creature") { ctx.beginPath(); ctx.moveTo(size * 0.2, size * 0.8); ctx.lineTo(size * 0.8, size * 0.2); ctx.moveTo(size * 0.3, size * 0.7); ctx.lineTo(size * 0.45, size * 0.85); ctx.moveTo(size * 0.15, size * 0.55); ctx.lineTo(size * 0.3, size * 0.7); ctx.moveTo(size * 0.15, size * 0.85); ctx.lineTo(size * 0.3, size * 0.7); ctx.stroke(); } else { ctx.beginPath(); ctx.moveTo(size * 0.55, size * 0.05); ctx.lineTo(size * 0.25, size * 0.55); ctx.lineTo(size * 0.55, size * 0.55); ctx.lineTo(size * 0.45, size * 0.95); ctx.lineTo(size * 0.75, size * 0.45); ctx.lineTo(size * 0.45, size * 0.45); ctx.closePath(); ctx.stroke(); } ctx.restore(); };

      for (let colIdx = 0; colIdx < 7; colIdx++) {
        const colCards = columns[colIdx];
        const x = COL_GAP + (colIdx * (CARD_WIDTH + COL_GAP));
        const startY = HEADER_HEIGHT;
        // (省略: カラムヘッダー描画)
        ctx.textAlign = "center"; const centerX = x + CARD_WIDTH / 2; ctx.fillStyle = "#f1f5f9"; ctx.font = "bold 28px sans-serif"; ctx.fillText(columnLabels[colIdx], centerX, startY + 30); const total = colCards.reduce((a, c) => a + c.quantity, 0); if (total > 0) { ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 16px sans-serif"; ctx.fillText(`${total}`, centerX, startY + 52); if (colIdx < 6) { const creatures = colCards.filter(c => { const t = c.card_faces?.[0]?.type_line ?? c.type_line; return t.includes("Creature"); }).reduce((a, c) => a + c.quantity, 0); const nonCreatures = total - creatures; ctx.fillStyle = "#94a3b8"; const iconSize = 12; const textY = startY + 70; const wC = ctx.measureText(`${creatures}`).width; const wS = ctx.measureText(`${nonCreatures}`).width; const fullW = wC + iconSize + 10 + wS + iconSize; let curX = centerX - (fullW / 2); ctx.textAlign = "left"; if(creatures > 0) { ctx.fillText(`${creatures}`, curX, textY); drawIcon(ctx, "creature", curX + wC + 3, textY - 10, iconSize, "#94a3b8"); } if(nonCreatures > 0) { curX = creatures > 0 ? curX + wC + iconSize + 10 : curX; ctx.fillText(`${nonCreatures}`, curX, textY); drawIcon(ctx, "spell", curX + wS + 3, textY - 10, iconSize, "#94a3b8"); } } }
        
        ctx.textAlign = "left";
        let cardY = startY + COL_HEADER_HEIGHT;
        for (const card of colCards) {
          const imageUrl = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
          if (imageUrl) {
            try {
              await sleep(80); 
              const img = await loadImage(imageUrl);
              ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; ctx.shadowBlur = 10; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
              ctx.drawImage(img, x, cardY, CARD_WIDTH, CARD_HEIGHT);
              ctx.shadowColor = "transparent";
              
              const badgeSize = 18;
              const badgeX = x + CARD_WIDTH - 25;
              const badgeY = cardY + 45;
              ctx.beginPath(); ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fill();
              ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2; ctx.stroke();
              ctx.fillStyle = "#ffffff"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
              ctx.fillText(`x${card.quantity}`, badgeX, badgeY + 1);
              ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

              if (keyCardIds.includes(card.id)) {
                const starX = x + 25;
                const starY = cardY + 45; 

                ctx.save();
                ctx.beginPath();
                ctx.arc(starX, starY, 15, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.fill();
                ctx.strokeStyle = "#fbbf24";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowColor = "#fbbf24";
                ctx.shadowBlur = 10;
                ctx.fillStyle = "#fbbf24";
                ctx.font = "20px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("★", starX, starY + 2);
                ctx.restore();
              }
              
              cardY += STACK_OFFSET;
            } catch (e) {
              ctx.fillStyle = "#334155"; ctx.fillRect(x, cardY, CARD_WIDTH, CARD_HEIGHT); ctx.fillStyle = "#fff"; ctx.fillText(card.name.substring(0, 15), x + 5, cardY + 20); cardY += STACK_OFFSET;
            }
          }
        }
      }

      // --- サイドボード ---
      if (sortedSideboard.length > 0) {
        const sideStartY = HEADER_HEIGHT + COL_HEADER_HEIGHT + maxMainHeight + SIDEBOARD_OFFSET;
        ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 24px sans-serif"; ctx.fillText("Sideboard", 40, sideStartY - 15);
        ctx.strokeStyle = "#334155"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(40, sideStartY - 10); ctx.lineTo(canvasWidth - 40, sideStartY - 10); ctx.stroke();
        for (let i = 0; i < sortedSideboard.length; i++) {
          const card = sortedSideboard[i];
          const col = i % 7;
          const row = Math.floor(i / 7);
          const x = COL_GAP + (col * (CARD_WIDTH + COL_GAP));
          const y = sideStartY + (row * (CARD_HEIGHT + 10));
          const imageUrl = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
          if (imageUrl) {
            try {
              await sleep(80);
              const img = await loadImage(imageUrl);
              ctx.drawImage(img, x, y, CARD_WIDTH, CARD_HEIGHT);
              
              const badgeSize = 18;
              const badgeX = x + CARD_WIDTH - 25;
              const badgeY = y + 45;
              ctx.beginPath(); ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fill();
              ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2; ctx.stroke();
              ctx.fillStyle = "#ffffff"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
              ctx.fillText(`x${card.quantity}`, badgeX, badgeY + 1);
              ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

              if (keyCardIds.includes(card.id)) {
                const starX = x + 25;
                const starY = y + 45; 

                ctx.save();
                ctx.beginPath();
                ctx.arc(starX, starY, 15, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.fill();
                ctx.strokeStyle = "#fbbf24";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowColor = "#fbbf24";
                ctx.shadowBlur = 10;
                ctx.fillStyle = "#fbbf24";
                ctx.font = "20px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("★", starX, starY + 2);
                ctx.restore();
              }

            } catch (e) {}
          }
        }
      }

      // --- フッター (権利表記) ---
      const footerY = canvasHeight - 35; ctx.fillStyle = "#94a3b8"; ctx.font = "14px sans-serif"; ctx.textAlign = "right"; const dateStr = new Date().toLocaleDateString(); ctx.fillText(`Created on ${dateStr} by MtG PLUS1`, canvasWidth - 40, footerY); ctx.textAlign = "left"; ctx.font = "12px sans-serif"; ctx.fillStyle = "#64748b"; const legalText1 = "Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC."; const legalText2 = "MtG PLUS1 is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards."; ctx.fillText(legalText1, 40, footerY - 8); ctx.fillText(legalText2, 40, footerY + 8);
      const dataUrl = canvas.toDataURL("image/png"); const link = document.createElement("a"); link.download = `${deckName.replace(/\s+/g, "_")}_${selectedSet}.png`; link.href = dataUrl; link.click();
      setShowExportMenu(false);

    } catch (error) {
      console.error("Image generation failed", error);
      alert("画像の生成に失敗しました。");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col gap-3">
        
        {/* デッキ名 & コメント */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-500 select-none">
            ({selectedSet.toUpperCase()})
          </span>
          <input
            type="text"
            value={deckName}
            onChange={(e) => onChangeDeckName(e.target.value)}
            placeholder="Deck Name"
            className="flex-1 bg-transparent text-lg font-bold text-white placeholder-slate-600 border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none transition-colors px-1"
          />
          <button 
            onClick={() => setShowCommentBox(!showCommentBox)}
            className={`p-1.5 rounded transition-colors ${showCommentBox ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white bg-slate-800"}`}
            title="コメント/メモを入力"
          >
            <MessageSquare size={18} />
          </button>
        </div>

        {/* コメント欄 */}
        {showCommentBox && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <textarea
              value={deckComment}
              onChange={(e) => onChangeDeckComment(e.target.value)}
              placeholder="デッキのコンセプトやメモを入力（画像にも出力されます）"
              className="w-full bg-slate-950/50 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 min-h-[60px] resize-y placeholder:text-slate-600"
            />
          </div>
        )}


        <div className="flex justify-between items-center">
          <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
            <button onClick={() => setActiveTab("main")} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === "main" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>Main ({mainCount})</button>
            <button onClick={() => setActiveTab("side")} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === "side" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}>Side ({sideCount})</button>
          </div>
          <div className="flex items-center gap-2">
            {/* ★追加: リセットボタン (言語統一ボタンの左などに配置) */}
            <button 
              onClick={handleReset}
              className="p-1.5 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 border border-slate-700 hover:border-red-800 rounded text-slate-400 transition-colors"
              title="デッキ内容をリセット（全消去）"
            >
              <Trash2 size={14} />
            </button>
            <button onClick={onUnifyLanguage} disabled={isProcessing} className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors" title="全カードの言語を統一"><RefreshCw size={14} className={isProcessing ? "animate-spin" : ""} /></button>
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors border border-slate-600" title="テキストからデッキをインポート"><Upload size={14} /><span>Import</span></button>
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

      <div className="flex-1 overflow-y-auto px-2 pb-10">
        {currentProcessedData.length > 0 ? (
          currentProcessedData.map((group) => (
            <div key={group.name} className="mb-1">
              <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm py-0.5 px-2 border-b border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center"><span>{group.name}</span><span className="bg-slate-800 px-1.5 rounded text-slate-300">{group.count}</span></div>
              <CardView 
                cards={group.cards} 
                mode={viewMode} 
                onAction={(c) => onRemove(c, activeTab)} 
                onQuantityChange={(c, amount) => onQuantityChange(c, amount, activeTab)} 
                actionType="remove" 
                isDeckArea={true} 
                validationErrors={validationErrors} 
                keyCardIds={keyCardIds}
                onToggleKeyCard={onToggleKeyCard}/>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">{activeTab === "main" ? "デッキにカードがありません" : "サイドボードにカードがありません"}</div>
        )}
      </div>
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={(main, side, name) => { onImportDeck(main, side, name); if (name) { onChangeDeckName(name); } }} language={language} selectedSet={selectedSet} />
    </div>
  );
}