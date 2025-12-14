"use client";

import { useAuth } from "@/context/AuthContext";
import { getMyDecks, deleteMyDeck } from "@/app/actions/deck";
import { getUserProfile, syncUser, UserProfile } from "@/app/actions/user"; // ★syncUserを追加
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
  LayoutGrid,
  Ghost
} from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import { NoteLogo, XLogo } from "@/components/Logos";
import DeckCard from "@/components/DeckCase";
import PublicHeader from "@/components/PublicHeader";

// デッキの型定義
type MyDeck = {
  id: string;
  name: string;
  selectedSet: string;
  language: string;
  createdAt: string;
  colors: string[];
  editSecret?: string;
  archetype: string;
};

export default function MyDecksPage() {
  const { user, loading: authLoading } = useAuth();
  const [decks, setDecks] = useState<MyDeck[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // ★追加: 初回ログインかどうかを管理するステート
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // 初期データ取得
  useEffect(() => {
    if (authLoading) return;
    if (!user || user?.isAnonymous) {
      router.push("/?login=required");
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        // 並列でデータ取得
        // ★ここで getUserProfile の代わりに syncUser を呼ぶのがポイントです
        const [decksData, syncedProfile] = await Promise.all([
          getMyDecks(user.uid),
          syncUser({
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email
          })
        ]);

        setDecks(decksData as MyDeck[]);
        
        // syncUserの戻り値があればセット
        if (syncedProfile) {
          setProfile(syncedProfile);

          // ★新規ユーザー判定: syncUserが返したフラグを見る
          // （actions/user.ts の syncUser が { ...profile, isNew: boolean } を返す前提）
          // @ts-ignore: isNewプロパティの型定義をUserProfileに追加していない場合の回避策
          if (syncedProfile.isNew) {
            setIsFirstLogin(true);
            setIsSettingsOpen(true); // モーダルを強制的に開く
          }
        }
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
    <div className="min-h-screen bg-slate-950 from-slate-900 via-slate-950 to-black text-slate-200 font-sans">
      
      {/* モーダル */}
      {user && (
        <ProfileSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => {
            // ★初回ログイン時は閉じられないようにする
            if (!isFirstLogin) {
              setIsSettingsOpen(false);
            }
          }} 
          uid={user.uid}
          initialProfile={profile}
          currentCustomId={profile?.customId}
          currentUserPhotoURL={user.photoURL}
          // ★必須モードフラグを渡す（前のチャットで追加したprops）
          isRequired={isFirstLogin}
        />
      )}

      <PublicHeader title="Dashboard" />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* プロフィールカード */}
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
                  {profile?.displayName || user?.displayName || "No Name"}
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

        {/* デッキリスト */}
        <div className="flex items-center gap-4 mb-6">
           <h3 className="text-xl font-bold text-white flex items-center gap-2">
             <LayoutGrid className="text-blue-500" size={20} />
             Your Decks
           </h3>
           <div className="h-px bg-gradient-to-r from-slate-800 to-transparent flex-1"></div>
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{decks.length} DECKS</span>
        </div>

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
              // ★変更: DeckCardコンポーネントを使用
              <DeckCard key={deck.id} deck={deck}>
                
                {/* 閲覧ボタン */}
                <Link 
                  href={`/deck/${deck.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-950 hover:bg-slate-900 hover:text-white border border-slate-800 rounded-lg transition-colors"
                  title="見る"
                >
                  <Eye size={14} />
                </Link>

                {/* 編集ボタン */}
                <Link 
                  href={`/deck/${deck.id}/edit${deck.editSecret ? `?key=${deck.editSecret}` : ''}`}
                  className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-blue-600/80 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                >
                  <Edit size={14} /> Edit
                </Link>

                {/* 削除ボタン */}
                <button 
                  onClick={() => handleDelete(deck.id)}
                  className="p-1.5 ml-auto text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                  title="削除"
                >
                  <Trash2 size={16} />
                </button>

              </DeckCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}