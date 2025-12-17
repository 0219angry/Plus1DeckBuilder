import Link from "next/link";
import { Metadata } from "next";
import { CalendarDays, Eye, Layers, Sparkles, UserRound, BookmarkCheck } from "lucide-react";
import { getLatestPublicDecks, PublicDeckSummary } from "@/app/actions/deck";
import PublicHeader from "@/components/PublicHeader";
import ManaSymbol from "@/components/ManaSymbol";
import { getDeckColorName, getDeckGradientStyle } from "@/lib/mtg";

export const metadata: Metadata = {
  title: "新着デッキ | MtG PLUS1",
  description: "Publicに設定された最新のデッキを一覧できます。",
};

export const dynamic = "force-dynamic";

const formatDate = (value: string) => {
  const date = new Date(value);
  return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

function DeckSummaryCard({ deck }: { deck: PublicDeckSummary }) {
  const gradientStyle = getDeckGradientStyle(deck.colors);
  const colorName = getDeckColorName(deck.colors, "ja");
  const updatedLabel = deck.updatedAt && deck.updatedAt !== deck.createdAt ? `更新: ${formatDate(deck.updatedAt)}` : null;

  // セットコードを小文字に変換（URL用）
  const setCode = deck.selectedSet.toLowerCase();

  return (
    <div
      className="group relative bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-300"
      style={gradientStyle}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-wide text-slate-400">
            <span className="pl-1.5 pr-2 py-1 rounded-md bg-slate-950/60 border border-slate-800 font-bold flex items-center gap-1.5">
              {/* ScryfallからSVGを取得。invertで白く反転 */}
              <img 
                src={`https://svgs.scryfall.io/sets/${setCode}.svg`} 
                alt={deck.selectedSet}
                className="w-4 h-4 object-contain filter invert opacity-90"
              />
              {deck.selectedSet}
            </span>
            
            <span className="px-2 py-1 rounded-md bg-slate-950/60 border border-slate-800 font-bold">
              {deck.language}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-900/30 border border-emerald-700 text-emerald-100 font-bold">
              Public
            </span>
          </div>

          <div className="space-y-2">
            <Link href={`/deck/${deck.id}`} className="text-xl font-bold text-white hover:text-blue-300 transition-colors block truncate">
              {deck.name}
            </Link>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="flex -space-x-1">
                {deck.colors.length > 0 ? (
                  ["W", "U", "B", "R", "G", "C"]
                    .filter((color) => deck.colors.includes(color))
                    .map((color) => <ManaSymbol key={color} color={color} size="sm" />)
                ) : (
                  <ManaSymbol color="C" size="sm" />
                )}
              </div>
              {(colorName || deck.archetype) && (
                <span className="text-slate-400">
                  {colorName}{deck.archetype ? ` / ${deck.archetype}` : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-right text-xs text-slate-400 font-mono">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700 text-slate-300">
            <CalendarDays size={14} /> {formatDate(deck.createdAt)}
          </div>
          {updatedLabel && (
            <span className="px-2 py-1 rounded-md bg-blue-900/30 border border-blue-800 text-blue-100">
              {updatedLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-300">
        <UserRound size={16} className="text-slate-400" />
        <span className="font-semibold truncate">{deck.builderName}</span>
        {deck.userId && (
          <Link
            href={`/user/${deck.userId}`}
            className="text-xs font-bold text-blue-200 bg-blue-900/30 hover:bg-blue-800/60 border border-blue-800 px-2 py-1 rounded-full transition-colors"
          >
            作者ページ
          </Link>
        )}
      </div>

      {deck.concepts && (
        <p className="text-sm text-slate-400 leading-relaxed max-h-12 overflow-hidden">
          {deck.concepts}
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-[12px] text-slate-300">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700">
          <Layers size={14} className="text-blue-300" />
          メイン {deck.mainCount}枚
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700">
          <Layers size={14} className="text-slate-200" />
          サイド {deck.sideboardCount}枚
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700">
          <BookmarkCheck size={14} className="text-emerald-300" />
          キーカード {deck.keyCardIds.length}枚
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/deck/${deck.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow shadow-blue-900/30"
        >
          <Eye size={16} />
          デッキを見る
        </Link>
        {deck.userId && (
          <Link
            href={`/user/${deck.userId}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-colors"
          >
            作者のプロフィール
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function LatestDecksPage() {
  const decks = await getLatestPublicDecks();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <PublicHeader title="新着デッキ" />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="p-6 md:p-8 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-blue-300 font-semibold text-sm flex items-center gap-2">
                <Sparkles size={16} />
                Public Deck Feed
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                新着デッキ
              </h1>
              <p className="text-slate-400 max-w-3xl">
                公開設定のデッキだけを新着順にまとめました。カラーやアーキタイプ、作者名をチェックして、気になるリストをすぐに開けます。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="px-4 py-3 rounded-xl bg-slate-800/70 border border-slate-700 text-left">
                <p className="text-xs uppercase text-slate-500 font-bold">現在の表示件数</p>
                <p className="text-2xl font-extrabold text-white">{decks.length} Decks</p>
              </div>
              {decks[0] && (
                <div className="px-4 py-3 rounded-xl bg-slate-800/70 border border-slate-700 text-left">
                  <p className="text-xs uppercase text-slate-500 font-bold">最新の更新</p>
                  <p className="text-lg font-bold text-slate-100">{formatDate(decks[0].createdAt)}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {decks.length === 0 ? (
          <div className="p-10 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 text-center">
            <p className="text-lg font-bold text-white mb-2">まだ公開デッキがありません</p>
            <p className="text-slate-400">誰かがPublicでデッキを保存すると、ここに新着が並びます。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {decks.map((deck) => (
              <DeckSummaryCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
