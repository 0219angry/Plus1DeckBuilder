import { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
} from "firebase/firestore";
import { 
  getAuth,
  signInAnonymously,
  signInWithCustomToken
} from "firebase/auth";
import { Expansion, EXPANSIONS } from "@/types"; // EXPANSIONSをインポート

// --- 設定値の読み込みロジック (Canvas環境 / 通常環境 両対応) ---
const getFirebaseConfig = () => {
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    // Canvas環境: 自動注入される変数を使用
    try {
      return JSON.parse((window as any).__firebase_config);
    } catch (e) {
      console.error("Failed to parse __firebase_config", e);
    }
  }
  // 通常環境: 環境変数を使用
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
    // 二重初期化を防ぐ
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

export function useAllowedSets() {
  // 初期値として types.ts の全リストを使用
  const [allowedSets, setAllowedSets] = useState<Expansion[]>(EXPANSIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DB接続がない場合は即座にデフォルト値(EXPANSIONS)で完了とする
    if (!db || !auth) {
      console.warn("Firebase not configured or failed to init. Using default sets.");
      setLoading(false);
      return;
    }

    let unsubscribe: () => void;

    const init = async () => {
      try {
        // 認証処理
        if ((window as any).__initial_auth_token) {
           await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        } else {
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
        }

        // パス: artifacts / {appId} / public / data / config_sets / list
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'config_sets', 'list');

        unsubscribe = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            
            if (data.sets && Array.isArray(data.sets)) {
              // 新しい形式: { sets: [{ code: "ne", name_en: "...", name_ja: "..." }] }
              const validSets = data.sets.map((s: any) => ({
                  code: s.code,
                  name_en: s.name_en || s.name || s.code, // 互換性維持
                  name_ja: s.name_ja || s.name || s.code  // 互換性維持
              }));
              setAllowedSets(validSets);
            } 
            // 後方互換 (古い形式のデータ対策)
            else if (data.codes && Array.isArray(data.codes)) {
              const mapped = data.codes.map((c: string) => {
                // EXPANSIONSから情報を探す
                const found = EXPANSIONS.find(ex => ex.code === c);
                return found || { code: c, name_en: c.toUpperCase(), name_ja: c.toUpperCase() };
              });
              setAllowedSets(mapped);
            }
          } else {
            // 初期データの作成（ドキュメントがない場合のみ実行）
            // types.ts で定義した EXPANSIONS をそのまま書き込む
            setDoc(docRef, { sets: EXPANSIONS }, { merge: true })
              .then(() => console.log("Initialized config_sets with full expansion list."))
              .catch(e => console.log("Init doc write skipped/failed:", e));
            
            setAllowedSets(EXPANSIONS);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore listen error:", error);
          setLoading(false);
        });

      } catch (e) {
        console.error("Auth error:", e);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { allowedSets, loading };
}