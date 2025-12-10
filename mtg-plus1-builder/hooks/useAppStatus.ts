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

// --- 型定義 ---
export type StatusItem = {
  id: string;       // 一意のID (タイムスタンプ等)
  title: string;
  description?: string;
  type: "bug" | "feature" | "improvement"; // 不具合 | 新機能 | 改善
  status: "pending" | "investigating" | "in-progress" | "fixed" | "released"; 
  createdAt: number;
};

export type AppStatusData = {
  items: StatusItem[];
};

// --- Firebase設定 (他フックと同様) ---
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

export function useAppStatus() {
  const [items, setItems] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Firestoreパス: artifacts/{appId}/public/data/app_status/list
  const getDocRef = () => {
    if (!db) return null;
    return doc(db, 'artifacts', appId, 'public', 'data', 'app_status', 'list');
  };

  useEffect(() => {
    if (!db || !auth) {
      setLoading(false);
      return;
    }

    let unsubscribe: () => void;

    const init = async () => {
      try {
        if (!auth.currentUser) {
           if ((window as any).__initial_auth_token) {
              await signInWithCustomToken(auth, (window as any).__initial_auth_token);
           } else {
              await signInAnonymously(auth);
           }
        }

        const docRef = getDocRef();
        if (!docRef) return;

        unsubscribe = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data() as AppStatusData;
            // 新しい順にソート
            const sorted = (data.items || []).sort((a, b) => b.createdAt - a.createdAt);
            setItems(sorted);
          } else {
            setDoc(docRef, { items: [] }, { merge: true }).catch(console.error);
            setItems([]);
          }
          setLoading(false);
        });

      } catch (e) {
        console.error("useAppStatus Error:", e);
        setLoading(false);
      }
    };

    init();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // --- 追加機能 ---
  const addItem = async (item: Omit<StatusItem, "id" | "createdAt">) => {
    if (!db) return;
    const docRef = getDocRef();
    if (!docRef) return;

    try {
      const snap = await getDoc(docRef);
      const currentData = snap.exists() ? (snap.data() as AppStatusData) : { items: [] };
      
      const newItem: StatusItem = {
        ...item,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };

      const newItems = [...currentData.items, newItem];
      await setDoc(docRef, { items: newItems }, { merge: true });
    } catch (e) {
      console.error("Failed to add item:", e);
      alert("登録に失敗しました");
    }
  };

  // --- 削除機能 ---
  const removeItem = async (id: string) => {
    if (!db) return;
    const docRef = getDocRef();
    if (!docRef) return;

    try {
      const snap = await getDoc(docRef);
      const currentData = snap.exists() ? (snap.data() as AppStatusData) : { items: [] };
      const newItems = currentData.items.filter(i => i.id !== id);
      await setDoc(docRef, { items: newItems }, { merge: true });
    } catch (e) {
      console.error("Failed to remove item:", e);
    }
  };

  return { items, loading, addItem, removeItem };
}