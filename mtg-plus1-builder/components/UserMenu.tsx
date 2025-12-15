"use client";

import { useAuth } from "@/context/AuthContext";
import { LogIn, LogOut, User as UserIcon, Loader2, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function UserMenu() {
  const { user, loading, login, logout } = useAuth();

  console.log(user);

  if (loading) {
    return (
      <div className="w-8 h-8 flex items-center justify-center text-slate-600">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  // ★ここが修正ポイント
  // 「ユーザーが存在する」かつ「匿名ではない（isAnonymousがfalse）」場合のみ、マイページを表示
  if (user && !user.isAnonymous) {
    return (
      <div className="flex items-center gap-3 animate-in fade-in duration-300">
        <Link 
          href="/mydecks" 
          className="flex items-center gap-2 group"
          title="マイページ"
        >
          <div className="relative">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="User" 
                className="w-8 h-8 rounded-full border border-slate-700 group-hover:border-blue-400 transition-colors" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-blue-400 transition-colors">
                <UserIcon size={16} className="text-slate-400 group-hover:text-blue-400" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-950 rounded-full"></div>
          </div>
          
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors max-w-[100px] truncate">
              {user.displayName || user.email}
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <LayoutGrid size={10} /> My Decks
            </span>
          </div>
        </Link>

        <button 
          onClick={logout} 
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
          title="ログアウト"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  } else {
    // ★それ以外（未ログイン、または匿名ログイン）の場合
    // ここでログインボタンを表示することで、匿名ユーザーもGoogleログインへ誘導できます
    return (
      <div className="flex items-center gap-3 animate-in fade-in duration-300">
        <div className="flex items-center gap-2 opacity-60 select-none">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <UserIcon size={16} className="text-slate-500" />
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-bold text-slate-400">Guest</span>
            <span className="text-[10px] text-slate-600">
              {/* 匿名の場合は「Guest」、完全未ログインなら「未ログイン」と出すなど工夫も可能 */}
              {user?.isAnonymous ? "ゲスト(一時利用)" : "未ログイン"}
            </span>
          </div>
        </div>

        <button
          onClick={login}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm transition-all shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95"
        >
          <LogIn size={16} />
        </button>
      </div>
    );
  }
}