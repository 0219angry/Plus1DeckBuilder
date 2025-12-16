"use client";

import Link from "next/link";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { DeckResponse } from "@/types/deck"; 
import { useAuth } from "@/context/AuthContext";

// 各パネルコンポーネント
import DeckPanel from "@/components/DeckPanel";
import InfoPanel from "@/components/InfoPanel";
import AnalysisPanel from "@/components/AnalysisPanel";
import SampleHandPanel from "@/components/SampleHandPanel";
import Footer from "@/components/Footer";

// アイコン
import { 
  BarChart3, 
  Play, 
  Info, 
  Globe2, 
  Link2, 
  Lock,
  Layers // デッキ表示用
} from "lucide-react";

type DeckViewerProps = {
  data: DeckResponse;
};

export default function DeckViewer({ data }: DeckViewerProps) {
  // Desktop用 State
  const [activeTab, setActiveTab] = useState<"info" | "analysis" | "sample">("info");
  
  // Mobile用 State
  const [mobileTab, setMobileTab] = useState<"deck" | "analysis" | "sample" | "info">("deck");

  const { user, loading } = useAuth();

  const visibility = data.visibility || 'public';
  const isOwner = user?.uid && data.userId === user.uid;
  const isPrivate = visibility === 'private';

  // 公開設定バッジの定義
  const visibilityBadge = {
    label: visibility === 'private' ? '非公開' : visibility === 'limit' ? '限定公開' : '公開',
    description: visibility === 'private' ? 'あなたのみ閲覧できます' : visibility === 'limit' ? 'URLを知っている人のみ閲覧可能' : 'ユーザーページに掲載されます',
    className: visibility === 'private' ? 'bg-red-950/40 border-red-900 text-red-200' : visibility === 'limit' ? 'bg-amber-950/30 border-amber-800 text-amber-200' : 'bg-emerald-950/30 border-emerald-800 text-emerald-200',
    icon: visibility === 'private' ? <Lock size={12} /> : visibility === 'limit' ? <Link2 size={12} /> : <Globe2 size={12} />,
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
          <p className="text-sm text-slate-400">公開範囲が「非公開」に設定されています。デッキの作者のみ閲覧できます。</p>
          <div className="flex justify-center gap-3 text-sm">
            <Link href="/" className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors">トップに戻る</Link>
          </div>
        </div>
      </main>
    );
  }

  // ダミー関数（readOnlyモードのパネルに渡すため）
  const noop = () => {};

  return (
    <main className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      
      {/* ヘッダー: z-50で最前面固定 */}
      <div className="relative z-50 shrink-0 shadow-md bg-slate-950">
        <header className="p-3 bg-slate-950 border-b border-slate-800 flex gap-4 items-center shrink-0">
          
          {/* ロゴ + タイトル */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
              +1
            </div>
            <h1 className="text-lg font-bold text-blue-400 hidden sm:block">MtG PLUS1</h1>
          </Link>

          <span className="text-slate-700 hidden sm:block">|</span>
          
          <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-white font-bold leading-tight truncate">{data.name}</h2>
              <div className="flex gap-2 text-[10px] text-slate-500 items-center mt-1">
                  <span className="uppercase border border-slate-800 bg-slate-900 px-1 rounded shrink-0">{data.selectedSet}</span>
                  <span className="uppercase border border-slate-800 bg-slate-900 px-1 rounded shrink-0">{data.language}</span>
                  <span className="truncate">by {data.builderName || "Unknown"}</span>
                  
                  {/* 可視性バッジ (スマホではアイコンのみ) */}
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${visibilityBadge.className} ml-auto sm:ml-0`}>
                    {visibilityBadge.icon}
                    <span className="hidden sm:inline">{visibilityBadge.label}</span>
                  </span>
              </div>
          </div>
        </header>
      </div>

      {/* =========================================
          Desktop View (md以上)
         ========================================= */}
      <div className="hidden md:flex flex-1 overflow-hidden relative z-0">
        <PanelGroup direction="horizontal">
          
          {/* 左パネル: 情報 / 統計 / ソリティア */}
          <Panel defaultSize={40} minSize={30} className="flex flex-col">
            
            {/* タブナビゲーション */}
            <div className="flex border-b border-slate-800 bg-slate-900">
              <button onClick={() => setActiveTab("info")} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "info" ? "bg-slate-800 text-yellow-400 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-300"}`}>
                <Info size={14} /> Info
              </button>
              <button onClick={() => setActiveTab("analysis")} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "analysis" ? "bg-slate-800 text-purple-400 border-b-2 border-purple-500" : "text-slate-500 hover:text-slate-300"}`}>
                <BarChart3 size={14} /> Stats
              </button>
              <button onClick={() => setActiveTab("sample")} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "sample" ? "bg-slate-800 text-green-400 border-b-2 border-green-500" : "text-slate-500 hover:text-slate-300"}`}>
                <Play size={14} /> Solitaire
              </button>
            </div>

            {/* コンテンツエリア */}
            <div className="flex-1 overflow-hidden relative bg-slate-900/50">
              {/* Info Panel */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "info" ? "z-10" : "hidden"}`}>
                <InfoPanel 
                  readOnly={true}
                  builderName={data.builderName || ""} setBuilderName={noop}
                  archetype={data.archetype || ""} setArchetype={noop}
                  concepts={data.concepts || ""} setConcepts={noop}
                  colors={data.colors || []} setColors={noop}
                  turnMoves={data.turnMoves || []} setTurnMoves={noop}
                  showArchetype={true} setShowArchetype={noop}
                  showConcepts={true} setShowConcepts={noop}
                  showTurnMoves={true} setShowTurnMoves={noop}
                />
              </div>
              
              {/* Analysis Panel */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "analysis" ? "z-10" : "hidden"}`}>
                <AnalysisPanel deck={data.cards} />
              </div>

              {/* Sample Hand Panel */}
              <div className={`absolute inset-0 flex flex-col ${activeTab === "sample" ? "z-10" : "hidden"}`}>
                <SampleHandPanel deck={data.cards} />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-slate-950 hover:bg-blue-600/50 transition-colors flex items-center justify-center">
            <div className="w-0.5 h-8 bg-slate-700 rounded" />
          </PanelResizeHandle>

          {/* 右パネル: デッキリスト */}
          <Panel defaultSize={60} minSize={30}>
            <DeckPanel 
              readonly={true}
              deck={data.cards} sideboard={data.sideboard} deckName={data.name} builderName={data.builderName || ""}
              selectedSet={data.selectedSet} language={data.language} keyCardIds={data.keyCardIds || []}
              archetype={data.archetype} concepts={data.concepts} turnMoves={data.turnMoves} colors={data.colors}
              showArchetype={true} showConcepts={true} showTurnMoves={true}
              onChangeDeckName={noop} onRemove={noop} onUnifyLanguage={noop} onImportDeck={noop}
              onQuantityChange={noop} onToggleKeyCard={noop} onResetDeck={noop}
              isProcessing={false} bannedCardsMap={{}} 
            />
          </Panel>
        </PanelGroup>
      </div>

      {/* =========================================
          Mobile View (md未満)
         ========================================= */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden relative z-0">
        <div className="flex-1 overflow-hidden relative">
          
          {/* Deck View */}
          <div className={`absolute inset-0 flex flex-col bg-slate-900 transition-transform duration-300 ${mobileTab === 'deck' ? 'translate-x-0' : '-translate-x-full hidden'}`}>
             <DeckPanel 
              readonly={true}
              deck={data.cards} sideboard={data.sideboard} deckName={data.name} builderName={data.builderName || ""}
              selectedSet={data.selectedSet} language={data.language} keyCardIds={data.keyCardIds || []}
              archetype={data.archetype} concepts={data.concepts} turnMoves={data.turnMoves} colors={data.colors}
              showArchetype={true} showConcepts={true} showTurnMoves={true}
              onChangeDeckName={noop} onRemove={noop} onUnifyLanguage={noop} onImportDeck={noop}
              onQuantityChange={noop} onToggleKeyCard={noop} onResetDeck={noop}
              isProcessing={false} bannedCardsMap={{}} 
            />
          </div>

          {/* Analysis View */}
          <div className={`absolute inset-0 flex flex-col bg-slate-900 ${mobileTab === 'analysis' ? 'z-10' : 'hidden'}`}>
             <AnalysisPanel deck={data.cards} />
          </div>

          {/* Solitaire View */}
          <div className={`absolute inset-0 flex flex-col bg-slate-900 ${mobileTab === 'sample' ? 'z-10' : 'hidden'}`}>
             <SampleHandPanel deck={data.cards} />
          </div>

          {/* Info View */}
          <div className={`absolute inset-0 flex flex-col bg-slate-900 ${mobileTab === 'info' ? 'z-10' : 'hidden'}`}>
            {/* InfoPanel内はスクロールが必要なので親で確保しつつ、InfoPanel側で制御させるが、
                InfoPanel自体がh-full前提で作られている場合が多いので、ここではコンテナを確保して渡す 
                pb-20をつけて下部ナビに隠れないようにする
            */}
            <div className="flex-1 overflow-y-auto pb-20">
                <InfoPanel 
                  readOnly={true}
                  builderName={data.builderName || ""} setBuilderName={noop}
                  archetype={data.archetype || ""} setArchetype={noop}
                  concepts={data.concepts || ""} setConcepts={noop}
                  colors={data.colors || []} setColors={noop}
                  turnMoves={data.turnMoves || []} setTurnMoves={noop}
                  showArchetype={true} setShowArchetype={noop}
                  showConcepts={true} setShowConcepts={noop}
                  showTurnMoves={true} setShowTurnMoves={noop}
                />
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="h-14 bg-slate-950 border-t border-slate-800 flex items-center justify-around z-20 shrink-0">
          <button 
            onClick={() => setMobileTab("deck")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mobileTab === 'deck' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <Layers size={20} />
            <span className="text-[10px]">Deck</span>
          </button>
          
          <button 
            onClick={() => setMobileTab("analysis")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mobileTab === 'analysis' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <BarChart3 size={20} />
            <span className="text-[10px]">Stats</span>
          </button>

          <button 
            onClick={() => setMobileTab("sample")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mobileTab === 'sample' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <Play size={20} />
            <span className="text-[10px]">Solitaire</span>
          </button>

          <button 
            onClick={() => setMobileTab("info")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mobileTab === 'info' ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <Info size={20} />
            <span className="text-[10px]">Info</span>
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );
}