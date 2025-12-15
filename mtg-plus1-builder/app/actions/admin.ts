'use server'

import { db } from '@/lib/firebaseAdmin'
import { revalidatePath } from 'next/cache'


export type StatItem = {
  key: string;
  count: number;
};

// 全体の統計データの型
export type DashboardStats = {
  total: number;
  sampleSize: number;
  strategyStats: StatItem[];   // ★変更: アグロ/コントロール等の集計
  colorComboStats: StatItem[]; // ★変更: 色の組み合わせ (UB, RGW...)
  colorStats: StatItem[];      // 単色 (U, B, R...)
  setStats: StatItem[];        // セット
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

export async function getStats(): Promise<DashboardStats> {
  if (!db) return { 
    total: 0, sampleSize: 0, 
    strategyStats: [], colorComboStats: [], colorStats: [], setStats: [] 
  };

  try {
    const countSnapshot = await db.collection('decks').count().get();
    const totalCount = countSnapshot.data().count;

    const analyzeSnapshot = await db.collection('decks')
      .orderBy('createdAt', 'desc')
      .limit(500) 
      .get();

    // 集計用オブジェクト
    const strategyCounts: Record<string, number> = {}; // アグロなど
    const comboCounts: Record<string, number> = {};    // 色合わせ
    const colorCounts: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    const setCounts: Record<string, number> = {};
    
    const sortOrder = ['W', 'U', 'B', 'R', 'G', 'C'];

    analyzeSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // 1. アーキタイプ（戦略）の集計
      // DBのカラム名が 'archetype' だと仮定しています
      const strategyKey = data.archetype || 'unknown'; 
      strategyCounts[strategyKey] = (strategyCounts[strategyKey] || 0) + 1;

      // 2. 色の集計
      const colors = (data.colors as string[] || []);
      const setCode = data.selectedSet;

      // 色の組み合わせ (Color Combo)
      const sortedCombo = colors
        .sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b))
        .join('');
      const comboKey = sortedCombo === '' ? 'C' : sortedCombo;
      comboCounts[comboKey] = (comboCounts[comboKey] || 0) + 1;

      // 単色 (Color Frequency)
      if (colors.length === 0) {
        colorCounts['C']++;
      } else {
        const uniqueColors = Array.from(new Set(colors));
        uniqueColors.forEach(c => {
          if (colorCounts[c] !== undefined) colorCounts[c]++;
        });
      }

      // セット集計
      if (setCode) {
        setCounts[setCode] = (setCounts[setCode] || 0) + 1;
      }
    });

    const toSortedArray = (record: Record<string, number>): StatItem[] => {
      return Object.entries(record)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
    };

    return { 
      total: totalCount,
      sampleSize: analyzeSnapshot.size,
      strategyStats: toSortedArray(strategyCounts), // アグロ等
      colorComboStats: toSortedArray(comboCounts),  // 色組み合わせ
      colorStats: toSortedArray(colorCounts),       // 単色頻度
      setStats: toSortedArray(setCounts)            // セット
    };

  } catch (error) {
    console.error("Stats error:", error);
    return { total: 0, sampleSize: 0, strategyStats:[], colorComboStats: [], colorStats: [], setStats: [] };
  }
}