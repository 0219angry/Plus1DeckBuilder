'use server'

import { db } from '@/lib/firebaseAdmin'
import { revalidatePath } from 'next/cache'

// 統計データの型定義
export type ArchetypeStat = {
  key: string;
  count: number;
  label: string;
};

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
    archetypeStats: [], // 配列に変更（グラフ表示用）
    setStats: [] 
  };

  try {
    // 1. 全体の総数
    const countSnapshot = await db.collection('decks').count().get();
    const totalCount = countSnapshot.data().count;

    // 2. 分析用に最新500件を取得
    const analyzeSnapshot = await db.collection('decks')
      .orderBy('createdAt', 'desc')
      .limit(500) 
      .get();

    // ★修正: キーを色の組み合わせにする
    const comboCounts: Record<string, number> = {};
    const setCounts: Record<string, number> = {};
    
    // WUBRG順に並べるための配列
    const sortOrder = ['W', 'U', 'B', 'R', 'G', 'C'];

    analyzeSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // ★修正: 色ごとのループではなく、配列をソートして結合し「キー」を作る
      const colors = (data.colors as string[] || []);
      
      const sortedColors = colors
        .sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b))
        .join('');
      
      // 色なしは 'C'、それ以外は 'WU', 'UB' などの文字列になる
      const key = sortedColors === '' ? 'C' : sortedColors;
      
      // そのキー（組み合わせ）をカウント
      comboCounts[key] = (comboCounts[key] || 0) + 1;

      // セットの集計 (変更なし)
      const setCode = data.selectedSet;
      if (setCode) {
        setCounts[setCode] = (setCounts[setCode] || 0) + 1;
      }
    });

    // ★修正: フロントエンドで扱いやすいように配列に変換してソート
    const sortedArchetypes = Object.entries(comboCounts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

    // セットを集計数順にソート
    const sortedSets = Object.entries(setCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { 
      total: totalCount,
      sampleSize: analyzeSnapshot.size,
      archetypeStats: sortedArchetypes, // ここが変わりました
      setStats: sortedSets
    };

  } catch (error) {
    console.error("Stats error:", error);
    return { total: 0, archetypeStats: [], setStats: [] };
  }
}

export async function getArchetypeStats(): Promise<ArchetypeStat[]> {
  try {
    // colorsフィールドだけを取得することで転送量を削減（読み取り回数はドキュメント数分かかります）
    const snapshot = await db
      .collection('decks')
      .select('colors') 
      .get();

    const comboStats: Record<string, number> = {};
    const sortOrder = ['W', 'U', 'B', 'R', 'G', 'C'];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // データが存在しない、または配列でない場合のガード
      const colors: string[] = Array.isArray(data.colors) ? data.colors : [];

      // WUBRG順にソートしてキー化 (例: ['U', 'W'] -> "WU")
      const sortedColors = colors
        .sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b))
        .join('');

      // 色がない、または空文字の場合は 'C' (Colorless)
      const key = sortedColors === '' ? 'C' : sortedColors;

      comboStats[key] = (comboStats[key] || 0) + 1;
    });

    // 件数順にソートして配列化
    const sortedStats = Object.entries(comboStats)
      .map(([key, count]) => ({
        key,
        count,
        label: key, // 必要に応じて表示名変換関数を通す
      }))
      .sort((a, b) => b.count - a.count);

    return sortedStats;

  } catch (error) {
    console.error('Failed to fetch archetype stats:', error);
    return [];
  }
}