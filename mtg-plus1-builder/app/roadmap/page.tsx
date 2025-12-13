"use client";

import { useAppStatus } from "@/hooks/useAppStatus";
import { ArrowLeft, Bug, Lightbulb, CheckCircle2, Circle, Clock, AlertCircle, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function RoadmapPage() {
  const { items, loading } = useAppStatus();
  
  const bugs = items.filter(i => i.type === "bug");
  const features = items.filter(i => i.type !== "bug");

  // ステータスのバッジ表示
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "fixed":
      case "released":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/50 text-green-400 border border-green-800"><CheckCircle2 size={12}/> 対応完了</span>;
      case "in-progress":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/50 text-blue-400 border border-blue-800"><Loader2 size={12} className="animate-spin"/> 対応中</span>;
      case "investigating":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-900/50 text-yellow-400 border border-yellow-800"><Clock size={12}/> 調査中</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700"><Circle size={12}/> 未着手</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">開発状況 & ロードマップ</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-12">
        
        {/* Discord誘導バナー (DM版) */}
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
              <MessageSquare className="text-indigo-400" />
              フィードバックを送信
            </h2>
            <p className="text-sm text-indigo-200/80">
              新しい機能のアイデアや、バグの報告はDiscordのDMで受け付けています。<br className="hidden sm:block" />
              お気軽に開発者までメッセージをお送りください！
            </p>
          </div>
          <a
            href="https://discord.com/users/687118167503667213"
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition-colors shadow-lg shadow-indigo-900/50 flex items-center gap-2"
          >
            開発者にDMを送る
          </a>
        </div>

        {/* 不具合セクション */}
        <section>
          <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4 border-b border-red-900/30 pb-2">
            <Bug size={20} /> 既知の不具合・バグ
          </h2>
          <div className="space-y-3">
            {loading ? <div className="text-slate-500 text-sm">Loading...</div> : 
             bugs.length === 0 ? <div className="text-slate-500 text-sm italic">現在報告されている不具合はありません。</div> :
             bugs.map(item => (
              <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex gap-4 group">
                <div className="mt-1 text-red-500 shrink-0"><AlertCircle size={20} /></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-200">{item.title}</h3>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.description && <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>}
                  <div className="text-[10px] text-slate-600 mt-2">ID: {item.id}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 改善・新機能セクション */}
        <section>
          <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-4 border-b border-blue-900/30 pb-2">
            <Lightbulb size={20} /> 今後の改善・新機能予定
          </h2>
          <div className="space-y-3">
            {loading ? <div className="text-slate-500 text-sm">Loading...</div> : 
             features.length === 0 ? <div className="text-slate-500 text-sm italic">現在予定されている項目はありません。</div> :
             features.map(item => (
              <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex gap-4">
                <div className="mt-1 text-blue-500 shrink-0">
                  {item.type === 'feature' ? <Lightbulb size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-200">{item.title}</h3>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.description && <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}