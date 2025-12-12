import { DeckCard } from "@/types"; // ← ここが重要：既存の型定義をインポート

export type TurnMove = {
  id: string;
  turn: string;
  action: string;
}

// LocalStorageおよびDBに保存するデータ本体
export type DeckData = {
  name: string;
  builderName?: string;
  
  // 独自定義ではなく、インポートしたDeckCard型を使う
  cards: DeckCard[];
  sideboard: DeckCard[];
  
  selectedSet: string;
  language: string;
  keyCardIds: string[];
  colors: string[];
  archetype?: string;
  concepts?: string;
  turnMoves: TurnMove[];
  updatedAt: string; // ISO String
}

// サーバーからクライアントに返す際のレスポンス型
export type DeckResponse = DeckData & {
  id: string; // FirestoreのドキュメントID
  isOwner?: boolean; // 編集権限があるかどうか
}