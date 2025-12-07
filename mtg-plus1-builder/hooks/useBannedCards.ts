import { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc
} from "firebase/firestore";
import { 
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from "firebase/auth";

export type BannedCardItem = {
  name: string;
  reason?: string;
};

export type BannedCardsMap = Record<string, BannedCardItem[]>;

// --- 設定値読み込み ---
const getFirebaseConfig = () => {
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    try { return JSON.parse((window as any).__firebase_config); } catch (e) { console.error(e); }
  }
  return process.env.NEXT_PUBLIC_FIREBASE_CONFIG ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) : {};
};

const getAppId = () => {
  if (typeof window !== 'undefined' && (window as any).__app_id) { return (window as any).__app_id; }
  return process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
};

// --- Firebase初期化 ---
let app: any;
let db: any;
let auth: any;

const firebaseConfig = getFirebaseConfig();
const appId = getAppId();

if (typeof window !== "undefined" && Object.keys(firebaseConfig).length > 0) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase init error:", e);
  }
}

// --- キャッシュキー ---
const CACHE_KEY = "mtg-plus1-banned-cards-cache";

export function useBannedCards() {
  const [bannedMap, setBannedMap] = useState<BannedCardsMap>({});
  const [loading, setLoading] = useState(true);

  // Firestoreパス
  const getDocRef = () => {
    if (!db) return null;
    return doc(db, 'artifacts', appId, 'public', 'data', 'config_banned', 'list');
  };

  useEffect(() => {
    // 1. まずローカルキャッシュがあれば即表示（Loading時間をゼロにする）
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setBannedMap(JSON.parse(cached));
        setLoading(false); // キャッシュがあればロード完了とする
      } catch (e) { console.error("Cache parse error", e); }
    }

    if (!db || !auth) {
      console.warn("Firebase not configured.");
      setLoading(false);
      return;
    }

    let unsubscribeSnapshot: () => void;

    // 2. 認証とデータ同期を開始
    const init = async () => {
      // 既にログイン済みなら再ログインをスキップ（高速化）
      if (!auth.currentUser) {
        try {
          if ((window as any).__initial_auth_token) {
             await signInWithCustomToken(auth, (window as any).__initial_auth_token);
          } else {
             await signInAnonymously(auth);
          }
        } catch (e) {
          console.error("Auth error:", e);
          return;
        }
      }

      const docRef = getDocRef();
      if (!docRef) return;

      // リアルタイムリスナー
      unsubscribeSnapshot = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as BannedCardsMap;
          setBannedMap(data);
          // 最新データをキャッシュに保存
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } else {
          setDoc(docRef, {}, { merge: true }).catch(e => console.error(e));
          setBannedMap({});
        }
        setLoading(false);
      }, (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      });
    };

    // 認証状態の監視（SDKの初期化待ち）
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 既にユーザーがいる場合は即init（再ログイン処理をスキップできる）
        init(); 
      } else {
        // 未ログインならinit内でログイン試行
        init();
      }
    });

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // --- 追加機能 ---
  const addBannedCard = async (setCode: string, name: string, reason: string = "") => {
    if (!db) return;
    const docRef = getDocRef();
    if (!docRef) return;

    try {
      const snap = await getDoc(docRef);
      const currentMap = snap.exists() ? (snap.data() as BannedCardsMap) : {};
      const currentList = currentMap[setCode] || [];
      
      if (currentList.some(c => c.name === name)) {
        alert("既に登録されています");
        return;
      }

      const newList = [...currentList, { name, reason }];
      const newData = { ...currentMap, [setCode]: newList };
      
      // 先行してStateとキャッシュを更新（体感速度向上）
      setBannedMap(newData);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newData));

      await setDoc(docRef, { [setCode]: newList }, { merge: true });
    } catch (e) {
      console.error("Failed to add ban:", e);
      alert("登録に失敗しました");
      // 失敗したらロールバック（リスナーが正しいデータに戻してくれるので放置でも可）
    }
  };

  // --- 削除機能 ---
  const removeBannedCard = async (setCode: string, name: string) => {
    if (!db) return;
    const docRef = getDocRef();
    if (!docRef) return;

    try {
      const snap = await getDoc(docRef);
      const currentMap = snap.exists() ? (snap.data() as BannedCardsMap) : {};
      const currentList = currentMap[setCode] || [];
      const newList = currentList.filter(c => c.name !== name);
      const newData = { ...currentMap, [setCode]: newList };

      // 先行更新
      setBannedMap(newData);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newData));

      await setDoc(docRef, { [setCode]: newList }, { merge: true });
    } catch (e) {
      console.error("Failed to remove ban:", e);
      alert("削除に失敗しました");
    }
  };

  return { bannedMap, loading, addBannedCard, removeBannedCard };
}