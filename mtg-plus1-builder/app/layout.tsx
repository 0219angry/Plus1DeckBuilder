import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

// ここでページ名（タイトル）や説明を設定します
export const metadata: Metadata = {
  title: "PLUS1デッキビルダー",
  description: "Magic: The Gathering Deck Builder with +1 Expantion Rule",
  icons: {
    icon: "/favicon.ico", // ファビコンがある場合
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <AuthProvider>
        <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
          {children}
        </body>
      </AuthProvider>
    </html>
  );
}