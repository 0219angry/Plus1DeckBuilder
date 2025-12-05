import { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
} from "firebase/firestore";
// 【修正】認証関連は firebase/auth からインポート
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken
} from "firebase/auth";
import { Expansion } from "@/types";

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

export function useAllowedSets() {
  const [allowedSets, setAllowedSets] = useState<Expansion[]>([{ code: "fdn", name_en: "Foundations", name_ja: "ファウンデーションズ" }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !auth) return;

    const init = async () => {
      try {
        if ((window as any).__initial_auth_token) {
           await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        } else {
           await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth error:", e);
      }

      // 認証後にFirestoreへアクセス
      // パス: artifacts / {appId} / public / data / config_sets / list
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'config_sets', 'list');

      const unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          
          if (data.sets && Array.isArray(data.sets)) {
            const validSets = data.sets.map((s: any) => ({
                code: s.code,
                name_en: s.name_en || s.name || s.code,
                name_ja: s.name_ja || s.name || s.code
            }));
            setAllowedSets(validSets);
          } 
        } else {
          // 初期データの作成
          const initialSets = [
            { code: "fdn", name_en: "Foundations", name_ja: "ファウンデーションズ" },
            { code: "dsk", name_en: "Duskmourn: House of Horror", name_ja: "ダスクモーン：戦慄の館" },
            { code: "neo", name_en: "Kamigawa: Neon Dynasty", name_ja: "神河：輝ける世界" }
          ];
          // 管理者権限がないと書き込めない場合もあるが、開発環境用にcatchのみしておく
          setDoc(docRef, { sets: initialSets }, { merge: true }).catch(e => console.log("Init doc write skipped/failed:", e));
          setAllowedSets(initialSets);
        }
        setLoading(false);
      }, (error) => {
        console.error("Firestore listen error:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    init();
  }, []);

  return { allowedSets, loading };
}