export type DeckCard = {
  // 実際のカードデータの型定義に合わせて調整してください
  id: string;
  name: string;
  count: number;
  // ...その他必要なプロパティ
}

export type TurnMove = {
  id: string;
  turn: string;
  action: string;
}

// LocalStorageおよびDBに保存するデータ本体
export type DeckData = {
  name: string;
  builderName?: string;
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
  isOwner?: boolean; // 編集権限があるかどうか（フロントでの判定用）
}