export type Card = {
  id: string;
  name: string;
  printed_name?: string;
  set: string;
  collector_number: string;
  mana_cost?: string;
  type_line: string;
  image_uris?: {
    normal: string;
    small?: string;
  };
  // 両面カード用データ
  card_faces?: {
    name: string;
    printed_name?: string;
    image_uris?: {
      normal: string;
      small?: string;
    };
    mana_cost?: string;
  }[];
};

export type DeckCard = Card & {
  quantity: number;
};

export const EXPANSIONS = [
  { code: "dsk", name: "ダスクモーン (DSK)" },
  { code: "blb", name: "ブルームバロウ (BLB)" },
  { code: "otj", name: "サンダー・ジャンクション (OTJ)" },
  { code: "mkm", name: "カルロフ邸 (MKM)" },
  { code: "lci", name: "イクサラン：失われし洞窟 (LCI)" },
  { code: "woe", name: "エルドレインの森 (WOE)" },
  { code: "neo", name: "神河：輝ける世界 (NEO)" },
];

export const LANGUAGES = [
  { code: "ja", name: "日本語 (JP)" },
  { code: "en", name: "English (EN)" },
];