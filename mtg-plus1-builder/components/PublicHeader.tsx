// components/PublicHeader.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Plus, LayoutGrid, LogIn, ArrowLeft } from "lucide-react";

export default function PublicHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* 左側: ロゴエリア */}
        <div className="flex items-center gap-4">
          {/* モバイルなどで戻りたいとき用にロゴ自体をリンクに */}
          <Link 
            href={user ? "/dashboard" : "/"} 
            className="font-bold text-xl text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
          >
            MtG PLUS1
          </Link>
        </div>

        {/* 右側: アクションエリア */}
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              {/* ログイン中: ダッシュボードに戻る & 新規作成 */}
              <Link 
                href="/mydeck" 
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-bold"
              >
                <LayoutGrid size={18} />
                <span className="hidden sm:inline">My Decks</span>
              </Link>

              <Link 
                href="/builder" 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">New Deck</span>
              </Link>
            </>
          ) : (
            <>
              {/* 未ログイン: トップ（ログイン画面）へ */}
              <Link 
                href="/" 
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors border border-slate-700"
              >
                <LogIn size={16} />
                <span>Login / Top</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}