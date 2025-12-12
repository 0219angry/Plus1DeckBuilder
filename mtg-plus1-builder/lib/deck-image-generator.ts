// src/lib/deck-image-generator.ts
import { DeckCard, TurnMove } from "@/types";
import { getDeckColorName } from "@/lib/mtg";

export type DeckImageConfig = {
  deck: DeckCard[];
  sideboard: DeckCard[];
  deckName: string;
  builderName: string;
  selectedSet: string;
  colors: string[];
  keyCardIds: string[];
  
  archetype: string;
  concepts: string;
  turnMoves: TurnMove[];
  
  showArchetype: boolean;
  showConcepts: boolean;
  showTurnMoves: boolean;
};

// --- Helpers ---

const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error(`Failed to load ${url}`));
  const sep = url.includes("?") ? "&" : "?";
  img.src = `${url}${sep}t=${new Date().getTime()}`;
});

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize = "20px", isBold = false) => {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  ctx.font = `${isBold ? "bold" : ""} ${fontSize} sans-serif`;
  paragraphs.forEach(para => {
    let line = '';
    const words = para.split(''); 
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n];
      } else {
        line = testLine;
      }
    }
    lines.push(line);
  });
  return lines;
};

// メインデッキのクリーチャー/スペルアイコン描画
const drawIcon = (ctx: CanvasRenderingContext2D, type: "creature" | "spell", x: number, y: number, size: number, color: string) => {
  ctx.save();
  ctx.translate(x, y);
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

// --- Main Function ---

export const generateDeckImageCanvas = async (config: DeckImageConfig): Promise<string> => {
  const { 
    deck, sideboard, deckName, builderName, selectedSet, colors, keyCardIds,
    archetype, concepts, turnMoves, 
    showArchetype, showConcepts, showTurnMoves 
  } = config;

  // 1. データ計算
  const nonLandCards = deck.filter(c => !c.type_line.includes("Land"));
  const totalCmc = nonLandCards.reduce((sum, c) => sum + (c.cmc || 0) * c.quantity, 0);
  const totalNonLandCount = nonLandCards.reduce((sum, c) => sum + c.quantity, 0);
  const avgCmc = totalNonLandCount > 0 ? (totalCmc / totalNonLandCount).toFixed(2) : "0.00";
  
  const rarityCount = { mythic: 0, rare: 0, uncommon: 0, common: 0 };
  deck.forEach(c => {
    const r = c.rarity?.toLowerCase() || 'common';
    if (r in rarityCount) rarityCount[r as keyof typeof rarityCount] += c.quantity;
  });

  const manaCount = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  deck.forEach(c => {
    if (c.mana_cost) {
      manaCount.W += (c.mana_cost.match(/{W}/g) || []).length * c.quantity;
      manaCount.U += (c.mana_cost.match(/{U}/g) || []).length * c.quantity;
      manaCount.B += (c.mana_cost.match(/{B}/g) || []).length * c.quantity;
      manaCount.R += (c.mana_cost.match(/{R}/g) || []).length * c.quantity;
      manaCount.G += (c.mana_cost.match(/{G}/g) || []).length * c.quantity;
      manaCount.C += (c.mana_cost.match(/{C}/g) || []).length * c.quantity;
    }
  });

  const mainCount = deck.reduce((sum, c) => sum + c.quantity, 0);
  const sideCount = sideboard.reduce((sum, c) => sum + c.quantity, 0);

  // アーキタイプ名生成 (色名 + 入力値)
  const hasArchetype = archetype && showArchetype;
  let displayArchetype = "";
  if (hasArchetype) {
    const colorName = getDeckColorName(colors, 'ja');
    displayArchetype = colorName ? `${colorName} ${archetype}` : archetype;
  }

  // キーカード背景選定
  let bgKeyCard: DeckCard | undefined;
  const artSortFn = (a: DeckCard, b: DeckCard) => {
    const rScore = (c: DeckCard) => { if (c.rarity === 'mythic') return 4; if (c.rarity === 'rare') return 3; if (c.rarity === 'uncommon') return 2; return 1; };
    const ra = rScore(a), rb = rScore(b);
    if (ra !== rb) return rb - ra;
    return (b.cmc || 0) - (a.cmc || 0);
  };
  const candidates = keyCardIds.length > 0 ? [...deck, ...sideboard].filter(c => keyCardIds.includes(c.id)) : [...deck];
  if (candidates.length > 0) bgKeyCard = candidates.sort(artSortFn)[0];
  const keyArtUrl = bgKeyCard?.image_uris?.art_crop || bgKeyCard?.card_faces?.[0]?.image_uris?.art_crop;

  // カラム分け
  const columns: DeckCard[][] = [[], [], [], [], [], [], []];
  deck.forEach(card => {
    if (card.type_line.includes("Land")) { columns[6].push(card); return; }
    const cmc = Math.floor(card.cmc || 0);
    let idx = cmc <= 1 ? 0 : cmc >= 6 ? 5 : cmc - 1;
    columns[idx].push(card);
  });
  
  const typeScore = (c: DeckCard) => {
     const t = c.card_faces?.[0]?.type_line ?? c.type_line;
     if (t.includes("Creature")) return 1;
     if (t.includes("Planeswalker")) return 2;
     return 3;
  };
  columns.forEach(col => col.sort((a, b) => {
    const tsA = typeScore(a), tsB = typeScore(b);
    return tsA !== tsB ? tsA - tsB : a.name.localeCompare(b.name);
  }));
  const sortedSideboard = [...sideboard].sort((a, b) => a.name.localeCompare(b.name));

  // 2. サイズ計算
  const CARD_WIDTH = 180;
  const CARD_HEIGHT = 250;
  const COL_GAP = 20;
  const HEADER_HEIGHT = 180; 
  const COL_HEADER_HEIGHT = 40;
  const STACK_OFFSET = 60;
  const SIDEBOARD_OFFSET = 60;
  const FOOTER_HEIGHT = 60;
  const INFO_AREA_GAP = 60;

  const getColumnHeight = (cards: DeckCard[]) => cards.length === 0 ? 0 : CARD_HEIGHT + (Math.max(0, cards.length - 1) * STACK_OFFSET);
  const colHeights = columns.map(getColumnHeight);
  const maxMainHeight = Math.max(...colHeights, 100);
  
  const sideRows = Math.ceil(sortedSideboard.length / 7);
  const sideHeight = sortedSideboard.length > 0 ? CARD_HEIGHT + (sideRows > 1 ? (sideRows - 1) * (CARD_HEIGHT + 10) : 0) + SIDEBOARD_OFFSET + 40 : 0;

  const canvasWidth = (CARD_WIDTH * 7) + (COL_GAP * 8);
  const textWidth = canvasWidth - (40 * 2);

  // Infoエリア (Concepts / TurnMoves)
  const hasConcepts = concepts && showConcepts;
  const hasTurnMoves = turnMoves.length > 0 && showTurnMoves;
  
  const canvasStub = document.createElement("canvas");
  const ctxStub = canvasStub.getContext("2d");
  if (!ctxStub) throw new Error("Canvas init failed");

  let conceptsLines: string[] = [];
  let infoHeight = 0;
  let timelineHeight = 0;
  const TEXT_LINE_HEIGHT = 30;
  const TIMELINE_GAP = 20;

  if (hasConcepts || hasTurnMoves) {
    infoHeight += INFO_AREA_GAP;
    if (hasConcepts) {
      conceptsLines = wrapText(ctxStub, concepts, textWidth);
      infoHeight += conceptsLines.length * TEXT_LINE_HEIGHT + 80;
    }
    if (hasTurnMoves) {
      infoHeight += 60;
      turnMoves.forEach(move => {
        const actionLines = wrapText(ctxStub, move.action, textWidth - 60, "20px");
        const itemHeight = Math.max(actionLines.length * 28, 40);
        timelineHeight += itemHeight + TIMELINE_GAP;
      });
      infoHeight += timelineHeight;
    }
    infoHeight += 40;
  }

  const canvasHeight = HEADER_HEIGHT + COL_HEADER_HEIGHT + maxMainHeight + sideHeight + infoHeight + FOOTER_HEIGHT;

  // 3. 描画
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context failed");

  // 背景
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (keyArtUrl) {
    try {
      const bgImg = await loadImage(keyArtUrl);
      ctx.save();
      const scale = Math.max(canvasWidth / bgImg.width, canvasHeight / bgImg.height);
      const x = (canvasWidth / 2) - (bgImg.width / 2) * scale;
      const y = (canvasHeight / 2) - (bgImg.height / 2) * scale;
      
      ctx.globalAlpha = 0.6; 
      ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
      
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grad.addColorStop(0, "rgba(15, 23, 42, 0.9)");
      grad.addColorStop(0.2, "rgba(15, 23, 42, 0.4)");
      grad.addColorStop(0.5, "rgba(15, 23, 42, 0.3)");
      grad.addColorStop(0.8, "rgba(15, 23, 42, 0.4)"); 
      grad.addColorStop(1, "rgba(15, 23, 42, 0.95)");
      
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    } catch (e) { console.error("BG load failed", e); }
  }

  const PADDING_X = 40;
  const PADDING_Y = 40;
  const SYMBOL_SIZE = 60;
  const TITLE_X = PADDING_X + SYMBOL_SIZE + 20;

  // ヘッダー: セットシンボル
  try {
     const setIconUrl = `https://svgs.scryfall.io/sets/${selectedSet}.svg`;
     const iconImg = await loadImage(setIconUrl);
     ctx.save();
     ctx.filter = "invert(100%)";
     let drawW = SYMBOL_SIZE, drawH = SYMBOL_SIZE;
     const ratio = iconImg.width / iconImg.height;
     if (ratio > 1) drawH = SYMBOL_SIZE / ratio; else drawW = SYMBOL_SIZE * ratio;
     const iconX = PADDING_X + (SYMBOL_SIZE - drawW) / 2;
     const iconY = PADDING_Y + (SYMBOL_SIZE - drawH) / 2;
     ctx.drawImage(iconImg, iconX, iconY, drawW, drawH);
     ctx.restore();
  } catch(e) {}

  // ヘッダー: テキスト
  ctx.shadowColor = "black"; ctx.shadowBlur = 10;
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 42px sans-serif";
  ctx.fillText(`${deckName}`, TITLE_X, 55); 

  // ★ アーキタイプ表示 (ヘッダー内)
  if (displayArchetype) {
    ctx.fillStyle = "#60a5fa"; // blue-400
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(displayArchetype, TITLE_X, 95);
  }
  
  ctx.fillStyle = "#94a3b8"; ctx.font = "bold 18px sans-serif";
  const setInfo = `(${selectedSet.toUpperCase()})  •  Main: ${mainCount} / Side: ${sideCount}`;
  const setInfoY = displayArchetype ? 125 : 95;
  ctx.fillText(setInfo, TITLE_X, setInfoY);

  // マナカーブデータの集計 (カラム分けと同じロジック: 1以下, 2, 3, 4, 5, 6以上)
  const manaCurve = [0, 0, 0, 0, 0, 0];
  deck.forEach(c => {
    if (c.type_line.includes("Land")) return;
    const cost = Math.floor(c.cmc || 0);
    // 1マナ以下=0, 6マナ以上=5, それ以外は cost-1
    const idx = cost <= 1 ? 0 : cost >= 6 ? 5 : cost - 1;
    manaCurve[idx] += c.quantity;
  });
  
  const maxCount = Math.max(...manaCurve, 4); // 最小でも高さ4相当のスケール確保
  
  // 描画エリア設定
  const graphW = 320;
  const graphH = 100;
  const graphX = canvasWidth - PADDING_X - graphW;
  const graphY = PADDING_Y + 10;
  
  // 背景ボックス (オプション: 少し暗くして視認性アップ)
  ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
  ctx.beginPath();
  ctx.roundRect(graphX - 20, graphY - 10, graphW + 40, graphH + 30, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
  ctx.stroke();

  // グラフ描画
  const barWidth = 32;
  const barGap = 18;
  const labels = ["1", "2", "3", "4", "5", "6+"];
  
  manaCurve.forEach((count, i) => {
    const x = graphX + i * (barWidth + barGap);
    
    // バーの高さ計算 (最大値に対する割合)
    const barH = (count / maxCount) * (graphH - 20); // ラベル分20px引く
    const y = graphY + (graphH - 20) - barH;

    // バー描画
    if (count > 0) {
      // グラデーション
      const gradBar = ctx.createLinearGradient(x, y, x, y + barH);
      gradBar.addColorStop(0, "#60a5fa"); // blue-400
      gradBar.addColorStop(1, "#3b82f6"); // blue-500
      
      ctx.fillStyle = gradBar;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 4);
      ctx.fill();

      // 数値 (バーの上)
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${count}`, x + barWidth / 2, y - 5);
    }

    // ラベル (X軸)
    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x + barWidth / 2, graphY + graphH);
    
    // 0の時のベースラインマーカー
    if (count === 0) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
      ctx.fillRect(x, graphY + (graphH - 20) - 2, barWidth, 2);
    }
  });

  // タイトル ("Mana Curve")
  ctx.textAlign = "right";
  ctx.fillStyle = "#64748b";
  ctx.font = "12px sans-serif";
  ctx.fillText("Mana Curve", graphX + graphW, graphY - 15);
  ctx.textAlign = "left"; // 元に戻す

  // 統計 (レアリティ・マナ)
  const statsStartX = 40;
  const statsY = 140;
  const drawRarityDot = (x: number, color: string, count: number, label: string) => {
     ctx.beginPath(); ctx.arc(x, statsY, 8, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
     ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 16px sans-serif"; ctx.fillText(`${count}`, x + 15, statsY + 6);
     ctx.fillStyle = "#64748b"; ctx.font = "12px sans-serif"; ctx.fillText(label, x + 15, statsY + 22);
     return 60;
  };
  let currentX = statsStartX;
  currentX += drawRarityDot(currentX, "#ef4444", rarityCount.mythic, "M"); 
  currentX += drawRarityDot(currentX, "#eab308", rarityCount.rare, "R");   
  currentX += drawRarityDot(currentX, "#94a3b8", rarityCount.uncommon, "U"); 
  currentX += drawRarityDot(currentX, "#0f172a", rarityCount.common, "C");   
  
  const avgX = statsStartX + 260;
  ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 24px sans-serif"; ctx.fillText(`${avgCmc}`, avgX, statsY + 6);
  ctx.fillStyle = "#64748b"; ctx.font = "12px sans-serif"; ctx.fillText("Avg. CMC", avgX, statsY + 22);

  // マナシンボル
  const manaX = avgX + 120;
  const manaSymbols = ["W", "U", "B", "R", "G", "C"] as const;
  let mOffset = 0;
  const loadSymbolPromises = manaSymbols.map(async (sym) => {
    if (manaCount[sym] > 0) {
      try {
        const url = `https://svgs.scryfall.io/card-symbols/${sym}.svg`;
        const img = await loadImage(url);
        const size = 20;
        // 注意: 非同期なので描画順序が保証されない。ここでは簡易的に即時描画するが、厳密にはPromise.all後に描画すべき
        // 修正: 座標を確定させて描画
        const xPos = manaX + mOffset - 10; // ここはmOffsetがクロージャでキャプチャされない問題があるため、本来はループ外でロードすべき
      } catch(e) {}
    }
  });
  // 修正: マナシンボル描画を同期的フローにする
  for (const sym of manaSymbols) {
      if (manaCount[sym] > 0) {
          try {
             const url = `https://svgs.scryfall.io/card-symbols/${sym}.svg`;
             const img = await loadImage(url);
             const size = 20;
             ctx.drawImage(img, manaX + mOffset - 10, statsY - 10, size, size);
             ctx.textAlign = "left";
             ctx.fillStyle = "#cbd5e1";
             ctx.font = "bold 14px sans-serif";
             ctx.fillText(`${manaCount[sym]}`, manaX + mOffset + 14, statsY + 5);
             mOffset += 50;
          } catch(e) {}
      }
  }

  // メインデッキ描画
  const columnLabels = ["1", "2", "3", "4", "5", "6+", "Land"];
  for (let colIdx = 0; colIdx < 7; colIdx++) {
    const colCards = columns[colIdx];
    const x = COL_GAP + (colIdx * (CARD_WIDTH + COL_GAP));
    const startY = HEADER_HEIGHT;
    ctx.textAlign = "center";
    const centerX = x + CARD_WIDTH / 2;
    ctx.fillStyle = "#f1f5f9"; ctx.font = "bold 28px sans-serif"; ctx.fillText(columnLabels[colIdx], centerX, startY + 30);
    
    const total = colCards.reduce((a, c) => a + c.quantity, 0);
    if (total > 0) {
        ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 16px sans-serif"; ctx.fillText(`${total}`, centerX, startY + 52);
        if (colIdx < 6) {
             const creatures = colCards.filter(c => {
               const t = c.card_faces?.[0]?.type_line ?? c.type_line;
               return t.includes("Creature");
             }).reduce((a, c) => a + c.quantity, 0);
             const nonCreatures = total - creatures;
             ctx.fillStyle = "#94a3b8";
             const iconSize = 12;
             const textY = startY + 70;
             const wC = ctx.measureText(`${creatures}`).width;
             const wS = ctx.measureText(`${nonCreatures}`).width;
             const fullW = wC + iconSize + 10 + wS + iconSize;
             let curX = centerX - (fullW / 2);
             ctx.textAlign = "left";
             if(creatures > 0) { ctx.fillText(`${creatures}`, curX, textY); drawIcon(ctx, "creature", curX + wC + 3, textY - 10, iconSize, "#94a3b8"); }
             if(nonCreatures > 0) { curX = creatures > 0 ? curX + wC + iconSize + 10 : curX; ctx.fillText(`${nonCreatures}`, curX, textY); drawIcon(ctx, "spell", curX + wS + 3, textY - 10, iconSize, "#94a3b8"); }
        }
    }
    ctx.textAlign = "left";
    let cardY = startY + COL_HEADER_HEIGHT;
    for (const card of colCards) {
      const imageUrl = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
      if (imageUrl) {
        try {
          await sleep(50); // 負荷軽減
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
            const starX = x + 25; const starY = cardY + 45; 
            ctx.save(); ctx.beginPath(); ctx.arc(starX, starY, 15, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fill();
            ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.stroke();
            ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 10;
            ctx.fillStyle = "#fbbf24"; ctx.font = "20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
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

  // サイドボード
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
          await sleep(50);
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
            const starX = x + 25; const starY = y + 45; 
            ctx.save(); ctx.beginPath(); ctx.arc(starX, starY, 15, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fill();
            ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.stroke();
            ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 10;
            ctx.fillStyle = "#fbbf24"; ctx.font = "20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("★", starX, starY + 2);
            ctx.restore();
          }
        } catch (e) {}
      }
    }
  }

  // ★ Info Area (Concepts / Game Plan)
  let currentY = HEADER_HEIGHT + COL_HEADER_HEIGHT + maxMainHeight + sideHeight;
  
  if (hasConcepts || hasTurnMoves) {
    currentY += INFO_AREA_GAP;
    
    // 区切り線
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PADDING_X, currentY);
    ctx.lineTo(canvasWidth - PADDING_X, currentY);
    ctx.stroke();

    currentY += 50;

    const drawBlock = (label: string, lines: string[], color: string) => {
      if (lines.length === 0) return;
      ctx.fillStyle = color;
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(label, PADDING_X, currentY);
      currentY += 35;
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "20px sans-serif";
      lines.forEach(line => {
        ctx.fillText(line, PADDING_X, currentY);
        currentY += 30;
      });
      currentY += 20;
    };

    if (hasConcepts) drawBlock("【Concepts】", conceptsLines, "#facc15");

    if (hasTurnMoves) {
      currentY += 20;
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("【Game Plan】", PADDING_X, currentY);
      currentY += 40;

      const timelineStartX = PADDING_X + 15;
      const TIMELINE_CIRCLE_R = 15;

      ctx.lineWidth = 4;
      ctx.strokeStyle = "#475569";

      turnMoves.forEach((move, i) => {
        const actionLines = wrapText(ctx, move.action, textWidth - 60, "20px");
        const itemHeight = Math.max(actionLines.length * 28, 40);
        
        const lineLength = (i === turnMoves.length - 1) ? itemHeight : (itemHeight + TIMELINE_GAP);
        ctx.beginPath();
        ctx.moveTo(timelineStartX, currentY);
        ctx.lineTo(timelineStartX, currentY + lineLength);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(timelineStartX, currentY + 10, TIMELINE_CIRCLE_R + 2, 0, Math.PI * 2);
        ctx.fillStyle = "#0f172a";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(timelineStartX, currentY + 10, TIMELINE_CIRCLE_R, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        if (move.turn.length > 2) ctx.font = "bold 10px sans-serif";
        ctx.fillText(move.turn, timelineStartX, currentY + 15);
        ctx.textAlign = "left"; 

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "20px sans-serif";
        actionLines.forEach((line, lineIdx) => {
          ctx.fillText(line, timelineStartX + 40, currentY + 18 + (lineIdx * 28));
        });

        currentY += itemHeight + TIMELINE_GAP;
      });
    }
  }

// -----------------------------------------------------------
  // フッター (製作者名とサイト名を併記)
  // -----------------------------------------------------------
  const footerY = canvasHeight - 35;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "right";
  
  const dateStr = new Date().toLocaleDateString();
  const appName = "plus1deckbuilder.com"; // サイト/アプリ名
  
  let footerText = "";
  
  if (builderName) {
    // パターン1: 製作者名がある場合
    // 表示例: Created by Yuta  •  MtG PLUS1  •  2025/12/12
    footerText = `Created by ${builderName}  •  ${appName}  •  ${dateStr}`;
  } else {
    // パターン2: 製作者名がない場合
    // 表示例: Created by MtG PLUS1  •  2025/12/12
    footerText = `Created by ${appName}  •  ${dateStr}`;
  }

  ctx.fillText(footerText, canvasWidth - 40, footerY);

  // 権利表記 (Left side)
  ctx.textAlign = "left";
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#64748b";
  const legalText1 = "Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.";
  const legalText2 = "MtG PLUS1 is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards.";
  ctx.fillText(legalText1, 40, footerY - 8);
  ctx.fillText(legalText2, 40, footerY + 8);

  return canvas.toDataURL("image/png");
};