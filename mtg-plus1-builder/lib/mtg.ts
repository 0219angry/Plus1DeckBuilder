// src/lib/mtg.ts (または utils/mtg.ts)

// 型定義を作成してエクスポート（他でも使えるように）
export type MtgColorDef = {
  id: string;
  label: string;
  class: string; // 背景色や文字色用のTailwindクラス
  hex: string;   // グラデーション生成用の16進数カラーコード
};

// 型注釈 (: MtgColorDef[]) を追加して定義
export const MTG_COLORS: MtgColorDef[] = [
  { id: 'W', label: '白', class: 'bg-[#f8e7b9] text-slate-900 border-[#e6d095]', hex: '#f8e7b9' },
  { id: 'U', label: '青', class: 'bg-[#0e68ab] text-white border-[#095e9c]', hex: '#0e68ab' },
  { id: 'B', label: '黒', class: 'bg-[#150b00] text-white border-[#2b221b]', hex: '#150b00' },
  { id: 'R', label: '赤', class: 'bg-[#d3202a] text-white border-[#be1c25]', hex: '#d3202a' },
  { id: 'G', label: '緑', class: 'bg-[#00733e] text-white border-[#006636]', hex: '#00733e' },
  { id: 'C', label: '無', class: 'bg-[#ccc2c0] text-slate-900 border-[#b8adaa]', hex: '#ccc2c0' },
];

// カラー名辞書 (キーは W, U, B, R, G, C の順でソート済みであること)
export const COLOR_NAMES: Record<string, { ja: string; en: string }> = {
  // --- 単色 ---
  'W': { ja: '白単', en: 'Mono White' },
  'U': { ja: '青単', en: 'Mono Blue' },
  'B': { ja: '黒単', en: 'Mono Black' },
  'R': { ja: '赤単', en: 'Mono Red' },
  'G': { ja: '緑単', en: 'Mono Green' },
  'C': { ja: '無色', en: 'Colorless' },
  // --- 2色 (ギルド) ---
  'WU': { ja: 'アゾリウス', en: 'Azorius' },
  'UB': { ja: 'ディミーア', en: 'Dimir' },
  'BR': { ja: 'ラクドス', en: 'Rakdos' },
  'RG': { ja: 'グルール', en: 'Gruul' },
  'WG': { ja: 'セレズニア', en: 'Selesnya' },
  'WB': { ja: 'オルゾフ', en: 'Orzhov' },
  'UR': { ja: 'イゼット', en: 'Izzet' },
  'BG': { ja: 'ゴルガリ', en: 'Golgari' },
  'WR': { ja: 'ボロス', en: 'Boros' },
  'UG': { ja: 'シミック', en: 'Simic' },
  // --- 3色 (断片・氏族) ---
  'WUG': { ja: 'バント', en: 'Bant' },
  'WUB': { ja: 'エスパー', en: 'Esper' },
  'UBR': { ja: 'グリクシス', en: 'Grixis' },
  'BRG': { ja: 'ジャンド', en: 'Jund' },
  'WRG': { ja: 'ナヤ', en: 'Naya' },
  'WBG': { ja: 'アブザン', en: 'Abzan' },
  'WUR': { ja: 'ジェスカイ', en: 'Jeskai' },
  'UBG': { ja: 'スゥルタイ', en: 'Sultai' },
  'WBR': { ja: 'マルドゥ', en: 'Mardu' },
  'URG': { ja: 'ティムール', en: 'Temur' },
  // --- 4色 (Sans-X) ---
  'UBRG': { ja: '白抜き4色', en: 'Whiteless' },
  'WBRG': { ja: '青抜き4色', en: 'Blueless' },
  'WURG': { ja: '黒抜き4色', en: 'Blackless' },
  'WUBG': { ja: '赤抜き4色', en: 'Redless' },
  'WUBR': { ja: '緑抜き4色', en: 'Greenless' },
  // --- 5色 ---
  'WUBRG': { ja: '5色', en: '5-Color' },
};

// 色の配列を受け取って名前を返す関数
export function getDeckColorName(colors: string[], lang: 'ja' | 'en' = 'ja'): string | null {
  if (colors.length === 0) return null;
  // ソート順定義
  const sortOrder = ['W', 'U', 'B', 'R', 'G', 'C'];
  // コピーしてソート
  const sortedColors = [...colors].sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));
  const key = sortedColors.join('');
  
  return COLOR_NAMES[key] ? COLOR_NAMES[key][lang] : key;
}

// IDからカラー定義を取得するヘルパー
export const getMtgColor = (id: string) => {
  return MTG_COLORS.find(c => c.id === id) || MTG_COLORS[5]; // デフォルト無色
};

// 色配列からCSSグラデーションを生成するヘルパー
export const getDeckGradientStyle = (colors: string[]) => {
  if (!colors.length) return { borderColor: '#334155' }; // slate-700

  // 定義順(WUBRG)に並べ替え
  const sortOrder = ['W', 'U', 'B', 'R', 'G', 'C'];
  const sorted = [...colors].sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));

  // 単色の場合
  if (sorted.length === 1) {
    const color = getMtgColor(sorted[0]);
    return { borderColor: color.hex };
  }

  // 多色の場合 (グラデーション)
  const stops = sorted.map(c => getMtgColor(c).hex).join(', ');
  return {
    borderImage: `linear-gradient(135deg, ${stops}) 1`,
    borderWidth: '1px',
    borderStyle: 'solid'
  };
};