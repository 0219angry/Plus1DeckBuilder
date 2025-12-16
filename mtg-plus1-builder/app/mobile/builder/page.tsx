import { Metadata } from "next";
import { Smartphone, SlidersHorizontal, Wand2 } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import BuilderPage from "@/components/BuilderPage";
import Link from "next/link";

export const metadata: Metadata = {
  title: "スマホでデッキを作る | MtG PLUS1 Deck Builder",
  description: "タップ操作と縦スクロールで使いやすいスマートフォン向けビルダー。PLUS1フォーマットのデッキ調整を片手で完結。",
  openGraph: {
    title: "スマホでデッキを作る | MtG PLUS1 Deck Builder",
    description: "スマホ最適化された PLUS1 デッキビルダーで、移動中でもストレスなくリストを編集。",
    images: ["https://www.plus1deckbuilder.com/api/og?type=site"],
  },
};

export default function MobileBuilderPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PublicHeader title={<span className="flex items-center gap-2"><Smartphone size={18} /> モバイルビルダー</span>} />

      <main className="flex-1 flex flex-col">
        <section className="px-4 sm:px-6 pt-6 pb-4 bg-slate-900/40 border-b border-slate-900">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-200 uppercase tracking-widest">
              <SlidersHorizontal size={16} />
              Mobile Builder
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">片手で並べ替え、コピーまで。</h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              スクロールを主体にした単一カラムで、検索・追加・分析を素早く切り替え。カード行も指先でタップしやすい余白に調整されています。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white border border-slate-800 text-sm font-semibold hover:border-blue-500/60 hover:text-blue-100 transition"
              >
                デスクトップ版で開く
              </Link>
              <Link
                href="/mobile"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-semibold shadow hover:bg-blue-50 transition"
              >
                スマホ案内ページへ戻る
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[{ title: "縦スクロールで完結", desc: "検索、リスト、詳細を縦積みに再配置。画面上下の移動だけで主要操作が届きます。" }, { title: "タップ領域を拡大", desc: "カード行とボタンの間隔を広めに確保。誤タップを減らし、親指での操作が快適。" }, { title: "コピーを近くに", desc: "アリーナ用コピーや共有ボタンを画面下寄りに配置し、1タップでエクスポート。" }].map((item) => (
                <div key={item.title} className="p-4 rounded-xl bg-slate-950 border border-slate-900/80 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Wand2 size={18} className="text-cyan-300" />
                    {item.title}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex-1 px-3 sm:px-6 py-6">
          <div className="max-w-6xl mx-auto rounded-2xl border border-slate-900 bg-slate-950 shadow-xl">
            <BuilderPage />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
