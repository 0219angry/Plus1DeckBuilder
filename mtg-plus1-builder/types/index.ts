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
    art_crop: string; // 背景用に追加
    border_crop: string;
  };
  card_faces?: {
    name: string;
    printed_name?: string;
    image_uris?: {
      normal: string;
      art_crop?: string; // 両面カードの背景用
    };
    mana_cost?: string;
    type_line?: string;
  }[];
  mana_cost?: string;
  cmc?: number;
  type_line: string;
  lang: string;
  full_art?: boolean;
  rarity: string; // 【追加】common, uncommon, rare, mythic
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

// 基本セット2010(M10)以降の基本セット + 全てのスタンダード経由エキスパンション
export const EXPANSIONS: Expansion[] = [
  // --- 特殊セット・最新セット ---
  { code: "tla", name_en: "Avatar: The Last Airbender", name_ja: "アバター 伝説の少年アン" },
  { code: "fdn", name_en: "Foundations", name_ja: "ファウンデーションズ" },
  
  // --- Standard Sets (Modern Era - Current) ---
  { code: "spm", name_en: "Marvel's Spider-Man", name_ja: "マーベル スパイダーマン" },
  { code: "eoe", name_en: "Edge of Eternities", name_ja: "久遠の終端" },
  { code: "fin", name_en: "FINAL FANTASY™", name_ja: "FINAL FANTASY™" },
  { code: "tdm", name_en: "Tarkir: Dragonstorm", name_ja: "タルキール：龍嵐録" },
  { code: "dft", name_en: "Aetherdrift", name_ja: "霊気走破" },
  { code: "dsk", name_en: "Duskmourn: House of Horror", name_ja: "ダスクモーン：戦慄の館" },
  { code: "blb", name_en: "Bloomburrow", name_ja: "ブルームバロウ" },
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
  { code: "m20", name_en: "Core Set 2020", name_ja: "基本セット2020" },
  { code: "war", name_en: "War of the Spark", name_ja: "灯争大戦" },
  { code: "rna", name_en: "Ravnica Allegiance", name_ja: "ラヴニカの献身" },
  { code: "grn", name_en: "Guilds of Ravnica", name_ja: "ラヴニカのギルド" },
  { code: "m19", name_en: "Core Set 2019", name_ja: "基本セット2019" },
  { code: "dom", name_en: "Dominaria", name_ja: "ドミナリア" },
  { code: "rix", name_en: "Rivals of Ixalan", name_ja: "イクサランの相克" },
  { code: "xln", name_en: "Ixalan", name_ja: "イクサラン" },
  { code: "hou", name_en: "Hour of Devastation", name_ja: "破滅の刻" },
  { code: "akh", name_en: "Amonkhet", name_ja: "アモンケット" },
  { code: "aer", name_en: "Aether Revolt", name_ja: "霊気紛争" },
  { code: "kld", name_en: "Kaladesh", name_ja: "カラデシュ" },
  { code: "emn", name_en: "Eldritch Moon", name_ja: "異界月" },
  { code: "soi", name_en: "Shadows over Innistrad", name_ja: "イニストラードを覆う影" },
  { code: "ogw", name_en: "Oath of the Gatewatch", name_ja: "ゲートウォッチの誓い" },
  { code: "bfz", name_en: "Battle for Zendikar", name_ja: "戦乱のゼンディカー" },
  { code: "ori", name_en: "Magic Origins", name_ja: "マジック・オリジン" },
  { code: "dtk", name_en: "Dragons of Tarkir", name_ja: "タルキール龍紀伝" },
  { code: "frf", name_en: "Fate Reforged", name_ja: "運命再編" },
  { code: "ktk", name_en: "Khans of Tarkir", name_ja: "タルキール覇王譚" },
  { code: "m15", name_en: "Magic 2015", name_ja: "基本セット2015" },
  { code: "jou", name_en: "Journey into Nyx", name_ja: "ニクスへの旅" },
  { code: "bng", name_en: "Born of the Gods", name_ja: "神々の軍勢" },
  { code: "ths", name_en: "Theros", name_ja: "テーロス" },
  { code: "m14", name_en: "Magic 2014", name_ja: "基本セット2014" },
  { code: "dgm", name_en: "Dragon's Maze", name_ja: "ドラゴンの迷路" },
  { code: "gtc", name_en: "Gatecrash", name_ja: "ギルド門侵犯" },
  { code: "rtr", name_en: "Return to Ravnica", name_ja: "ラヴニカへの回帰" },
  { code: "m13", name_en: "Magic 2013", name_ja: "基本セット2013" },
  { code: "avr", name_en: "Avacyn Restored", name_ja: "アヴァシンの帰還" },
  { code: "dka", name_en: "Dark Ascension", name_ja: "闇の隆盛" },
  { code: "isd", name_en: "Innistrad", name_ja: "イニストラード" },
  { code: "m12", name_en: "Magic 2012", name_ja: "基本セット2012" },
  { code: "nph", name_en: "New Phyrexia", name_ja: "新たなるファイレクシア" },
  { code: "mbs", name_en: "Mirrodin Besieged", name_ja: "ミラディン包囲戦" },
  { code: "som", name_en: "Scars of Mirrodin", name_ja: "ミラディンの傷跡" },
  { code: "m11", name_en: "Magic 2011", name_ja: "基本セット2011" },
  { code: "roe", name_en: "Rise of the Eldrazi", name_ja: "エルドラージ覚醒" },
  { code: "wwk", name_en: "Worldwake", name_ja: "ワールドウェイク" },
  { code: "zen", name_en: "Zendikar", name_ja: "ゼンディカー" },
  { code: "m10", name_en: "Magic 2010", name_ja: "基本セット2010" },
  
  // --- Old Standard Blocks (Legacy Era) ---
  { code: "arb", name_en: "Alara Reborn", name_ja: "アラーラ再誕" },
  { code: "con", name_en: "Conflux", name_ja: "コンフラックス" },
  { code: "ala", name_en: "Shards of Alara", name_ja: "アラーラの断片" },
  { code: "eve", name_en: "Eventide", name_ja: "イーブンタイド" },
  { code: "shm", name_en: "Shadowmoor", name_ja: "シャドウムーア" },
  { code: "mor", name_en: "Morningtide", name_ja: "モーニングタイド" },
  { code: "lrw", name_en: "Lorwyn", name_ja: "ローウィン" },
  { code: "fut", name_en: "Future Sight", name_ja: "未来予知" },
  { code: "plc", name_en: "Planar Chaos", name_ja: "次元の混乱" },
  { code: "tsp", name_en: "Time Spiral", name_ja: "時のらせん" },
  { code: "csp", name_en: "Coldsnap", name_ja: "コールドスナップ" },
  { code: "dis", name_en: "Dissension", name_ja: "ディセンション" },
  { code: "gpt", name_en: "Guildpact", name_ja: "ギルドパクト" },
  { code: "rav", name_en: "Ravnica: City of Guilds", name_ja: "ラヴニカ：ギルドの都" },
  { code: "sok", name_en: "Saviors of Kamigawa", name_ja: "神河救済" },
  { code: "bok", name_en: "Betrayers of Kamigawa", name_ja: "神河謀叛" },
  { code: "chk", name_en: "Champions of Kamigawa", name_ja: "神河物語" },
  { code: "5dn", name_en: "Fifth Dawn", name_ja: "フィフス・ドーン" },
  { code: "dst", name_en: "Darksteel", name_ja: "ダークスティール" },
  { code: "mrd", name_en: "Mirrodin", name_ja: "ミラディン" },
  { code: "scg", name_en: "Scourge", name_ja: "スカージ" },
  { code: "lgn", name_en: "Legions", name_ja: "レギオン" },
  { code: "ons", name_en: "Onslaught", name_ja: "オンスロート" },
  { code: "jud", name_en: "Judgment", name_ja: "ジャッジメント" },
  { code: "tor", name_en: "Torment", name_ja: "トーメント" },
  { code: "ody", name_en: "Odyssey", name_ja: "オデッセイ" },
  { code: "apc", name_en: "Apocalypse", name_ja: "アポカリプス" },
  { code: "pls", name_en: "Planeshift", name_ja: "プレーンシフト" },
  { code: "inv", name_en: "Invasion", name_ja: "インベイジョン" },
  { code: "pcy", name_en: "Prophecy", name_ja: "プロフェシー" },
  { code: "nem", name_en: "Nemesis", name_ja: "ネメシス" },
  { code: "mmq", name_en: "Mercadian Masques", name_ja: "メルカディアン・マスクス" },
  { code: "uds", name_en: "Urza's Destiny", name_ja: "ウルザズ・デスティニー" },
  { code: "ulg", name_en: "Urza's Legacy", name_ja: "ウルザズ・レガシー" },
  { code: "usg", name_en: "Urza's Saga", name_ja: "ウルザズ・サーガ" },
  { code: "exo", name_en: "Exodus", name_ja: "エクソダス" },
  { code: "sth", name_en: "Stronghold", name_ja: "ストロングホールド" },
  { code: "tmp", name_en: "Tempest", name_ja: "テンペスト" },
  { code: "wth", name_en: "Weatherlight", name_ja: "ウェザーライト" },
  { code: "vis", name_en: "Visions", name_ja: "ビジョンズ" },
  { code: "mir", name_en: "Mirage", name_ja: "ミラージュ" },
  { code: "all", name_en: "Alliances", name_ja: "アライアンス" },
  { code: "hml", name_en: "Homelands", name_ja: "ホームランド" },
  { code: "ice", name_en: "Ice Age", name_ja: "アイスエイジ" },
  { code: "fem", name_en: "Fallen Empires", name_ja: "フォールン・エンパイア" },
  { code: "drk", name_en: "The Dark", name_ja: "ザ・ダーク" },
  { code: "leg", name_en: "Legends", name_ja: "レジェンド" },
  { code: "atq", name_en: "Antiquities", name_ja: "アンティキティー" },
  { code: "arn", name_en: "Arabian Nights", name_ja: "アラビアンナイト" },
];