export type Card = {
  id: string;
  name: string;
  printed_name?: string;
  set: string;
  collector_number: string;
  image_uris?: {
    normal: string;
    small: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  card_faces?: {
    name: string;
    printed_name?: string;
    image_uris?: {
      normal: string;
    };
    mana_cost?: string;
    type_line?: string;
  }[];
  mana_cost?: string;
  cmc?: number;
  type_line: string;
  lang: string;
  full_art?: boolean; 
};

export type DeckCard = Card & {
  quantity: number;
};

// エキスパンション情報の型定義（日/英対応）
export type Expansion = {
  code: string;
  name_en: string;
  name_ja: string;
};

export const LANGUAGES = [
  { code: "ja", name: "Japanese" },
  { code: "en", name: "English" },
];

// デフォルトのエキスパンションリスト
export const EXPANSIONS: Expansion[] = [
  { code: "fdn", name_en: "Foundations", name_ja: "ファウンデーションズ" },
  { code: "dsk", name_en: "Duskmourn: House of Horror", name_ja: "ダスクモーン：戦慄の館" },
  { code: "blb", name_en: "Bloomburrow", name_ja: "ブルームバロウ" },
  { code: "mh3", name_en: "Modern Horizons 3", name_ja: "モダンホライゾン3" },
  { code: "otj", name_en: "Outlaws of Thunder Junction", name_ja: "サンダー・ジャンクションの無法者" },
  { code: "mkm", name_en: "Murders at Karlov Manor", name_ja: "カルロフ邸殺人事件" },
  { code: "lci", name_en: "The Lost Caverns of Ixalan", name_ja: "イクサラン：失われし洞窟" },
  { code: "woe", name_en: "Wilds of Eldraine", name_ja: "エルドレインの森" },
  { code: "mom", name_en: "March of the Machine", name_ja: "機械兵団の進軍" },
  { code: "one", name_en: "Phyrexia: All Will Be One", name_ja: "ファイレクシア：完全なる統一" },
  { code: "bro", name_en: "The Brothers' War", name_ja: "兄弟戦争" },
  { code: "dmu", name_en: "Dominaria United", name_ja: "団結のドミナリア" },
  { code: "snc", name_en: "Streets of New Capenna", name_ja: "ニューカペナの街角" },
  { code: "neo", name_en: "Kamigawa: Neon Dynasty", name_ja: "神河：輝ける世界" },
  { code: "vow", name_en: "Innistrad: Crimson Vow", name_ja: "イニストラード：真紅の契り" },
  { code: "mid", name_en: "Innistrad: Midnight Hunt", name_ja: "イニストラード：真夜中の狩り" },
  { code: "afr", name_en: "Adventures in the Forgotten Realms", name_ja: "フォーゴトン・レルム探訪" },
  { code: "stx", name_en: "Strixhaven: School of Mages", name_ja: "ストリクスヘイヴン：魔法学院" },
  { code: "khm", name_en: "Kaldheim", name_ja: "カルドハイム" },
  { code: "znr", name_en: "Zendikar Rising", name_ja: "ゼンディカーの夜明け" },
  { code: "m21", name_en: "Core Set 2021", name_ja: "基本セット2021" },
  { code: "iko", name_en: "Ikoria: Lair of Behemoths", name_ja: "イコリア：巨獣の棲処" },
  { code: "thb", name_en: "Theros Beyond Death", name_ja: "テーロス還魂記" },
  { code: "eld", name_en: "Throne of Eldraine", name_ja: "エルドレインの王権" },
  { code: "war", name_en: "War of the Spark", name_ja: "灯争大戦" },
  { code: "rna", name_en: "Ravnica Allegiance", name_ja: "ラヴニカの献身" },
  { code: "grn", name_en: "Guilds of Ravnica", name_ja: "ラヴニカのギルド" },
  { code: "dom", name_en: "Dominaria", name_ja: "ドミナリア" },
  { code: "xln", name_en: "Ixalan", name_ja: "イクサラン" },
];