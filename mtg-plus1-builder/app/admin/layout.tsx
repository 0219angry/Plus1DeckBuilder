"use client";

import { useState, useEffect } from "react";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { verifyAdminPassword } from "@/app/actions/auth"; // ★追加: Server Actionをインポート

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false); // ★追加: ローディング状態

  // セッション復元
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("admin_auth");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setChecking(true);

    try {
      // ★修正: Server Action を呼び出して判定
      const isValid = await verifyAdminPassword(passcode);

      if (isValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
      } else {
        setError("パスコードが違います");
      }
    } catch (e) {
      setError("認証エラーが発生しました");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
  };

  // --- 未認証時 ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-slate-900 p-8 rounded-lg border border-slate-800 w-full max-w-sm shadow-2xl">
          <div className="flex justify-center mb-6 text-slate-500">
            <Lock size={48} />
          </div>
          <h1 className="text-xl font-bold text-center mb-2">Admin Access</h1>
          <p className="text-xs text-slate-500 text-center mb-6">
            管理者権限が必要です
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                placeholder="Enter Passcode"
                className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                disabled={checking}
              />
              {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
            </div>
            <button 
              disabled={checking}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-slate-400 py-3 rounded font-bold transition-colors shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2"
            >
              {checking ? <Loader2 className="animate-spin" size={18} /> : "Unlock"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-800 pt-4">
            <Link href="/" className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft size={12} /> Top Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- 認証済み ---
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-2 flex justify-between items-center text-xs sticky top-0 z-50 backdrop-blur-sm">
        <span className="text-slate-400 font-mono">Logged in as Administrator</span>
        <button 
          onClick={handleLogout} 
          className="text-red-400 hover:text-red-300 hover:underline"
        >
          Logout
        </button>
      </div>
      
      {children}
    </div>
  );
}