"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Plus, LayoutGrid, Map, Ban, ArrowLeft } from "lucide-react";
import UserMenu from "./UserMenu";
import { ReactNode } from "react";

type PublicHeaderProps = {
  backHref?: string;
  title?: ReactNode;
  showNavLinks?: boolean;
  customActions?: ReactNode;
};

export default function PublicHeader({ backHref, title, showNavLinks = true, customActions }: PublicHeaderProps) {
  const { user, loading } = useAuth();

  return (
    <header className="border-b border-slate-800/50 bg-slate-950/70 backdrop-blur-md sticky top-0 z-10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* 左側: ロゴ・パンくず 
            flex-1 を追加して、可能な限りスペースを確保するようにします */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white transition-colors shrink-0"
              aria-label="戻る"
            >
              <ArrowLeft size={18} />
            </Link>
          )}

          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-blue-400 hover:text-blue-300 transition-colors shrink-0"
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-900/25">+1</span>
            {/* モバイルではテキストロゴを隠してアイコンだけにする手もありますが、ここはそのまま */}
            <span className="hidden sm:inline">MtG PLUS1</span>
          </Link>

          {title && (
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <span className="text-slate-700 shrink-0">/</span>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white leading-tight truncate">{title}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide truncate">page</span>
              </div>
            </div>
          )}
        </div>

        {/* 右側: ナビゲーションとアクション 
            shrink-0 を指定して、これ以上縮まないようにしつつ、中身を減らします */}
        <div className="flex items-center gap-2 shrink-0">
          {showNavLinks && (
            <>
              {/* 変更点1: 「禁止カード」「開発状況」は画面が広いとき(lg: 1024px以上)だけ表示する */}
              <Link
                href="/banned-cards"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-300 hover:text-red-300 hover:bg-slate-900 rounded-lg transition-colors"
                title="禁止カード"
              >
                <Ban size={16} />
                <span>禁止カード</span>
              </Link>

              <Link
                href="/roadmap"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-300 hover:text-blue-300 hover:bg-slate-900 rounded-lg transition-colors"
                title="開発状況"
              >
                <Map size={16} />
                <span>開発状況</span>
              </Link>
            </>
          )}

          {customActions}

          {!loading && (
            <>
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap"
              >
                <Plus size={16} />
                {/* 変更点3: New Deck は重要なCTAなので、少し早めの sm (640px) からテキストを表示 */}
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