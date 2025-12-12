import { getDeck } from "@/app/actions/deck";
import DeckViewer from "@/components/DeckViewer";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// ■ 修正: params を Promise 型にする
type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // ■ 修正: await する
  const { id } = await params;
  
  // ガード: IDがない場合は処理しない
  if (!id) return { title: "Deck Not Found" };

  const deck = await getDeck(id);
  
  if (!deck) {
    return { title: "Deck Not Found" };
  }
  
  return {
    title: `${deck.name} | MtG PLUS1`,
    description: `Deck by ${deck.builderName || "Unknown"}.`,
  };
}

export default async function ViewDeckPage({ params }: PageProps) {
  // ■ 修正: ここも await する
  const { id } = await params;

  if (!id) return notFound();

  const deckData = await getDeck(id);

  if (!deckData) {
    return notFound();
  }

  return <DeckViewer data={deckData} />;
}