'use server'

import { db } from '@/lib/firebaseAdmin' // 前回の設定を利用
import { v4 as uuidv4 } from 'uuid'
import { DeckData, DeckResponse } from '@/types/deck'
import { minifyDeckCards } from '@/lib/utils'

// ■ 新規保存 (Create)
export async function createDeck(data: DeckData) {
  const editSecret = uuidv4() // 編集用パスワード生成

  const minifiedCards = minifyDeckCards(data.cards);
  const minifiedSideboard = minifyDeckCards(data.sideboard);

  // Firestoreに保存するオブジェクト
  const firestoreData = {
    ...data, // LocalStorageの中身を全て展開
    userId: data.userId || null,
    cards: minifiedCards,
    sideboard: minifiedSideboard,
    editSecret, // 閲覧者には見せない重要データ
    createdAt: new Date().toISOString(),
  }

  // undefinedなフィールドがあるとFirestoreがエラーを吐くため、念の為サニタイズ
  const cleanData = JSON.parse(JSON.stringify(firestoreData))

  const docRef = await db.collection('decks').add(cleanData)

  return {
    success: true,
    viewUrl: `/deck/${docRef.id}`,
    editUrl: `/deck/${docRef.id}/edit?key=${editSecret}`,
  }
}

// ■ 閲覧用データ取得 (Get)
export async function getDeck(id: string): Promise<DeckResponse | null> {
  // ★追加: IDがない、または空文字の場合は Firestore に問い合わせず null を返す
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  // dbが初期化されていない場合のガード（前回の修正済みならOK）
  if (!db) return null;

  try {
    const doc = await db.collection('decks').doc(id).get()

    if (!doc.exists) return null

    const data = doc.data() as any

    // editSecret を削除してクライアントに返す
    const { editSecret, ...safeData } = data

    return {
      id: doc.id,
      ...safeData,
    } as DeckResponse
  } catch (error) {
    console.error("getDeck error:", error);
    return null;
  }
}

// ■ 更新保存 (Update)
export async function updateDeck(id: string, secretKey: string, data: DeckData) {
  // ★追加: IDチェック
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid Deck ID');
  }
  
  if (!db) throw new Error('Database connection failed');

  const docRef = db.collection('decks').doc(id)
  const doc = await docRef.get()

  if (!doc.exists) {
    throw new Error('Deck not found')
  }

  const currentData = doc.data()

  const isKeyMatch = secretKey && currentData?.editSecret === secretKey;

  const isOwner = data.userId && currentData?.userId === data.userId;

  if (!isKeyMatch && !isOwner) {
    throw new Error('Unauthorized: 編集権限がありません')
  }

  const minifiedCards = minifyDeckCards(data.cards);
  const minifiedSideboard = minifyDeckCards(data.sideboard);

  const updatePayload = {
    ...data,
    cards: minifiedCards,
    sideboard: minifiedSideboard,
    updatedAt: new Date().toISOString(),
  }
  
  const cleanPayload = JSON.parse(JSON.stringify(updatePayload))

  await docRef.update(cleanPayload)
  
  return { success: true }
}

export async function getMyDecks(userId: string) {
  if (!userId) return [];
  
  try {
    const snapshot = await db.collection('decks')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Untitled",
        selectedSet: data.selectedSet,
        language: data.language,
        createdAt: data.createdAt,
        // 色情報があれば取得
        colors: data.colors || [], 
        // 編集キーも返す（編集ボタン用）
        editSecret: data.editSecret, 
      };
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    // ※インデックス未作成エラーの場合があるため、コンソールを確認してください
    return [];
  }
}

// デッキ削除関数（自分のデッキ削除用）
export async function deleteMyDeck(deckId: string, userId: string) {
  try {
    const docRef = db.collection('decks').doc(deckId);
    const doc = await docRef.get();
    
    // 所有権チェック
    if (doc.data()?.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await docRef.delete();
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false };
  }
}

// 特定ユーザーの公開デッキ一覧を取得（editSecretは返さない）
export async function getUserPublicDecks(userId: string) {
  if (!userId) return [];

  try {
    const snapshot = await db.collection('decks')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50) // 大量にあると重いので制限
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Untitled",
        selectedSet: data.selectedSet || "-",
        language: data.language || "-",
        createdAt: data.createdAt,
        builderName: data.builderName || "Unknown Builder",
        colors: data.colors || [],
        archetype: data.archetype || "",
        // ★重要: editSecret は返さない！
      };
    });
  } catch (error) {
    console.error("Public Fetch Error:", error);
    return [];
  }
}