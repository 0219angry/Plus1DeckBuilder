export const PATHS = {  
  LOGIN_REQUIRED: "/?login=required",  
  HOME: "/",  
};  

export const QUERY_PARAMS = {  
  LOGIN: "login",  
  REQUIRED: "required",  
};  

export type VisibilityType = 'public' | 'private' | 'limit';

// 視認性ごとのスタイル定義
export const VISIBILITY_STYLES: Record<VisibilityType, string> = {
  public: 'bg-emerald-900/30 border-emerald-700 text-emerald-100',
  private: 'bg-red-900/40 border-red-800 text-red-100',
  limit: 'bg-amber-900/30 border-amber-700 text-amber-100',
};

// 表示ラベル（必要に応じて日本語化などもしやすくなります）
export const VISIBILITY_LABELS: Record<VisibilityType, string> = {
  public: 'Public',
  private: 'Private',
  limit: 'Limited',
};

export const ARCHETYPES_DATA = [
  { id: 'aggro', ja: 'アグロ', en: 'Aggro' },
  { id: 'control', ja: 'コントロール', en: 'Control' },
  { id: 'midrange', ja: 'ミッドレンジ', en: 'Midrange' },
  { id: 'combo', ja: 'コンボ', en: 'Combo' },
  { id: 'ramp', ja: 'ランプ', en: 'Ramp' },
  { id: 'tempo', ja: 'テンポ', en: 'Tempo' },
  { id: 'clock_permission', ja: 'クロック・パーミッション', en: 'Clock Permission' },
  { id: 'reanimate', ja: 'リアニメイト', en: 'Reanimate' },
  { id: 'stompy', ja: 'ストンピィ', en: 'Stompy' },
  { id: 'tokens', ja: 'トークン', en: 'Tokens' },
  { id: 'tribal', ja: '部族', en: 'Tribal' },
  { id: 'burn', ja: 'バーン', en: 'Burn' },
  { id: 'prowess', ja: '果敢', en: 'Prowess' },
  { id: 'sacrifice', ja: 'サクリファイス', en: 'Sacrifice' },
  { id: 'artifacts', ja: 'アーティファクト', en: 'Artifacts' },
  { id: 'enchantments', ja: 'エンチャント', en: 'Enchantments' },
  { id: 'mill', ja: 'ライブラリーアウト', en: 'Mill' },
];