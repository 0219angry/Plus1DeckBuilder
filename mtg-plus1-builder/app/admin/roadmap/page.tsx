"use client";

import { useState } from "react";
import { useAppStatus, StatusItem } from "@/hooks/useAppStatus";
import { ArrowLeft, Plus, Trash2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";

export default function AdminRoadmapPage() {
  // ★認証ロジックは削除 (Layoutで処理済み)

  // --- データ管理 ---
  const { items, loading, addItem, removeItem, updateStatus } = useAppStatus();
  
  // 新規作成フォーム用
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<StatusItem["type"]>("bug");
  const [status, setStatus] = useState<StatusItem["status"]>("investigating");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    await addItem({ title, description: desc, type, status });
    setTitle("");
    setDesc("");
    alert("追加しました");
  };

  return (
    <div className="flex-1 text-slate-200">
      <PublicHeader
        showNavLinks={false}
        title={<span className="flex items-center gap-2 text-blue-200"><LayoutDashboard />Roadmap Admin</span>}
        customActions={(
          <Link href="/roadmap" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors">
            <ArrowLeft size={14} /> 公開ページへ戻る
          </Link>
        )}
      />

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左カラム: 新規追加フォーム */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 sticky top-24">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Plus size={20} className="text-green-400"/> 新規アイテム作成
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Type</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  value={type} onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="bug">Bug (不具合)</option>
                  <option value="improvement">Improvement (改善)</option>
                  <option value="feature">Feature (新機能)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Initial Status</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  value={status} onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="pending">未着手 (Pending)</option>
                  <option value="investigating">調査中 (Investigating)</option>
                  <option value="in-progress">対応中 (In Progress)</option>
                  <option value="fixed">修正済み (Fixed)</option>
                  <option value="released">リリース済み (Released)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  placeholder="タイトルを入力"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Description</label>
                <textarea 
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white h-32"
                  placeholder="詳細を入力"
                  value={desc} onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              <button className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold transition-colors">
                発行する
              </button>
            </form>
          </div>
        </div>

        {/* 右カラム: 一覧とステータス変更 */}
        <div className="lg:col-span-2">
          <h2 className="font-bold text-white mb-4">登録済みアイテム一覧 ({items.length})</h2>
          
          {loading ? (
            <div className="text-slate-500">Loading...</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded p-4 flex gap-4 items-start hover:border-slate-600 transition-colors">
                  <div className={`
                    shrink-0 w-8 h-8 rounded flex items-center justify-center font-bold text-xs uppercase
                    ${item.type === 'bug' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 
                      item.type === 'feature' ? 'bg-blue-900/30 text-blue-400 border border-blue-900/50' : 
                      'bg-green-900/30 text-green-400 border border-green-900/50'}
                  `}>
                    {item.type === 'bug' ? 'BUG' : item.type === 'feature' ? 'NEW' : 'IMP'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className="font-bold text-slate-200 truncate">{item.title}</h3>
                      <div className="text-[10px] text-slate-600 font-mono">ID: {item.id}</div>
                    </div>

                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{item.description}</p>

                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-slate-500 font-bold">STATUS:</label>
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value as any)}
                        className={`
                          text-xs font-bold rounded px-2 py-1 border outline-none cursor-pointer
                          ${item.status === 'fixed' || item.status === 'released' ? 'bg-green-900/20 text-green-400 border-green-900' :
                            item.status === 'in-progress' ? 'bg-blue-900/20 text-blue-400 border-blue-900' :
                            'bg-slate-800 text-slate-300 border-slate-700'}
                        `}
                      >
                        <option value="pending">Pending</option>
                        <option value="investigating">Investigating</option>
                        <option value="in-progress">In Progress</option>
                        <option value="fixed">Fixed</option>
                        <option value="released">Released</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if(confirm("本当に削除しますか？")) removeItem(item.id);
                    }}
                    className="shrink-0 p-2 text-slate-600 hover:text-red-500 hover:bg-slate-800 rounded transition-colors"
                    title="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}