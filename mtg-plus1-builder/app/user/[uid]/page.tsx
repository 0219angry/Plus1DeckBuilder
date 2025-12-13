// app/user/[uid]/page.tsx

import { getUserPublicDecks } from "@/app/actions/deck";
import { getUidByCustomId, getUserProfile } from "@/app/actions/user";
import Link from "next/link";
import { 
  Clock, 
  Eye, 
  User as UserIcon, 
  LayoutGrid, 
  ArrowLeft, 
  Twitter, 
  BookOpen, 
  Ghost 
} from "lucide-react";
import { NoteLogo, XLogo } from "@/components/Logos";
import { Metadata } from "next";

// ---------------------------------------------------------
// 1. 動的メタデータ生成（OGPやブラウザタブのタイトル用）
// ---------------------------------------------------------
export async function generateMetadata({ params }: { params: { uid: string } }): Promise<Metadata> {
  const realUid = await getUidByCustomId(params.uid);
  
  // ユーザーが見つからない場合
  if (!realUid) {
    return {
      title: "User Not Found - MtG PLUS1",
    };
  }

  const profile = await getUserProfile(realUid);
  const displayName = profile?.displayName || profile?.customId || "User";

  return {
    title: `${displayName}'s Decks - MtG PLUS1`,
    description: `Check out Magic: The Gathering decks created by ${displayName}.`,
  };
}

// 常に最新データを取得するように設定
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------
// 2. メインコンポーネント
// ---------------------------------------------------------
export default async function PublicUserPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  // URLパラメータ（IDまたはカスタムID）から、本当のUIDを特定
  const realUid = await getUidByCustomId(uid);

  // ユーザーが存在しない場合の表示
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

  // デッキとプロフィール情報を並行して取得
  const [decks, profile] = await Promise.all([
    getUserPublicDecks(realUid),
    getUserProfile(realUid)
  ]);
  
  // 表示名の決定優先順位:
  // 1. プロフィール設定の名前
  // 2. デッキに含まれる製作者名
  // 3. カスタムID
  // 4. "Unknown User"
  const deckBuilderName = decks.length > 0 ? decks[0].builderName : null;
  const displayName = profile?.displayName || deckBuilderName || profile?.customId || "Unknown User";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200">
      
      {/* ヘッダー */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link href="/" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
               <ArrowLeft size={20} />
             </Link>
             <h1 className="font-bold text-white text-lg hidden sm:block">
               User Profile
             </h1>
          </div>
          <Link href="/" className="font-bold text-xl text-blue-400 hover:text-blue-300 transition-colors">
            MtG PLUS1
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* プロフィールセクション */}
        <div className="mb-10 p-8 bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-sm flex flex-col md:flex-row items-start gap-6">
          
          {/* アバター（簡易的） */}
          <div className="shrink-0">
             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-xl">
                <UserIcon size={32} className="text-slate-400" />
             </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">{displayName}</h2>
              
              {/* SNSリンク */}
              <div className="flex items-center gap-2 ml-1">
                {profile?.twitterUrl && (
                  <a 
                    href={profile.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2 bg-slate-800/50 hover:bg-[#1DA1F2] text-slate-400 hover:text-white rounded-full transition-all"
                    title="Twitter / X"
                  >
                    <XLogo />
                  </a>
                )}
                {profile?.noteUrl && (
                  <a 
                    href={profile.noteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2 bg-slate-800/50 hover:bg-[#2cb696] text-slate-400 hover:text-white rounded-full transition-all"
                    title="Note"
                  >
                    <NoteLogo />
                  </a>
                )}
              </div>
            </div>

            {/* 自己紹介文 */}
            <p className="text-slate-400 leading-relaxed max-w-2xl mb-4">
              {profile?.bio || "No bio available."}
            </p>

            {/* 統計バッジ */}
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
              <Link 
                key={deck.id} 
                href={`/deck/${deck.id}`}
                className="group block bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/80 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden"
              >
                {/* ホバー時の光のエフェクト */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                <div className="relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-bold text-white text-lg line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {deck.name}
                      </h4>
                      <div className="flex gap-2 mt-2">
                        <span className="bg-slate-950 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-800 uppercase">
                          {deck.selectedSet}
                        </span>
                        <span className="bg-slate-950 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-800 uppercase">
                          {deck.language}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Clock size={12} />
                      {new Date(deck.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs font-bold text-slate-500 group-hover:text-blue-400 flex items-center gap-1 transition-colors">
                      <Eye size={14} /> View Deck
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}