import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Smartphone, ExternalLink, Eye } from "lucide-react";

import { getDeck } from "@/app/actions/deck";
import DeckViewer from "@/components/DeckViewer";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

// ■ params を Promise 型に揃える
type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  if (!id) return { title: "Deck Not Found" };

  const deck = await getDeck(id);

  if (!deck) {
    return { title: "Deck Not Found" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.plus1deckbuilder.com";
  const title = `${deck.name} | モバイルビュー | MtG PLUS1`;
  const description = `スマホ向けビューで ${deck.builderName || "Unknown"} のデッキを確認できます。`;

  const ogSearchParams = new URLSearchParams();
  ogSearchParams.set("type", "deck");
  ogSearchParams.set("title", deck.name);
  ogSearchParams.set("subText", deck.builderName || "Anonymous");
  const ogImageUrl = `${baseUrl}/api/og?${ogSearchParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/mobile/deck/${id}`,
      siteName: "MtG PLUS1 Deck Builder",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function MobileDeckPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) return notFound();

  const deckData = await getDeck(id);

  if (!deckData) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PublicHeader title={<span className="flex items-center gap-2"><Smartphone size={18} /> モバイルビュワー</span>} />

      <main className="flex-1 flex flex-col">
        <section className="px-4 sm:px-6 pt-6 pb-4 bg-slate-900/40 border-b border-slate-900">
          <div className="max-w-5xl mx-auto flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200 uppercase tracking-widest">
              <Eye size={16} />
              Mobile Viewer
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{deckData.name}</h1>
              <p className="text-sm text-slate-400 mt-1">スマートフォンで読みやすい1カラムレイアウトと、親指リーチ内のコピー操作を優先表示します。</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/deck/${id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white border border-slate-800 text-sm font-semibold hover:border-blue-500/60 hover:text-blue-100 transition"
              >
                <ExternalLink size={16} />
                デスクトップ版を開く
              </Link>
              <Link
                href="/mobile/builder"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-semibold shadow hover:bg-blue-50 transition"
              >
                ビルダーに戻る
              </Link>
            </div>
          </div>
        </section>

        <section className="flex-1 px-3 sm:px-6 py-6">
          <div className="max-w-5xl mx-auto rounded-2xl border border-slate-900 bg-slate-950 shadow-xl">
            <DeckViewer data={deckData} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
