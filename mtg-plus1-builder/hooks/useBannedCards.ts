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
  signInWithCustomToken
} from "firebase/auth";

export type BannedCardItem = {
  name: string;
  reason?: string;
};

export type BannedCardsMap = Record<string, BannedCardItem[]>;

// --- 設定値の読み込み ---
const getFirebaseConfig = () => {
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    try {
      return JSON.parse((window as any).__firebase_config);
    } catch (e) {
      console.error("Failed to parse __firebase_config", e);
    }
  }
  return process.env.NEXT_PUBLIC_FIREBASE_CONFIG 
    ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) 
    : {};
};

const getAppId = () => {
  if (typeof window !== 'undefined' && (window as any).__app_id) {
    return (window as any).__app_id;
  }
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

export function useBannedCards() {
  const [bannedMap, setBannedMap] = useState<BannedCardsMap>({});
  const [loading, setLoading] = useState(true);

  const getDocRef = () => {
    if (!db) return null;
    // useAllowedSets と同じ階層構造を使用
    return doc(db, 'artifacts', appId, 'public', 'data', 'config_banned', 'list');
  };

  useEffect(() => {
    // そもそもFirebaseが初期化できていない場合
    if (!db || !auth) {
      console.warn("Firebase not configured. Banned cards disabled.");
      setLoading(false);
      return;
    }

    let unsubscribe: () => void;

    const init = async () => {
      try {
        // console.log("Starting Firebase Auth for Banned Cards...");
        
        // 認証処理
        if ((window as any).__initial_auth_token) {
           await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        } else {
           await signInAnonymously(auth);
        }

        const docRef = getDocRef();
        if (!docRef) {
            console.error("DocRef is null");
            setLoading(false);
            return;
        }

        // console.log("Listening to Firestore:", docRef.path);

        unsubscribe = onSnapshot(docRef, (snap) => {
          // console.log("Snapshot received. Exists:", snap.exists());
          if (snap.exists()) {
            const data = snap.data();
            setBannedMap(data as BannedCardsMap);
          } else {
            // データがない場合は初期化（空オブジェクト）して書き込む
            console.log("No banned cards data found. Initializing...");
            setDoc(docRef, {}, { merge: true })
              .catch(e => console.error("Init doc write failed (Permission Denied?):", e));
            setBannedMap({});
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore listen error (Permission Denied?):", error);
          // エラー時もLoadingを解除して、空リストとして動作させる
          setLoading(false);
        });

      } catch (e) {
        console.error("useBannedCards Init Error:", e);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
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
      await setDoc(docRef, { [setCode]: newList }, { merge: true });
    } catch (e) {
      console.error("Failed to add ban:", e);
      alert("登録に失敗しました（権限がない可能性があります）");
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

      await setDoc(docRef, { [setCode]: newList }, { merge: true });
    } catch (e) {
      console.error("Failed to remove ban:", e);
      alert("削除に失敗しました");
    }
  };

  return { bannedMap, loading, addBannedCard, removeBannedCard };
}