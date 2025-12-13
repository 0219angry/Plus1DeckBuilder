"use client";

import { useAuth } from "@/context/AuthContext";
import { getMyDecks, deleteMyDeck } from "@/app/actions/deck";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, Edit, Eye, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ログインユーザーのデッキを取得
  useEffect(() => {
    // 認証チェックが終わるまで待機
    if (authLoading) return;

    // 未ログインならトップへ
    if (!user) {
      router.push("/");
      return;
    }

    // データ取得
    const fetchDecks = async () => {
      setLoading(true);
      const data = await getMyDecks(user.uid);
      setDecks(data as MyDeck[]);
      setLoading(false);
    };

    fetchDecks();
  }, [user, authLoading, router]);

  // 削除処理
  const handleDelete = async (deckId: string) => {
    if (!confirm("本当に削除しますか？\nこの操作は取り消せません。")) return;
    
    // UIから先に消す（楽観的更新）
    setDecks(prev => prev.filter(d => d.id !== deckId));
    
    if (user) {
      const res = await deleteMyDeck(deckId, user.uid);
      if (!res.success) {
        alert("削除に失敗しました");
        // 失敗したらリロードなどで戻すのが正式ですが、今回は省略
      }
    }
  };

  // -------------------------------------------
  // ローディング表示
  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  // -------------------------------------------
  // メイン画面
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      
      {/* ヘッダー */}
      <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Link href="/" className="font-bold text-xl text-blue-400 hover:opacity-80">
               MtG PLUS1
             </Link>
             <span className="text-slate-600">/</span>
             <h1 className="font-bold text-white">My Decks</h1>
          </div>
          
          <Link 
            href="/" 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-colors shadow-lg shadow-blue-900/20"
          >
            <Plus size={16} /> 新規作成
          </Link>
        </div>
      </header>

      {/* コンテンツエリア */}
      <main className="container mx-auto px-4 py-8">
        
        {/* ユーザー情報 */}
        <div className="flex items-center gap-4 mb-8 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-12 h-12 rounded-full border border-slate-700" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-800" />
          )}
          <div>
            <div className="font-bold text-white text-lg">{user?.displayName || "No Name"}</div>
            <div className="text-sm text-slate-500">作成したデッキ: {decks.length}件</div>
          </div>
        </div>

        {/* デッキリスト */}
        {decks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl">
            <div className="inline-flex p-4 bg-slate-900 rounded-full mb-4">
               <AlertTriangle className="text-slate-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">デッキがありません</h2>
            <p className="text-slate-500 mb-6">まだ保存されたデッキがありません。<br/>新しいデッキを作成してみましょう！</p>
            <Link 
              href="/builder" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors"
            >
              <Plus size={20} /> デッキを作る
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <div 
                key={deck.id} 
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-blue-500/50 transition-all group relative"
              >
                {/* カード上部 */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white text-lg line-clamp-1 mb-1" title={deck.name}>
                      {deck.name}
                    </h3>
                    <div className="flex gap-2 text-[10px] uppercase">
                      <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                        {deck.selectedSet}
                      </span>
                      <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                        {deck.language}
                      </span>
                    </div>
                  </div>
                  
                  {/* アクションメニュー（ホバーで表示が見やすくなる） */}
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleDelete(deck.id)}
                      className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* カード下部 */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={12} />
                    {new Date(deck.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    {/* 閲覧ボタン */}
                    <Link 
                      href={`/deck/${deck.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded transition-colors"
                    >
                      <Eye size={14} /> View
                    </Link>
                    
                    {/* 編集ボタン */}
                    <Link 
                      href={`/deck/${deck.id}/edit${deck.editSecret ? `?key=${deck.editSecret}` : ''}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
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