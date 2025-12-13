"use client";

import { useState } from "react";
import { X, Save, Twitter, BookOpen, User } from "lucide-react";
import { updateUserProfile, claimCustomId } from "@/app/actions/user";
import { UserProfile } from "@/app/actions/user";
import { NoteLogo, XLogo } from "@/components/Logos";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  initialProfile: UserProfile | null;
  currentCustomId?: string;
  currentUserPhotoURL?: string | null;
};

export default function ProfileSettingsModal({ isOpen, onClose, uid, initialProfile, currentCustomId, currentUserPhotoURL }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customId: currentCustomId || "",
    twitterUrl: initialProfile?.twitterUrl || "",
    noteUrl: initialProfile?.noteUrl || "",
    bio: initialProfile?.bio || "",
    photoURL: currentUserPhotoURL || "",
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    
    // 1. プロフィールの保存
    await updateUserProfile(uid, {
      twitterUrl: formData.twitterUrl,
      noteUrl: formData.noteUrl,
      bio: formData.bio
    });

    // 2. カスタムIDの登録（変更がある場合のみ）
    if (formData.customId && formData.customId !== currentCustomId) {
       await claimCustomId(uid, formData.customId);
    }

    setLoading(false);
    onClose();
    // 画面リロード（簡易的な反映）
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User size={20} className="text-blue-400" /> プロフィール設定
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* カスタムID */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Custom ID (URL)</label>
            <div className="flex items-center gap-2">
               <span className="text-slate-600 text-sm">/user/</span>
               <input 
                 type="text" 
                 value={formData.customId}
                 onChange={(e) => setFormData({...formData, customId: e.target.value})}
                 className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                 placeholder="your-id"
               />
            </div>
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
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "保存中..." : <><Save size={16} /> 保存</>}
          </button>
        </div>
      </div>
    </div>
  );
}