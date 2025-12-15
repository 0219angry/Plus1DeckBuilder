import Link from "next/link";
import type { Metadata } from 'next';
import { 
  Globe, 
  Layers,
  ArrowRight, 
  ImageIcon, 
  AlertTriangle, 
  Filter,           // PLUS1検索用
  LayoutDashboard,  // 管理用
  Lock,             // 公開設定用
  Gamepad2          // アリーナ用 (Game Controller icon)
} from "lucide-react";
import Footer from "@/components/Footer";
import ExpansionMarquee from "@/components/ExpansionMarquee";
import PublicHeader from "@/components/PublicHeader";
import LoginModal from "@/components/LoginModal"; // ★追加
import { useEffect, useState, Suspense } from "react"; // ★Suspense追加
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ★ロジック部分を別コンポーネントに切り出す（Suspense対策）
function LoginController() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const loginParam = searchParams.get("login");

    // URLに login=required があり、かつ未ログインの場合
    // ※loading中は判定しない方が安全です
    if (!loading && loginParam === "required" && user?.isAnonymous) {
      setIsLoginModalOpen(true);
    } else {  
      setIsLoginModalOpen(false);  
    }  
  }, [searchParams, user, loading]);

  // モーダルを閉じたときの処理
  const handleClose = () => {
    setIsLoginModalOpen(false);
    // URLからクエリパラメータを削除して、リロードしても再表示されないようにする（お好みで）
    router.replace("/", { scroll: false });
  };

  return (
    <LoginModal 
      isOpen={isLoginModalOpen} 
      onClose={handleClose} 
    />
  );
}

export const metadata: Metadata = {
  title: 'MtG PLUS1 Deck Builder',
  description: 'Simple, fast, and shareable Magic: The Gathering deck builder.',
  openGraph: {
    title: 'MtG PLUS1 Deck Builder',
    description: 'Create and share your MtG decks instantly.',
    // type=site を指定
    images: [`https://www.plus1deckbuilder.com/api/og?type=site`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MtG PLUS1 Deck Builder',
    description: 'Create and share your MtG decks instantly.',
    images: [`https://www.plus1deckbuilder.com/api/og?type=site`],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col selection:bg-blue-500/30">
      
      <PublicHeader />

      {/* ★ログイン制御用コンポーネントを配置し、Suspenseで囲む */}
      <Suspense fallback={null}>
        <LoginController />
      </Suspense>

      <main className="flex-1 flex flex-col">
        {/* ... (以下、既存のコンテンツそのまま) ... */}
        
        {/* ヒーローセクション */}
        <section className="relative py-20 md:py-32 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-300 text-xs font-medium mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Foundations 対応済み
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Build for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">PLUS1</span> Format
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              「基本セット(Foundations)」+「好きなエキスパンション1つ」。<br/>
              シンプルで奥深い限定構築戦のための、専用デッキビルダー。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link 
                href="/builder"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl"
              >
                デッキを作る
                <ArrowRight size={20} />
              </Link>
              <Link 
                href="/banned-cards"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-full font-bold text-lg border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                禁止リストを確認
              </Link>
            </div>
          </div>
        </section>

        {/* 機能紹介グリッド */}
        <section className="py-20 px-6 bg-slate-900/50 border-y border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12 text-white">主な機能</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              
              {/* 1. PLUS1 特化検索 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-colors group">
                <div className="w-12 h-12 bg-cyan-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Filter className="text-cyan-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">PLUS1 特化検索</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  「Foundations」＋「選択した1エキスパンション」のカードプールを自動でフィルタリング。構築ミスを未然に防ぎます。
                </p>
              </div>

              {/* 2. リーガルチェック */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-red-500/50 transition-colors group">
                <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="text-red-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">禁止カード警告</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  最新の禁止改定に対応。選択したセットに基づき、使用不可能なカードが含まれている場合は即座に警告します。
                </p>
              </div>

              {/* 3. MTG Arena エクスポート (★NEW) */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 transition-colors group">
                <div className="w-12 h-12 bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Gamepad2 className="text-orange-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">MTG Arena エクスポート</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  作成したデッキをワンクリックでコピー。そのままMTGアリーナにインポートして、すぐに対戦を始められます。
                </p>
              </div>

              {/* 4. 画像出力 & シェア */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-colors group">
                <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="text-purple-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">画像出力 & シェア</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  作成したデッキを美しい画像として保存。SNSでのシェアに最適なレイアウトで出力されます。
                </p>
              </div>

              {/* 5. デッキ管理 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-colors group">
                <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="text-emerald-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">デッキ管理</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  作成したデッキをクラウドで保存・管理。あなた専用のプロフィールページで、リストを公開することも可能です。
                </p>
              </div>

              {/* 6. 公開範囲コントロール */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-colors group">
                <div className="w-12 h-12 bg-amber-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Lock className="text-amber-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">公開範囲コントロール</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  「全体公開」「限定公開（URLのみ）」「非公開」を選択可能。調整中のデッキを隠したり、身内だけに共有したりできます。
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* セット一覧セクション */}
        <section className="py-20 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center mb-12 px-6">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Layers size={24} className="text-slate-400" />
              対応エキスパンション
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              管理データベースから自動取得・更新されます
            </p>
          </div>
          <ExpansionMarquee />
        </section>

      </main>

      <Footer />
    </div>
  );
}