"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { app } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // authインスタンスは外で定義しても良いですが、SSRエラー回避のためuseEffect内や関数内で使うのが一般的
  // ここでは関数内で都度呼んでもコストは低いですが、変数に入れておきます
  const auth = getAuth(app);

  useEffect(() => {
    // 監視リスナーの設定
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // ユーザー有無に関わらず、確認が終わったらロード完了
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // ログイン処理の直前に永続化設定を入れる（これで確実にセッションが残ります）
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {/* 【重要】F5対策の肝
        loadingが完了するまでは children をレンダリングしない、
        もしくはローディングスピナーを出すことで、
        「復元中」に未ログイン判定されてページ遷移されるのを防ぎます。
      */}
      {!loading && children} 
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);