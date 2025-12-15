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

  // --- OGP画像の生成ロジック (ここから追加) ---
  
  // ベースURLの定義 (環境変数か、フォールバックとして本番ドメイン)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.plus1deckbuilder.com';
  
  // APIに渡すパラメータを作成
  const ogSearchParams = new URLSearchParams();
  ogSearchParams.set('type', 'deck'); // デッキ用デザインを指定
  ogSearchParams.set('title', deck.name);
  ogSearchParams.set('subText', deck.builderName || 'Anonymous'); // 製作者名

  // 画像URLを組み立て
  const ogImageUrl = `${baseUrl}/api/og?${ogSearchParams.toString()}`;

  const title = `${deck.name} | MtG PLUS1`;
  const description = `Deck by ${deck.builderName || "Unknown"}. Magic: The Gathering Deck Builder for PLUS1 Format.`;

  return {
    title: title,
    description: description,
    // Open Graph (Facebook, Discord, note等用)
    openGraph: {
      title: title,
      description: description,
      url: `${baseUrl}/deck/${id}`,
      siteName: 'MtG PLUS1 Deck Builder',
      images: [
        {
          url: ogImageUrl, // ★動的に生成された画像URL
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'article',
    },
    // Twitter Card (X用)
    twitter: {
      card: 'summary_large_image', // 大きな画像を表示する設定
      title: title,
      description: description,
      images: [ogImageUrl], // ★ここも同じ画像
    },
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