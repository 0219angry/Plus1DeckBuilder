import Link from "next/link";
import { ArrowRight, Layers, Image as ImageIcon, Globe, Ban, AlertTriangle, Map } from "lucide-react"; // Mapアイコン追加
import Footer from "@/components/Footer";
import ExpansionMarquee from "@/components/ExpansionMarquee";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col selection:bg-blue-500/30">
      
      {/* ヘッダー */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
            +1
          </div>
          <span className="font-bold text-xl tracking-tight text-white">MtG PLUS1</span>
        </div>
        <nav className="flex gap-4 text-sm font-medium items-center">
          <Link href="/banned-cards" className="hover:text-red-400 transition-colors flex items-center gap-1 hidden sm:flex">
            <Ban size={16} /> 禁止カード
          </Link>
          {/* ★追加: ロードマップへのリンク */}
          <Link href="/roadmap" className="hover:text-blue-400 transition-colors flex items-center gap-1 hidden sm:flex">
            <Map size={16} /> 開発状況
          </Link>
          
          <Link 
            href="/builder" 
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
          >
            デッキ作成 <ArrowRight size={16} />
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* (メインコンテンツは変更なし) */}
        
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
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors group">
                <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="text-blue-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">言語統一 & 整形</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  英語版しかないカードも、日本語版があるカードも、ボタン一つでリスト上の表記を日本語に統一。
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-colors group">
                <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="text-purple-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">画像出力 & シェア</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  作成したデッキを美しい画像として保存。マナカーブや色分布などの統計情報も自動でレイアウトされます。
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-red-500/50 transition-colors group">
                <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="text-red-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">リーガルチェック</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  選択したエキスパンションに基づき、使用可能なカードかどうかを自動判定。禁止カードが含まれている場合は即座に警告します。
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