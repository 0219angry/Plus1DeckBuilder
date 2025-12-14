"use client";

import Link from "next/link";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { DeckResponse } from "@/types/deck"; // または DeckData
import { useAuth } from "@/context/AuthContext";

// 各パネルコンポーネント
import DeckPanel from "@/components/DeckPanel";
import InfoPanel from "@/components/InfoPanel";
import AnalysisPanel from "@/components/AnalysisPanel";
import SampleHandPanel from "@/components/SampleHandPanel";
import Footer from "@/components/Footer";

// アイコン
import { BarChart3, Play, Info, Globe2, Link2, Lock } from "lucide-react";

type DeckViewerProps = {
  data: DeckResponse;
};

export default function DeckViewer({ data }: DeckViewerProps) {
  // 閲覧モードなので、左パネルの表示切り替え用Stateのみ持つ
  const [activeTab, setActiveTab] = useState<"info" | "analysis" | "sample">("info");
  const { user, loading } = useAuth();

  const visibility = data.visibility || 'public';
  const isOwner = user?.uid && data.userId === user.uid;
  const isPrivate = visibility === 'private';

  const visibilityBadge = {
    label:
      visibility === 'private'
        ? '非公開'
        : visibility === 'limit'
        ? '限定公開'
        : '公開',
    description:
      visibility === 'private'
        ? 'あなたのみ閲覧できます'
        : visibility === 'limit'
        ? 'URLを知っている人のみ閲覧可能'
        : 'ユーザーページに掲載されます',
    className:
      visibility === 'private'
        ? 'bg-red-950/40 border-red-900 text-red-200'
        : visibility === 'limit'
        ? 'bg-amber-950/30 border-amber-800 text-amber-200'
        : 'bg-emerald-950/30 border-emerald-800 text-emerald-200',
    icon:
      visibility === 'private'
        ? <Lock size={12} />
        : visibility === 'limit'
        ? <Link2 size={12} />
        : <Globe2 size={12} />,
  };

  if (isPrivate && loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-sm text-slate-400">認証情報を確認しています...</div>
      </main>
    );
  }

  if (isPrivate && !isOwner) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-2xl font-bold text-white">このデッキは非公開です</div>
          <p className="text-sm text-slate-400">
            公開範囲が「非公開」に設定されています。デッキの作者のみ閲覧できます。
          </p>
          <div className="flex justify-center gap-3 text-sm">
            <Link href="/" className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors">
              トップに戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ダミー関数（readOnlyモードのパネルに渡すため）
  const noop = () => {};

  return (
    <main className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      
      {/* ヘッダー: タイトルと基本情報のみ表示 */}
      <header className="p-3 bg-slate-950 border-b border-slate-800 flex gap-4 items-center shrink-0">
        
        {/* ロゴ + タイトル (リンク化) */}
        <Link 
          href="/" 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
            +1
          </div>
          <h1 className="text-lg font-bold text-blue-400">MtG PLUS1</h1>
        </Link>

        <span className="text-slate-700">|</span>
        
        <div className="flex flex-col justify-center">
            <h2 className="text-white font-bold leading-tight">{data.name}</h2>
            <div className="flex gap-2 text-[10px] text-slate-500">
                <span className="uppercase border border-slate-800 bg-slate-900 px-1 rounded">
                    {data.selectedSet}
                </span>
                <span className="uppercase border border-slate-800 bg-slate-900 px-1 rounded">
                    {data.language}
                </span>
                <span>
                    by {data.builderName || "Unknown"}
                </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${visibilityBadge.className}`}>
                {visibilityBadge.icon}
                {visibilityBadge.label}
              </span>
              <span className="text-slate-500 hidden sm:inline">{visibilityBadge.description}</span>
              {isOwner && (
                <span className="text-blue-300 text-[10px] bg-blue-900/30 border border-blue-800 px-2 py-0.5 rounded">
                  あなたのデッキ
                </span>
              )}
            </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          
          {/* 左パネル: 情報 / 統計 / ソリティア */}
          <Panel defaultSize={40} minSize={30} className="flex flex-col">
            
            {/* タブナビゲーション */}
            <div className="flex border-b border-slate-800 bg-slate-900">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "info" ? "bg-slate-800 text-yellow-400 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
              >
                <Info size={14} /> Info
              </button>
              <button
                onClick={() => setActiveTab("analysis")}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "analysis" ? "bg-slate-800 text-purple-400 border-b-2 border-purple-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
              >
                <BarChart3 size={14} /> Stats
              </button>
              <button
                onClick={() => setActiveTab("sample")}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "sample" ? "bg-slate-800 text-green-400 border-b-2 border-green-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
              >
                <Play size={14} /> Solitaire
              </button>
            </div>

            {/* コンテンツエリア */}
            <div className="flex-1 overflow-hidden relative bg-slate-900/50">
              
              {/* 1. Info Panel (ReadOnly) */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "info" ? "z-10" : "hidden"}`}>
                <InfoPanel 
                  readOnly={true} // ★重要: 閲覧モード
                  
                  // データ渡し
                  builderName={data.builderName || ""} 
                  setBuilderName={noop}
                  archetype={data.archetype || ""} 
                  setArchetype={noop}
                  concepts={data.concepts || ""} 
                  setConcepts={noop}
                  colors={data.colors || []} 
                  setColors={noop}
                  turnMoves={data.turnMoves || []} 
                  setTurnMoves={noop}
                  
                  // 表示設定は閲覧用に強制的にONにする
                  showArchetype={true} setShowArchetype={noop}
                  showConcepts={true} setShowConcepts={noop}
                  showTurnMoves={true} setShowTurnMoves={noop}
                />
              </div>
              
              {/* 2. Analysis Panel (閲覧のみでも機能する) */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "analysis" ? "z-10" : "hidden"}`}>
                <AnalysisPanel deck={data.cards} />
              </div>

              {/* 3. Sample Hand Panel (閲覧者が試せるように機能させておく) */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "sample" ? "z-10" : "hidden"}`}>
                <SampleHandPanel deck={data.cards} />
              </div>

            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-slate-950 hover:bg-blue-600/50 transition-colors flex items-center justify-center">
            <div className="w-0.5 h-8 bg-slate-700 rounded" />
          </PanelResizeHandle>

          {/* 右パネル: デッキリスト (ReadOnly) */}
          <Panel defaultSize={60} minSize={30}>
            <DeckPanel 
              readonly={true} // ★重要: 閲覧モード
              
              deck={data.cards}
              sideboard={data.sideboard}
              deckName={data.name}
              builderName={data.builderName || ""}
              selectedSet={data.selectedSet}
              language={data.language}
              keyCardIds={data.keyCardIds || []}
              
              // 詳細情報（InfoPanelの内容をDeckPanel側でも表示する場合用）
              archetype={data.archetype}
              concepts={data.concepts}
              turnMoves={data.turnMoves}
              colors={data.colors}
              showArchetype={true}
              showConcepts={true}
              showTurnMoves={true}

              // 無効化するアクション群（空関数を渡す）
              onChangeDeckName={noop}
              onRemove={noop} 
              onUnifyLanguage={noop}
              onImportDeck={noop}
              onQuantityChange={noop}
              onToggleKeyCard={noop}
              onResetDeck={noop}
              isProcessing={false}
              bannedCardsMap={{}} 
            />
          </Panel>
        </PanelGroup>
      </div>
      <Footer />
    </main>
  );
}