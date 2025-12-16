import { Metadata } from "next";
import Link from "next/link";
import { Smartphone, Touch, Sparkles, Download, ShieldCheck, ArrowRight, Wand2, Zap } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "スマホ版 | MtG PLUS1 Deck Builder",
  description: "スマートフォンでサクサク動く PLUS1 デッキビルダーの専用ページ。タップ操作と軽快な検索で、いつでもどこでもデッキ調整。",
  openGraph: {
    title: "スマホ版 | MtG PLUS1 Deck Builder",
    description: "スマホ向けに最適化された PLUS1 デッキビルダー。タップ操作と軽量UIでスムーズにデッキ編集。",
    images: ["https://www.plus1deckbuilder.com/api/og?type=site"],
  },
};

export default function MobilePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PublicHeader title={<span className="flex items-center gap-2"><Smartphone size={18} /> スマホ版</span>} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.15),transparent_30%)] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-800 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
              <Sparkles size={14} />
              スマートフォン最適化
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-white">
              片手でさくさく。<br className="sm:hidden" /> PLUS1 デッキビルダーのスマホ版
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              画面幅に合わせたレイアウトとタップ操作中心のUIで、移動中の空き時間でもデッキ調整が可能。検索もコピーも、モバイル向けに軽量化されています。
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/mobile/builder"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-lg hover:shadow-blue-900/25 hover:bg-blue-50 transition"
              >
                スマホでデッキを作る
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white border border-slate-800 font-bold text-sm hover:border-blue-500/60 hover:text-blue-100 transition"
              >
                デスクトップ版を見る
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6 bg-slate-900/40 border-y border-slate-900">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-3 text-white">
              <Touch size={24} className="text-cyan-300" />
              <h2 className="text-xl sm:text-2xl font-bold">スマホでの使いやすさを最優先</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[{ title: "タップ操作に最適化", desc: "カード行を厚めにし、指先でタップしやすいスペーシングを採用。スワイプでスクロールしやすく、見たい情報に素早くアクセスできます。", icon: <Touch className="text-cyan-300" size={20} /> }, { title: "高速検索", desc: "入力ごとに即座に反映される検索と、PLUS1専用のフィルターで目的のカードを素早く絞り込み。通信量も控えめです。", icon: <Zap className="text-yellow-300" size={20} /> }, { title: "1タップコピー", desc: "完成したデッキリストは1タップでコピー可能。MTGアリーナへのインポートもスマホだけで完結します。", icon: <Wand2 className="text-purple-300" size={20} /> }].map((item) => (
                <div key={item.title} className="p-5 rounded-2xl bg-slate-950 border border-slate-800/70 shadow-sm space-y-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                    {item.icon}
                    {item.title}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3 text-white">
              <Download size={22} className="text-emerald-300" />
              <h2 className="text-xl sm:text-2xl font-bold">ホーム画面に追加して、アプリのように</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[{ title: "1. ブラウザメニューを開く", detail: "Safariなら共有ボタン、Chromeなら︙メニューから「ホーム画面に追加」を選択。" }, { title: "2. ショートカットを作成", detail: "アイコン名を確認して追加。以降はアプリのようにフルスクリーンで起動できます。" }, { title: "3. ログインで同期", detail: "作成したデッキはクラウドに保存され、PCとも自動で同期します。" }, { title: "4. オフライン閲覧", detail: "直近開いたデッキはキャッシュされるため、電波の弱い場所でもチェック可能です。" }].map((step, idx) => (
                <div key={step.title} className="p-5 rounded-2xl bg-slate-950 border border-slate-900/80 shadow-sm">
                  <div className="flex items-center gap-3 text-white font-semibold">
                    <span className="w-8 h-8 rounded-full bg-emerald-900/40 border border-emerald-700 text-emerald-200 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    {step.title}
                  </div>
                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="py-16 px-6 bg-slate-900/40 border-y border-slate-900">
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950 border border-slate-800 text-slate-200">
              <ShieldCheck size={18} className="text-emerald-300" />
              端末に優しい設計
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">軽量・安心。どこでも同じ体験を</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              画像やフォントのプリロードを最小限に抑え、データ通信量を削減。ログイン情報は安全に管理され、端末を変えても同じデッキがすぐに呼び出せます。
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900/80 shadow-sm">
                <p className="text-xs font-semibold text-cyan-300 mb-2">ビルダー</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  "/mobile/builder" からスマホ専用レイアウトでデッキを編集。タップ優先の余白と縦スクロールで、片手操作でもストレスなく組み替えられます。
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900/80 shadow-sm">
                <p className="text-xs font-semibold text-emerald-300 mb-2">ビュワー</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  共有URLを「/mobile/deck/◯◯」に差し替えるだけで、カードリストが読みやすいモバイルビューに。コピー操作も親指リーチ内に配置しました。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
