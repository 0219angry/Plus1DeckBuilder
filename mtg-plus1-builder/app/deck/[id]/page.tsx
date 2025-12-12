import { getDeck } from "@/app/actions/deck"; // Server Action
import DeckViewer from "@/components/DeckViewer";
import { notFound } from "next/navigation";
import { Metadata } from "next";

type PageProps = {
  params: { id: string };
};

// メタデータ生成 (SNSシェア時のOGPなどで重要)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const deck = await getDeck(params.id);
  
  if (!deck) {
    return {
      title: "Deck Not Found | MtG PLUS1",
    };
  }
  
  return {
    title: `${deck.name} | MtG PLUS1`,
    description: `Deck by ${deck.builderName || "Unknown"}. Format: PLUS1 (${deck.selectedSet})`,
  };
}

// ページ本体 (Server Component)
export default async function ViewDeckPage({ params }: PageProps) {
  // DBからデータを取得
  const deckData = await getDeck(params.id);

  // データがなければ 404 ページへ
  if (!deckData) {
    return notFound();
  }

  // 閲覧用コンポーネントを表示
  return <DeckViewer data={deckData} />;
}