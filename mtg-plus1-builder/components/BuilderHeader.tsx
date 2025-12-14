"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Save, 
  HelpCircle, 
  ChevronDown, 
  Globe, 
  Layout, 
  Eye, 
  Loader2 // ローディング表示用にインポート
} from "lucide-react";
import UserMenu from "./UserMenu";
// ★作成したフックをインポート (保存したパスに合わせてください)
import { useAllowedSets } from "@/hooks/useAllowedSets"; 

type Props = {
  deckName: string;
  onChangeDeckName: (name: string) => void;
  selectedSet: string;
  onSetChange: (set: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  visibility: "public" | "private" | "limit";
  onVisibilityChange: (vis: "public" | "private" | "limit") => void;
  onSave: () => void;
  onOpenHelp: () => void;
  isSaving: boolean;
};

export default function BuilderHeader({
  deckName,
  onChangeDeckName,
  selectedSet,
  onSetChange,
  language,
  onLanguageChange,
  visibility,
  onVisibilityChange,
  onSave,
  onOpenHelp,
  isSaving
}: Props) {
  const { user } = useAuth();
  
  // ★フックを使ってセット一覧を取得
  // 初期値として全セットが入っており、Firestore接続後に最新リストに更新されます
  const { allowedSets, loading: setsLoading } = useAllowedSets();

  return (
    <header className="border-b border-slate-800/50 bg-slate-950/70 backdrop-blur-md sticky top-0 z-20 h-16">
      <div className="w-full px-4 h-full flex items-center justify-between gap-4">

        {/* 左側: ロゴ */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-blue-400 hover:text-blue-300 transition-colors shrink-0"
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">+1</span>
          </Link>

          {/* セット選択 (動的生成) */}
          <div className="relative hidden md:block">
            <Layout size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            <select
              value={selectedSet}
              onChange={(e) => onSetChange(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700 text-white text-xs rounded pl-8 pr-8 py-1.5 focus:border-blue-500 focus:outline-none hover:bg-slate-800 transition-colors cursor-pointer w-40 truncate"
              disabled={setsLoading && allowedSets.length === 0}
            >
              {/* フックから取得したセット一覧を展開 */}
              {allowedSets.map((set) => (
                <option key={set.code} value={set.code}>
                  {/* 現在の言語設定に合わせて表示名を切り替え */}
                  {language === "ja" ? (set.name_ja || set.name_en) : set.name_en}
                </option>
              ))}
            </select>
            
            {/* ローディング中はスピナー、完了後はChevronを表示 */}
            {setsLoading && allowedSets.length === 0 ? (
               <Loader2 size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white animate-spin" />
            ) : (
               <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            )}
            </div>

            {/* 言語選択 */}
            <div className="relative hidden md:block">
              <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-700 text-white text-xs rounded pl-8 pr-8 py-1.5 focus:border-blue-500 focus:outline-none hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <option value="ja">JP</option>
                <option value="en">EN</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>

            {/* 公開設定 */}
            {user && (
              <div className="relative hidden md:block">
                <Eye size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                <select
                  value={visibility}
                  onChange={(e) => onVisibilityChange(e.target.value as "public" | "private" | "limit")}
                  className="appearance-none bg-slate-900 border border-slate-700 text-white text-xs rounded pl-8 pr-8 py-1.5 focus:border-blue-500 focus:outline-none hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <option value="public">全体公開</option>
                  <option value="limit">限定公開</option>
                  <option value="private">非公開</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            )}
          </div>

        {/* 右側: コントロール群 */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          

          {/* ヘルプ */}
          <button 
            onClick={onOpenHelp}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <HelpCircle size={20} />
          </button>

          {/* 保存ボタン */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-blue-900/20 whitespace-nowrap transition-all"
          >
            {isSaving ? (
              <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Save size={16} />
            )}
            <span className="hidden sm:inline">保存</span>
          </button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}