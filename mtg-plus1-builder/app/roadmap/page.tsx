"use client";

import { useState } from "react";
import { useAppStatus, StatusItem } from "@/hooks/useAppStatus";
import { ArrowLeft, Bug, Lightbulb, CheckCircle2, Circle, Clock, AlertCircle, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RoadmapPage() {
  const { items, loading, addItem, removeItem } = useAppStatus();
  
  // 管理用フォームState
  const [showAdmin, setShowAdmin] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<StatusItem["type"]>("bug");
  const [status, setStatus] = useState<StatusItem["status"]>("investigating");

  const bugs = items.filter(i => i.type === "bug");
  const features = items.filter(i => i.type !== "bug");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    await addItem({ title, description: desc, type, status });
    setTitle("");
    setDesc("");
  };

  // ステータスのバッジ表示
  const StatusBadge = ({ status }: { status: StatusItem["status"] }) => {
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
                {/* 削除ボタン (Adminモード時のみ表示でも良いが、簡易的に常時隠しボタンとして実装) */}
                {showAdmin && (
                  <button onClick={() => removeItem(item.id)} className="text-slate-600 hover:text-red-500 self-start"><Trash2 size={16}/></button>
                )}
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
                {showAdmin && (
                  <button onClick={() => removeItem(item.id)} className="text-slate-600 hover:text-red-500 self-start"><Trash2 size={16}/></button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 簡易管理者モード (フッター付近の隠し機能などでトグルさせても良い) */}
        <div className="pt-10 border-t border-slate-800">
          <button 
            onClick={() => setShowAdmin(!showAdmin)} 
            className="text-xs text-slate-700 hover:text-slate-500 mb-4"
          >
            {showAdmin ? "Close Admin Tools" : "Admin Tools"}
          </button>

          {showAdmin && (
            <form onSubmit={handleAdd} className="bg-slate-900 p-4 rounded border border-slate-700 space-y-3">
              <h3 className="font-bold text-sm text-slate-300">新規項目の追加</h3>
              <div className="grid grid-cols-2 gap-2">
                <select 
                  className="bg-slate-800 border border-slate-700 rounded p-1 text-sm text-white"
                  value={type} onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="bug">不具合 (Bug)</option>
                  <option value="improvement">改善 (Improvement)</option>
                  <option value="feature">新機能 (Feature)</option>
                </select>
                <select 
                  className="bg-slate-800 border border-slate-700 rounded p-1 text-sm text-white"
                  value={status} onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="pending">未着手 (Pending)</option>
                  <option value="investigating">調査中 (Investigating)</option>
                  <option value="in-progress">対応中 (In Progress)</option>
                  <option value="fixed">修正済み (Fixed)</option>
                  <option value="released">リリース済み (Released)</option>
                </select>
              </div>
              <input 
                type="text" 
                placeholder="タイトル" 
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                value={title} onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea 
                placeholder="詳細" 
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white h-20"
                value={desc} onChange={(e) => setDesc(e.target.value)}
              />
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                <Plus size={16}/> 追加
              </button>
            </form>
          )}
        </div>

      </main>
    </div>
  );
}