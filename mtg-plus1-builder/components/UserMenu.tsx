"use client";

import { useAuth } from "@/lib/auth";
import { LogIn, LogOut, User as UserIcon, Loader2, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function UserMenu() {
  const { user, loading, login, logout } = useAuth();

  // 認証状態の確認中はローディング表示（または何も表示しない）
  if (loading) {
    return (
      <div className="w-8 h-8 flex items-center justify-center text-slate-600">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  // ログイン済みの場合
  if (user) {
    return (
      <div className="flex items-center gap-3 animate-in fade-in duration-300">
        {/* マイページへのリンク */}
        <Link 
          href="/my-decks" 
          className="flex items-center gap-2 group"
          title="マイページ (作成したデッキ一覧)"
        >
          <div className="relative">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "User"} 
                className="w-8 h-8 rounded-full border border-slate-700 group-hover:border-blue-400 transition-colors" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-blue-400 transition-colors">
                <UserIcon size={16} className="text-slate-400 group-hover:text-blue-400" />
              </div>
            )}
            {/* オンラインインジケータ（装飾） */}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-950 rounded-full"></div>
          </div>
          
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors max-w-[100px] truncate">
              {user.displayName || "No Name"}
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <LayoutGrid size={10} /> My Decks
            </span>
          </div>
        </Link>

        {/* ログアウトボタン */}
        <button 
          onClick={logout} 
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
          title="ログアウト"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  // 未ログインの場合
  return (
    <button
      onClick={login}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm transition-all shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95"
    >
      <LogIn size={16} />
      <span>Login</span>
    </button>
  );
}