"use client";

import { X, Copy, Check, Lock, Globe } from "lucide-react";
import { useState, useEffect } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  editKey?: string; // 閲覧モードやキーがない場合は省略可
};

export default function ShareModal({ isOpen, onClose, deckId, editKey }: Props) {
  const [origin, setOrigin] = useState("");
  const [copiedType, setCopiedType] = useState<"public" | "secret" | null>(null);

  // クライアントサイドでのみ window.location.origin を取得
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  // URLの構築
  const publicUrl = `${origin}/deck/${deckId}`;
  const editUrl = editKey ? `${origin}/deck/${deckId}/edit?key=${editKey}` : "";

  const handleCopy = (text: string, type: "public" | "secret") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <h3 className="font-bold text-white flex items-center gap-2">
            共有と管理
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          
          {/* 1. 公開用URL (みんなに見せる用) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
              <Globe size={14} />
              Public Share URL (閲覧用)
            </label>
            <p className="text-xs text-slate-400">
              このURLをSNSなどでシェアしてください。誰でもデッキを閲覧できますが、編集はできません。
            </p>
            <div className="flex gap-2">
              <input 
                readOnly 
                value={publicUrl} 
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:outline-none select-all"
              />
              <button
                onClick={() => handleCopy(publicUrl, "public")}
                className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-sm transition-all ${
                  copiedType === "public" 
                    ? "bg-green-600 text-white" 
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {copiedType === "public" ? <Check size={16} /> : <Copy size={16} />}
                {copiedType === "public" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* 2. 編集用URL (自分用) */}
          {editKey && (
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <label className="text-xs font-bold text-red-400 flex items-center gap-2 uppercase tracking-wider">
                <Lock size={14} />
                Secret Edit URL (編集用・取扱注意)
              </label>
              <div className="bg-red-950/30 border border-red-900/50 rounded p-3 mb-2">
                <p className="text-xs text-red-200 flex gap-2">
                  <AlertIcon />
                  <span>
                    <strong>このURLは他の人に教えないでください。</strong><br/>
                    このURLを知っている人は誰でもあなたのデッキを上書き・削除できます。ブックマークして保管してください。
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={editUrl} 
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-500 focus:text-white focus:outline-none select-all"
                />
                <button
                  onClick={() => handleCopy(editUrl, "secret")}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-sm transition-all ${
                    copiedType === "secret" 
                      ? "bg-green-600 text-white" 
                      : "bg-slate-700 hover:bg-slate-600 text-white"
                  }`}
                >
                  {copiedType === "secret" ? <Check size={16} /> : <Copy size={16} />}
                  {copiedType === "secret" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
)