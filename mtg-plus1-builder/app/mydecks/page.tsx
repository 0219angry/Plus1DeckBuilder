"use client";

import { useAuth } from "@/context/AuthContext";
import { getMyDecks, deleteMyDeck } from "@/app/actions/deck";
import { getUserProfile, UserProfile } from "@/app/actions/user"; // 追加
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, Edit, Eye, Clock, AlertTriangle, Settings, Share2, Check, Twitter, BookOpen } from "lucide-react";
import { NoteLogo, XLogo } from "@/components/Logos";
import { useRouter } from "next/navigation";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";

// デッキの型定義（簡易版）
type MyDeck = {
  id: string;
  name: string;
  selectedSet: string;
  language: string;
  createdAt: string;
  colors: string[];
  editSecret?: string;
};

export default function MyDecksPage() {
  const { user, loading: authLoading } = useAuth();
  const [decks, setDecks] = useState<MyDeck[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null); // プロフィール
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // モーダル開閉
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/"); return; }

    const init = async () => {
      setLoading(true);
      // 並行して取得
      const [decksData, profileData] = await Promise.all([
        getMyDecks(user.uid),
        getUserProfile(user.uid)
      ]);
      setDecks(decksData as MyDeck[]);
      setProfile(profileData);
      setLoading(false);
    };

    init();
  }, [user, authLoading, router]);

  const handleDelete = async (deckId: string) => { /* 前と同じ */ };

  const handleShare = () => {
    if (!user) return;
    // customIdがあればそれを、なければuidを使う
    const idToUse = profile?.customId || user.uid;
    const url = `${window.location.origin}/user/${idToUse}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    // 背景色を変更：リッチなグラデーションに
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200">
      
      {/* モーダル */}
      {user && (
        <ProfileSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          uid={user.uid}
          initialProfile={profile}
          currentCustomId={profile?.customId}
        />
      )}

      {/* ヘッダー: ガラスのような半透明効果を追加 */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Link href="/" className="font-bold text-xl text-blue-400 hover:text-blue-300 transition-colors">
               MtG PLUS1
             </Link>
             <span className="text-slate-700">/</span>
             <h1 className="font-bold text-white">Dashboard</h1>
          </div>
          
          <Link 
            href="/" 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
          >
            <Plus size={16} /> <span className="hidden sm:inline">New Deck</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        
        {/* プロフィールカード: デザイン刷新 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 p-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-16 h-16 rounded-full border-2 border-slate-700 group-hover:border-blue-400 transition-colors" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700" />
              )}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings size={20} className="text-white" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-white text-2xl">{user?.displayName || "No Name"}</h2>
                {/* SNSリンク表示 */}
                <div className="flex gap-2">
                  {profile?.twitterUrl && (
                    <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#1DA1F2] transition-colors"><XLogo /></a>
                  )}
                  {profile?.noteUrl && (
                    <a href={profile.noteUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#2cb696] transition-colors"><NoteLogo /></a>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1 max-w-lg">
                {profile?.bio || "プロフィール設定から自己紹介を追加できます。"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={handleShare}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-all ${
                copied 
                ? "bg-green-500/10 border-green-500/50 text-green-400" 
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
              }`}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? "Copied!" : "Share Profile"}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg font-bold text-sm transition-colors"
            >
              <Settings size={16} /> Settings
            </button>
          </div>
        </div>

        {/* 統計バー（飾り） */}
        <div className="flex items-center gap-2 mb-6 text-sm font-bold text-slate-500 uppercase tracking-wider">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span>Your Decks ({decks.length})</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        {/* デッキリスト: デザイン微調整 */}
        {decks.length === 0 ? (
           /* ... エンプティステートは前と同じでOK ... */
           <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
             {/* ... */}
             <p className="text-slate-500">No decks found.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map((deck) => (
              <div 
                key={deck.id} 
                className="group relative bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/60 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0"> {/* min-w-0でtruncateを効かせる */}
                    <h3 className="font-bold text-white text-lg truncate pr-2 group-hover:text-blue-400 transition-colors">
                      {deck.name}
                    </h3>
                    <div className="flex gap-2 mt-2">
                       {/* タグのデザイン変更 */}
                      <span className="bg-slate-950 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-800 uppercase tracking-wide">
                        {deck.selectedSet}
                      </span>
                      <span className="bg-slate-950 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-800 uppercase tracking-wide">
                        {deck.language}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(deck.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 hover:bg-slate-950 rounded transition-all"
                    title="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Clock size={12} />
                    {new Date(deck.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/deck/${deck.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-950 hover:bg-slate-900 hover:text-white border border-slate-800 rounded-lg transition-colors"
                    >
                      <Eye size={14} />
                    </Link>
                    <Link 
                      href={`/deck/${deck.id}/edit${deck.editSecret ? `?key=${deck.editSecret}` : ''}`}
                      className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-blue-600/80 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                    >
                      <Edit size={14} /> Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}