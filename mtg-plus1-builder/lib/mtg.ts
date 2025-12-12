// src/lib/mtg.ts (または utils/mtg.ts)

// カラー定義
export const MTG_COLORS = [
  { id: 'W', label: '白', class: 'bg-yellow-100 text-yellow-900 border-yellow-200 hover:bg-yellow-200' },
  { id: 'U', label: '青', class: 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600' },
  { id: 'B', label: '黒', class: 'bg-slate-800 text-slate-100 border-slate-900 hover:bg-slate-900' },
  { id: 'R', label: '赤', class: 'bg-red-500 text-white border-red-600 hover:bg-red-600' },
  { id: 'G', label: '緑', class: 'bg-green-600 text-white border-green-700 hover:bg-green-700' },
  { id: 'C', label: '無', class: 'bg-slate-400 text-white border-slate-500 hover:bg-slate-500' },
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