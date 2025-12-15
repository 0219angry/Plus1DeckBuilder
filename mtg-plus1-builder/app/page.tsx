import { Metadata } from "next";
import LandingPage from "@/components/HomeClient";

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


export default function Home() {
  // サーバー側でクライアントコンポーネントを呼び出すだけ
  return <LandingPage />;
}