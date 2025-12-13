"use client";

import { useAuth } from "@/context/AuthContext";
import { getMyDecks, deleteMyDeck } from "@/app/actions/deck";
import { getUserProfile, UserProfile } from "@/app/actions/user";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Clock, 
  Settings, 
  Share2, 
  Check, 
  Twitter, 
  BookOpen, 
  LayoutGrid,
  Ghost
} from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import { NoteLogo, XLogo } from "@/components/Logos";

// デッキの型定義
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // 初期データ取得
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/");
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        const [decksData, profileData] = await Promise.all([
          getMyDecks(user.uid),
          getUserProfile(user.uid)
        ]);
        setDecks(decksData as MyDeck[]);
        setProfile(profileData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, authLoading, router]);

  // デッキ削除
  const handleDelete = async (deckId: string) => {
    if (!confirm("本当に削除しますか？\nこの操作は取り消せません。")) return;
    setDecks(prev => prev.filter(d => d.id !== deckId));
    if (user) {
      await deleteMyDeck(deckId, user.uid);
    }
  };

  // 共有リンクコピー
  const handleShare = () => {
    if (!user) return;
    const idToUse = profile?.customId || user.uid;
    const url = `${window.location.origin}/user/${idToUse}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ローディング画面
  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    // ★統一ポイント1: 全体の背景グラデーション
    <div className="min-h-screen bg-slate-950 from-slate-900 via-slate-950 to-black text-slate-200 font-sans">
      
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

      {/* ★統一ポイント2: ガラス風ヘッダー */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Link href="/" className="font-bold text-xl text-blue-400 hover:text-blue-300 transition-colors">
               MtG PLUS1
             </Link>
             <span className="text-slate-700">/</span>
             <h1 className="font-bold text-white tracking-tight">Dashboard</h1>
          </div>
          
          <Link 
            href="/builder" 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40"
          >
            <Plus size={16} /> <span className="hidden sm:inline">New Deck</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* ★統一ポイント3: プロフィールカードのデザイン統一 */}
        <div className="mb-10 p-6 md:p-8 bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-sm shadow-xl flex flex-col md:flex-row items-start justify-between gap-6">
          
          <div className="flex items-start gap-5 w-full">
            {/* アバター */}
            <div className="relative group cursor-pointer shrink-0" onClick={() => setIsSettingsOpen(true)}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-slate-700 group-hover:border-blue-400 transition-colors shadow-lg" />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                  <LayoutGrid className="text-slate-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                <Settings size={24} className="text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-bold text-white text-2xl md:text-3xl tracking-tight truncate">
                  {user?.displayName || "No Name"}
                </h2>
                
                {/* SNSアイコン */}
                <div className="flex gap-2">
                  {profile?.twitterUrl && (
                    <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-[#1DA1F2] transition-colors"><XLogo size={16} /></a>
                  )}
                  {profile?.noteUrl && (
                    <a href={profile.noteUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-[#2cb696] transition-colors"><NoteLogo size={16} /></a>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
                {profile?.bio || (
                  <span className="italic opacity-50">プロフィール設定から自己紹介を追加できます...</span>
                )}
              </p>

              {/* モバイル用アクションボタン位置 */}
              <div className="flex gap-2 mt-4 md:hidden">
                <button
                   onClick={handleShare}
                   className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-sm border transition-all ${
                     copied ? "bg-green-500/10 border-green-500/50 text-green-400" : "bg-slate-800 border-slate-700 text-slate-300"
                   }`}
                >
                  {copied ? <Check size={16} /> : <Share2 size={16} />}
                </button>
                <button
                   onClick={() => setIsSettingsOpen(true)}
                   className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-bold text-sm"
                >
                   <Settings size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* PC用アクションボタン位置 */}
          <div className="hidden md:flex flex-col gap-3 shrink-0">
            <button
              onClick={handleShare}
              className={`w-36 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-all ${
                copied 
                ? "bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copied ? "Copied!" : "Share"}</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-36 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg font-bold text-sm transition-colors"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* セパレーター */}
        <div className="flex items-center gap-4 mb-6">
           <h3 className="text-xl font-bold text-white flex items-center gap-2">
             <LayoutGrid className="text-blue-500" size={20} />
             Your Decks
           </h3>
           <div className="h-px bg-gradient-to-r from-slate-800 to-transparent flex-1"></div>
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{decks.length} DECKS</span>
        </div>

        {/* デッキリスト */}
        {decks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-sm">
            <div className="inline-flex p-4 bg-slate-800/50 rounded-full mb-4">
               <Ghost className="text-slate-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Decks Found</h2>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              まだデッキがありません。新しいデッキを作成して、アイデアを形にしましょう！
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-blue-600/20"
            >
              <Plus size={20} /> Create First Deck
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map((deck) => (
              // ★統一ポイント4: カードデザインの統一（ガラス感・枠線・ホバー）
              <div 
                key={deck.id} 
                className="group relative bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/80 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg truncate pr-2 group-hover:text-blue-400 transition-colors">
                      {deck.name}
                    </h3>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-slate-950/50 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-800 uppercase tracking-wide">
                        {deck.selectedSet}
                      </span>
                      <span className="bg-slate-950/50 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-800 uppercase tracking-wide">
                        {deck.language}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(deck.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                    title="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Clock size={12} />
                    {new Date(deck.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/deck/${deck.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-950 hover:bg-slate-900 hover:text-white border border-slate-800 rounded-lg transition-colors"
                      title="見る"
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