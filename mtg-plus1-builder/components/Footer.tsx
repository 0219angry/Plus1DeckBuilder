import React from "react";
import Link from "next/link";
import { Ban, Map, Info } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-500 shrink-0 z-10">
      
      {/* 1. ナビゲーションリンクエリア */}
      <div className="py-4 px-4 border-b border-slate-900/50">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-xs font-bold">
          <Link href="/builder" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            デッキビルダー
          </Link>
          <Link href="/banned-cards" className="hover:text-red-400 transition-colors flex items-center gap-1.5">
            <Ban size={14} />
            禁止カード一覧
          </Link>
          <Link href="/roadmap" className="hover:text-yellow-400 transition-colors flex items-center gap-1.5">
            <Map size={14} />
            開発状況・不具合
          </Link>
          <Link href="/admin" className="hover:text-green-400 transition-colors flex items-center gap-1.5">
            <Map size={14} />
            管理者ページ
          </Link>
        </div>
      </div>

      {/* 2. 権利表記エリア (既存の内容) */}
      <div className="py-4 px-4 text-[10px] text-center leading-relaxed opacity-70">
        <p className="mb-1">
          本サイトは、ファンコンテンツ・ポリシーに沿った非公式のファンコンテンツです。
          ウィザーズ社の認可/許諾は得ていません。
          題材の一部に、ウィザーズ・オブ・ザ・コースト社の財産を含んでいます。
          ©Wizards of the Coast LLC.
        </p>
        <p>
          Card data and images provided by{" "}
          <a
            href="https://scryfall.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-400 transition-colors"
          >
            Scryfall
          </a>
          .
        </p>
        <p className="mt-2 text-slate-600">
          © 2025 MtG PLUS1 Deck Builder
        </p>
      </div>
    </footer>
  );
}