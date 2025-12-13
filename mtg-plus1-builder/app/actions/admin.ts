'use server'

import { db } from '@/lib/firebaseAdmin'
import { revalidatePath } from 'next/cache'

// 全デッキ取得（最新100件）
export async function getAdminDecks() {
  if (!db) return [];

  try {
    const snapshot = await db.collection('decks')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Untitled",
        builderName: data.builderName || "Unknown",
        selectedSet: data.selectedSet || "-",
        language: data.language || "-",
        createdAt: data.createdAt, // ISO string
        editSecret: data.editSecret, // 管理用なので表示してもOK
      };
    });
  } catch (error) {
    console.error("Admin fetch error:", error);
    return [];
  }
}

// デッキ削除機能
export async function deleteDeckAsAdmin(id: string) {
  if (!db) return { success: false };
  
  try {
    await db.collection('decks').doc(id).delete();
    revalidatePath('/admin'); // 画面を更新
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false };
  }
}

// 統計情報の取得（最新500件を分析）
export async function getStats() {
  if (!db) return { 
    total: 0, 
    colorStats: {}, 
    setStats: [] 
  };

  try {
    // 1. 全体の総数だけは正確に取る (countクエリ)
    const countSnapshot = await db.collection('decks').count().get();
    const totalCount = countSnapshot.data().count;

    // 2. 分析用に最新500件を取得
    // (全件取得すると課金コストが増えるため、トレンド分析として直近のデータを使います)
    const analyzeSnapshot = await db.collection('decks')
      .orderBy('createdAt', 'desc')
      .limit(500) 
      .get();

    // 集計用変数の初期化
    const colorCounts: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    const setCounts: Record<string, number> = {};

    analyzeSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // 色の集計
      const colors = data.colors as string[] || [];
      if (colors.length === 0) {
        // 色なし (Colorlessとして扱うか、無視するか。ここではCに加算)
        // colorCounts['C']++; 
      } else {
        colors.forEach(c => {
          if (colorCounts[c] !== undefined) colorCounts[c]++;
        });
      }

      // セットの集計
      const setCode = data.selectedSet;
      if (setCode) {
        setCounts[setCode] = (setCounts[setCode] || 0) + 1;
      }
    });

    // セットを集計数順にソートして配列化
    const sortedSets = Object.entries(setCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // トップ10のみ返す

    return { 
      total: totalCount,
      sampleSize: analyzeSnapshot.size, // 分析対象数
      colorStats: colorCounts,
      setStats: sortedSets
    };

  } catch (error) {
    console.error("Stats error:", error);
    return { total: 0, colorStats: {}, setStats: [] };
  }
}