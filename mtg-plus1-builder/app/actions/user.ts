'use server'

import { db } from '@/lib/firebaseAdmin'
import { revalidatePath } from 'next/cache'

export type UserProfile = {
  uid: string;
  customId?: string;
  displayName?: string;
  twitterUrl?: string;
  noteUrl?: string;
  bio?: string; // 一言コメント
};

// カスタムIDの登録処理
export async function claimCustomId(userId: string, desiredId: string) {
  // 1. バリデーション（半角英数、3文字以上など）
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(desiredId)) {
    return { success: false, message: "IDは半角英数、ハイフン、アンダースコアのみ、3〜20文字で入力してください。" };
  }

  // 予約語の禁止（システムのパスと被らないように）
  const reserved = ['admin', 'login', 'register', 'dashboard', 'settings'];
  if (reserved.includes(desiredId)) {
    return { success: false, message: "そのIDは使用できません。" };
  }

  try {
    const docRef = db.collection('usernames').doc(desiredId);

    // 2. すでに使われていないかチェック
    const doc = await docRef.get();
    if (doc.exists) {
      // 自分のIDならOKだが、他人のならNG
      if (doc.data()?.uid !== userId) {
        return { success: false, message: "すでに使用されているIDです。" };
      }
      return { success: true, message: "すでにあなたのIDとして登録されています。" };
    }

    // 3. 以前のIDがあれば削除する処理が必要ですが、
    //    今回はシンプルにするため「一度決めたら変更不可」または「追加登録」とします。
    //    (厳密にやるなら、User側にも現在のcustomIdを持たせて管理します)

    // 4. 保存: ドキュメントIDを「希望ID」にする
    await docRef.set({
      uid: userId,
      createdAt: new Date().toISOString()
    });

    return { success: true, message: "IDを取得しました！" };

  } catch (error) {
    console.error(error);
    return { success: false, message: "エラーが発生しました。" };
  }
}

// IDからUIDを逆引きする関数（ページ表示用）
export async function getUidByCustomId(customId: string): Promise<string | null> {
  // 1. まず usernames コレクションを探す
  const doc = await db.collection('usernames').doc(customId).get();
  if (doc.exists) {
    return doc.data()?.uid || null;
  }
  
  // 2. 見つからない場合、それが直接 UID である可能性も考慮してチェック
  //    (古いURLも有効にするため)
  //    ただし、UIDかどうかの厳密なチェックは難しいので、
  //    「カスタムIDが見つからなければ、そのまま返す」という戦略をとります。
  return customId; 
}

// プロフィールの更新
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  if (!uid) return { success: false, message: "Unauthorized" };

  try {
    // profilesコレクションに保存（usernamesとは分けるのが一般的ですが、今回は簡単のため統合管理も可。ここではprofiles推奨）
    await db.collection('profiles').doc(uid).set(data, { merge: true });
    
    // customIdがある場合は usernames コレクションも更新が必要ですが、
    // 前回の claimCustomId 関数で管理しているためここでは省略します
    
    revalidatePath('/my-decks');
    revalidatePath(`/user/${uid}`); // 自分のページ
    return { success: true };
  } catch (error) {
    console.error("Profile Update Error:", error);
    return { success: false, message: "保存に失敗しました" };
  }
}

// プロフィールの取得
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const doc = await db.collection('profiles').doc(uid).get();
    if (doc.exists) {
      return doc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    return null;
  }
}