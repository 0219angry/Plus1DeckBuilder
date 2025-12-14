// components/PublicHeader.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Plus, LayoutGrid, Map, Ban, ArrowLeft } from "lucide-react";
import UserMenu from "./UserMenu";
import { ReactNode } from "react";

type PublicHeaderProps = {
  /** ページ専用の戻り先がある場合 */
  backHref?: string;
  /** パンくず用のタイトル */
  title?: ReactNode;
  /** グローバルナビを隠したい場合 */
  showNavLinks?: boolean;
  /** 右側に追加したいアクション */
  customActions?: ReactNode;
};

export default function PublicHeader({ backHref, title, showNavLinks = true, customActions }: PublicHeaderProps) {
  const { user, loading } = useAuth();

  return (
    <header className="border-b border-slate-800/50 bg-slate-950/70 backdrop-blur-md sticky top-0 z-10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* 左側: ロゴ・パンくず */}
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
              aria-label="戻る"
            >
              <ArrowLeft size={18} />
            </Link>
          )}

          <Link
            href={user ? "/mydecks" : "/"}
            className="flex items-center gap-2 font-bold text-lg text-blue-400 hover:text-blue-300 transition-colors shrink-0"
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-900/25">+1</span>
            <span className="hidden sm:inline">MtG PLUS1</span>
          </Link>

          {title && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-700">/</span>
              <div className="flex flex-col">
                <span className="font-bold text-white leading-tight truncate">{title}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">page</span>
              </div>
            </div>
          )}
        </div>

        {/* 右側: ナビゲーションとアクション */}
        <div className="flex items-center gap-2 sm:gap-3">
          {showNavLinks && (
            <>
              <Link
                href="/banned-cards"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-300 hover:text-red-300 hover:bg-slate-900 rounded-lg transition-colors"
              >
                <Ban size={16} />
                禁止カード
              </Link>

              <Link
                href="/roadmap"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-300 hover:text-blue-300 hover:bg-slate-900 rounded-lg transition-colors"
              >
                <Map size={16} />
                開発状況
              </Link>
            </>
          )}

          {customActions}

          {!loading && (
            <>
              {user && (
                <Link
                  href="/mydecks"
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors text-sm font-bold"
                >
                  <LayoutGrid size={16} />
                  My Decks
                </Link>
              )}

              <Link
                href="/builder"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">New Deck</span>
                <span className="sm:hidden">作成</span>
              </Link>
            </>
          )}

          <UserMenu />
        </div>
      </div>
    </header>
  );
}