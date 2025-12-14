'use server'

import { db } from '@/lib/firebaseAdmin'
import { revalidatePath } from 'next/cache'
import { firestore } from 'firebase-admin';

export type UserProfile = {
  uid: string;
  customId?: string; // @username
  displayName?: string;
  photoURL?: string;
  twitterUrl?: string;
  noteUrl?: string;
  bio?: string;
  createdAt?: string;
};

/**
 * ★追加: ログイン時に実行し、ユーザーデータを同期・新規判定を行う
 * フロントエンドの AuthProvider (useEffect) から呼び出します。
 */
export async function syncUser(user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }) {
  if (!user.uid) return null;

  try {
    const userRef = db.collection('profiles').doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      // ■ 新規ユーザーの場合
      // 初期データをセット（IDはまだ持っていないので空、またはランダム生成）
      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || "No Name",
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
        // customIdはここでは設定せず、モーダルで設定させるなら undefined のままにする
      };
      
      await userRef.set(newProfile);
      
      // isNew: true を返して、フロント側で「初回設定モーダル」を開かせる
      return { ...newProfile, isNew: true };
    } else {
      // ■ 既存ユーザーの場合
      // Googleのアイコンなどが変わっている場合に備えて更新（任意）
      const currentData = doc.data() as UserProfile;
      
      if (user.photoURL && currentData.photoURL !== user.photoURL) {
        await userRef.update({ photoURL: user.photoURL });
        currentData.photoURL = user.photoURL;
      }

      // isNew: false を返す
      return { ...currentData, isNew: false };
    }
  } catch (error) {
    console.error("Sync User Error:", error);
    return null;
  }
}

/**
 * カスタムIDの登録処理
 * usernamesコレクション（重複チェック用）と profilesコレクション（表示用）の両方を更新します
 */
export async function claimCustomId(userId: string, desiredId: string) {
  // 1. バリデーション
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(desiredId)) {
    return { success: false, message: "IDは半角英数、ハイフン、アンダースコアのみ、3〜20文字で入力してください。" };
  }

  // 予約語
  const reserved = ['admin', 'login', 'register', 'dashboard', 'settings', 'api', 'user'];
  if (reserved.includes(desiredId)) {
    return { success: false, message: "そのIDは使用できません。" };
  }

  try {
    // Transactionを使って「重複チェック」と「書き込み」をアトミックに行うのがベストですが、
    // ここでは読みやすさ重視で Batch を使用します（厳密な同時書き込み競合は稀とする）
    
    const usernameRef = db.collection('usernames').doc(desiredId);
    const profileRef = db.collection('profiles').doc(userId);

    const usernameDoc = await usernameRef.get();

    // 2. すでに使われていないかチェック
    if (usernameDoc.exists) {
      if (usernameDoc.data()?.uid !== userId) {
        return { success: false, message: "すでに使用されているIDです。" };
      }
      // 自分のIDとして登録済みなら、Profile側も念のため更新して終了
      await profileRef.update({ customId: desiredId });
      return { success: true, message: "すでにあなたのIDとして登録されています。" };
    }

    // 3. 以前のIDがあれば usernames から削除する処理が必要
    // 今回は「変更時は古いIDの開放を行わない（または変更不可）」運用と仮定して省略
    // もし変更可能にするなら、先に profileRef から古いIDを取得して delete する必要があります。

    // 4. 書き込み実行
    const batch = db.batch();

    // usernamesコレクションに登録（ID -> UID の検索用）
    batch.set(usernameRef, {
      uid: userId,
      createdAt: new Date().toISOString()
    });

    // profilesコレクションにもIDを記録（画面表示用）
    batch.update(profileRef, {
      customId: desiredId
    });

    await batch.commit();

    // キャッシュ更新
    revalidatePath(`/user/${userId}`);
    revalidatePath('/dashboard');

    return { success: true, message: "IDを取得しました！" };

  } catch (error) {
    console.error(error);
    return { success: false, message: "エラーが発生しました。" };
  }
}

// IDからUIDを逆引きする関数
export async function getUidByCustomId(customId: string): Promise<string | null> {
  const doc = await db.collection('usernames').doc(customId).get();
  if (doc.exists) {
    return doc.data()?.uid || null;
  }
  // 見つからない場合、それが直接UIDである可能性も考慮（古いリンク互換性など）
  return customId; 
}

// プロフィールの更新
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  if (!uid) return { success: false, message: "Unauthorized" };

  try {
    await db.collection('profiles').doc(uid).set(data, { merge: true });
    
    revalidatePath('/dashboard'); // 自分のダッシュボード
    revalidatePath(`/user/${uid}`); // 公開ページ
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
    console.error("Get Profile Error:", error);
    return null;
  }
}