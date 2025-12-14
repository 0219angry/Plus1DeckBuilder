// app/user/[uid]/page.tsx

import { getUserPublicDecks } from "@/app/actions/deck";
import { getUidByCustomId, getUserProfile } from "@/app/actions/user";
import Link from "next/link";
import { 
  Eye, 
  User as UserIcon, 
  LayoutGrid, 
  ArrowLeft, 
  Ghost 
} from "lucide-react";
import { NoteLogo, XLogo } from "@/components/Logos";
import { Metadata } from "next";
import DeckCard from "@/components/DeckCase"; // ★追加: コンポーネント読み込み
import PublicHeader from "@/components/PublicHeader";

// ---------------------------------------------------------
// 1. 動的メタデータ生成
// ---------------------------------------------------------
export async function generateMetadata({ params }: { params: Promise<{ uid: string }> }): Promise<Metadata> {
  const { uid } = await params;
  const realUid = await getUidByCustomId(uid);
  
  if (!realUid) {
    return { title: "User Not Found - MtG PLUS1" };
  }

  const profile = await getUserProfile(realUid);
  const displayName = profile?.displayName || profile?.customId || "User";

  return {
    title: `${displayName}'s Decks - MtG PLUS1`,
    description: `Check out Magic: The Gathering decks created by ${displayName}.`,
  };
}

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------
// 2. メインコンポーネント
// ---------------------------------------------------------
export default async function PublicUserPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const realUid = await getUidByCustomId(uid);

  if (!realUid) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <Ghost size={48} className="mb-4 opacity-50" />
        <h1 className="text-xl font-bold mb-2">User Not Found</h1>
        <p className="mb-6">指定されたユーザーは見つかりませんでした。</p>
        <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors">
          トップへ戻る
        </Link>
      </div>
    );
  }

  const [decks, profile] = await Promise.all([
    getUserPublicDecks(realUid),
    getUserProfile(realUid)
  ]);
  
  const deckBuilderName = decks.length > 0 ? decks[0].builderName : null;
  const displayName = profile?.displayName || deckBuilderName || profile?.customId || "Unknown User";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      
      {/* ヘッダー */}
      <PublicHeader />

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* プロフィールセクション */}
        <div className="mb-10 p-8 bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-sm flex flex-col md:flex-row items-start gap-6">
          
          {/* アバター */}
          <div className="shrink-0">
            {profile?.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt={displayName} 
                className="w-20 h-20 rounded-full border-2 border-slate-700 shadow-xl object-cover bg-slate-800"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-xl">
                <UserIcon size={32} className="text-slate-400" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">{displayName}</h2>
              
              {/* SNSリンク */}
              <div className="flex items-center gap-2 ml-1">
                {profile?.twitterUrl && (
                  <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/50 hover:bg-[#1DA1F2] text-slate-400 hover:text-white rounded-full transition-all">
                    <XLogo />
                  </a>
                )}
                {profile?.noteUrl && (
                  <a href={profile.noteUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/50 hover:bg-[#2cb696] text-slate-400 hover:text-white rounded-full transition-all">
                    <NoteLogo />
                  </a>
                )}
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-2xl mb-4">
              {profile?.bio || "No bio available."}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50 text-xs font-bold text-slate-400">
               <LayoutGrid size={14} />
               <span>Created Decks: {decks.length}</span>
            </div>
          </div>
        </div>

        {/* デッキリストセクション */}
        <div className="flex items-center gap-4 mb-6">
           <h3 className="text-xl font-bold text-white">Public Decks</h3>
           <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        {decks.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Ghost className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 font-medium">公開されているデッキはありません。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map((deck) => (
              // ★変更点: コンポーネントを利用して表示
              <DeckCard key={deck.id} deck={deck}>
                {/* 閲覧用のアクションボタンを渡す */}
                <Link 
                  href={`/deck/${deck.id}`}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg transition-all ml-auto"
                >
                  <Eye size={14} /> View
                </Link>
              </DeckCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}