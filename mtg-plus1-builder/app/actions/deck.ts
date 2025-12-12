'use server'

import { db } from '@/lib/firebaseAdmin' // 前回の設定を利用
import { v4 as uuidv4 } from 'uuid'
import { DeckData, DeckResponse } from '@/types/deck'

// ■ 新規保存 (Create)
export async function createDeck(data: DeckData) {
  const editSecret = uuidv4() // 編集用パスワード生成

  // Firestoreに保存するオブジェクト
  const firestoreData = {
    ...data, // LocalStorageの中身を全て展開
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

  if (currentData?.editSecret !== secretKey) {
    throw new Error('Unauthorized: Invalid edit key')
  }

  const updatePayload = {
    ...data,
    updatedAt: new Date().toISOString(),
  }
  
  const cleanPayload = JSON.parse(JSON.stringify(updatePayload))

  await docRef.update(cleanPayload)
  
  return { success: true }
}