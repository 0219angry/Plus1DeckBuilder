"use client";

import { useState } from "react";
import { X, Save, User, AlertCircle } from "lucide-react"; // AlertCircleを追加
import { updateUserProfile, claimCustomId, UserProfile } from "@/app/actions/user"; 
import { NoteLogo, XLogo } from "@/components/Logos";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  initialProfile: UserProfile | null;
  currentCustomId?: string;
  currentUserPhotoURL?: string | null;
  isRequired?: boolean;
};

export default function ProfileSettingsModal({ 
  isOpen, 
  onClose, 
  uid, 
  initialProfile, 
  currentCustomId, 
  currentUserPhotoURL,
  isRequired = false 
}: Props) {
  const [loading, setLoading] = useState(false);
  // ★追加: エラーメッセージ管理用
  const [error, setError] = useState(""); 
  
  const [formData, setFormData] = useState({
    customId: currentCustomId || "",
    twitterUrl: initialProfile?.twitterUrl || "",
    noteUrl: initialProfile?.noteUrl || "",
    bio: initialProfile?.bio || "",
    photoURL: initialProfile?.photoURL || currentUserPhotoURL || "",
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    // バリデーション: IDが空なら処理しない
    if (!formData.customId) {
      setError("IDを入力してください");
      return;
    }

    setLoading(true);
    setError(""); // エラーをリセット

    try {
      // 1. カスタムIDの登録チェック（変更がある場合のみ）
      if (formData.customId && formData.customId !== currentCustomId) {
         const result = await claimCustomId(uid, formData.customId);
         
         // ★重要: 失敗したらエラーを表示して中断（保存させない）
         if (!result.success) {
            setError(result.message || "IDの取得に失敗しました");
            setLoading(false);
            return; 
         }
      }

      // 2. プロフィールの保存（IDチェック通過後のみ実行）
      await updateUserProfile(uid, {
        twitterUrl: formData.twitterUrl,
        noteUrl: formData.noteUrl,
        bio: formData.bio
      });
      
      onClose();
      
      if (isRequired) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      setError("予期せぬエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User size={20} className="text-blue-400" /> 
            {isRequired ? "Welcome! アカウント設定" : "プロフィール設定"}
          </h2>
          
          {!isRequired && (
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {isRequired && (
          <p className="text-sm text-blue-200 bg-blue-900/30 p-3 rounded mb-4 border border-blue-500/30">
            はじめまして！<br/>
            あなただけのユーザーIDとプロフィールを設定して始めましょう。
          </p>
        )}

        <div className="space-y-4">
          {/* カスタムID */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Custom ID (URL) <span className="text-red-500">*</span>
            </label>
            <div className={`flex items-center gap-2 border rounded p-2 bg-slate-950 transition-colors ${error ? "border-red-500 bg-red-950/10" : "border-slate-800 focus-within:border-blue-500"}`}>
               <span className="text-slate-600 text-sm">/user/</span>
               <input 
                 type="text" 
                 value={formData.customId}
                 onChange={(e) => {
                   setFormData({...formData, customId: e.target.value});
                   setError(""); // 入力し直したらエラーを消す
                 }}
                 className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-600"
                 placeholder="your-id"
                 required
               />
            </div>
            
            {/* ★エラーメッセージ表示エリア */}
            {error && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1 font-bold animate-in slide-in-from-top-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
            
            {!error && isRequired && <p className="text-[10px] text-slate-500 mt-1">※3文字以上の英数字。後から変更可能です</p>}
          </div>

          {/* Twitter */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <XLogo size={16} /> Twitter / X URL
            </label>
            <input 
              type="text" 
              value={formData.twitterUrl}
              onChange={(e) => setFormData({...formData, twitterUrl: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
              placeholder="https://x.com/username"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <NoteLogo size={16} /> Note URL
            </label>
            <input 
              type="text" 
              value={formData.noteUrl}
              onChange={(e) => setFormData({...formData, noteUrl: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
              placeholder="https://note.com/username"
            />
          </div>
          
          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ひとこと</label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm focus:border-blue-500 outline-none h-20"
              placeholder="よろしくお願いします。"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSave} 
            // IDが空、またはロード中ならボタンを押せない
            disabled={loading || !formData.customId} 
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "保存中..." : <><Save size={16} /> {isRequired ? "設定してはじめる" : "保存"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}