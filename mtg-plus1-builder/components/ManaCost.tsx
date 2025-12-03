import React from "react";

type Props = {
  manaCost?: string;
  size?: "sm" | "md"; // サイズ調整用
};

export default function ManaCost({ manaCost, size = "sm" }: Props) {
  if (!manaCost) return null;

  // 正規表現で {W} や {2} などの塊ごとの配列に分割する
  // 例: "{1}{W}{U}" -> ["{1}", "{W}", "{U}"]
  const symbols = manaCost.match(/\{[^}]+\}/g);

  if (!symbols) return null;

  // サイズ定義
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="flex items-center gap-0.5">
      {symbols.map((symbol, index) => {
        // ScryfallのSVGファイル名のルールに変換
        // 1. { } を削除
        // 2. / を削除 (混成マナ {W/U} -> WU.svg, ファイレクシア {G/P} -> GP.svg)
        const filename = symbol.replace(/[\{\}\/]/g, "");
        
        return (
          <img
            key={index}
            src={`https://svgs.scryfall.io/card-symbols/${filename}.svg`}
            alt={symbol}
            className={`${sizeClass} rounded-full shadow-sm`}
            // 読み込みエラー時はテキストを表示するフォールバック（念のため）
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        );
      })}
    </div>
  );
}