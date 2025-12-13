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
  id: string;
  title: string;
  description?: string;
  type: "bug" | "feature" | "improvement";
  status: "pending" | "investigating" | "in-progress" | "fixed" | "released"; 
  createdAt: number;
};

export type AppStatusData = {
  items: StatusItem[];
};

// --- Firebase設定 ---
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

  // Firestoreパス
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
              if (!auth.currentUser) {
                await signInAnonymously(auth);
              }
           }
        }

        const docRef = getDocRef();
        if (!docRef) return;

        unsubscribe = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data() as AppStatusData;
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

  // 追加
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

  // 削除
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

  // ★追加: ステータス更新
  const updateStatus = async (id: string, newStatus: StatusItem["status"]) => {
    if (!db) return;
    const docRef = getDocRef();
    if (!docRef) return;

    try {
      const snap = await getDoc(docRef);
      const currentData = snap.exists() ? (snap.data() as AppStatusData) : { items: [] };
      
      const newItems = currentData.items.map(item => {
        if (item.id === id) {
          return { ...item, status: newStatus };
        }
        return item;
      });

      setItems(newItems); // 楽観的更新
      await setDoc(docRef, { items: newItems }, { merge: true });
    } catch (e) {
      console.error("Failed to update status:", e);
      alert("更新に失敗しました");
    }
  };

  return { items, loading, addItem, removeItem, updateStatus };
}