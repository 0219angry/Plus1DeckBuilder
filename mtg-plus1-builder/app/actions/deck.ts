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
  const doc = await db.collection('decks').doc(id).get()

  if (!doc.exists) return null

  const data = doc.data() as any

  // 重要: editSecret を削除してクライアントに返す
  const { editSecret, ...safeData } = data

  return {
    id: doc.id,
    ...safeData,
  } as DeckResponse
}

// ■ 更新保存 (Update)
export async function updateDeck(id: string, secretKey: string, data: DeckData) {
  const docRef = db.collection('decks').doc(id)
  const doc = await docRef.get()

  if (!doc.exists) {
    throw new Error('Deck not found')
  }

  const currentData = doc.data()

  // 認証: DBのシークレットと、URLから渡されたキーを比較
  if (currentData?.editSecret !== secretKey) {
    throw new Error('Unauthorized: Invalid edit key')
  }

  const updatePayload = {
    ...data,
    updatedAt: new Date().toISOString(),
  }
  
  // undefined対策
  const cleanPayload = JSON.parse(JSON.stringify(updatePayload))

  await docRef.update(cleanPayload)
  
  return { success: true }
}