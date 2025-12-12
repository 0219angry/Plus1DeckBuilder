import { DeckCard } from "@/types";

// 保存用に不要なデータを削ぎ落とす関数
export function minifyDeckCards(cards: DeckCard[]): any[] {
  return cards.map(card => ({
    // 必須ID
    id: card.id,
    oracle_id: card.oracle_id,
    
    // ユーザー設定値
    quantity: card.quantity,
    
    // 表示・分析に必須なデータのみ残す
    name: card.name,
    printed_name: card.printed_name, // 日本語名用
    set: card.set,
    collector_number: card.collector_number,
    image_uris: {
      normal: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal
    },
    mana_cost: card.mana_cost || card.card_faces?.[0]?.mana_cost,
    cmc: card.cmc,
    type_line: card.type_line || card.card_faces?.[0]?.type_line,
    rarity: card.rarity,
    
    // 以下は削除（保存しない）
    // legalities, games, reserved, foil, nonfoil, oversized, promo, 
    // reprint, variation, set_id, set_type, set_uri, ...など大量の不要データ
  }));
}