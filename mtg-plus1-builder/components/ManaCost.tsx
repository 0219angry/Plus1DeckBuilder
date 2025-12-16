import React from "react";

// ---------------------------------------------------------------------------
// 設定: マナシンボルの色定義
// Tailwindがビルド時に検知できるよう、完全なクラス名を記述します。
// ---------------------------------------------------------------------------

type ColorDef = {
  bg: string;     // 背景色 (単色用)
  text: string;   // 文字色
  border: string; // ボーダー色
  from: string;   // グラデーション始点 (左上)
  to: string;     // グラデーション終点 (右下)
};

// デフォルト（数字やXなど）
const DEFAULT_COLOR: ColorDef = {
  bg: "bg-gray-300",
  text: "text-gray-800",
  border: "border-gray-400",
  from: "from-gray-300",
  to: "to-gray-400",
};

const PALETTE: Record<string, ColorDef> = {
  W: { 
    bg: "bg-yellow-100", 
    text: "text-gray-900", 
    border: "border-yellow-300", 
    from: "from-yellow-100", 
    to: "to-yellow-200" 
  },
  U: { 
    bg: "bg-blue-600", 
    text: "text-white", 
    border: "border-blue-800", 
    from: "from-blue-500", 
    to: "to-blue-700" 
  },
  B: { 
    bg: "bg-gray-800", 
    text: "text-white", 
    border: "border-gray-950", 
    from: "from-gray-700", 
    to: "to-gray-900" 
  },
  R: { 
    bg: "bg-red-600", 
    text: "text-white", 
    border: "border-red-800", 
    from: "from-red-500", 
    to: "to-red-700" 
  },
  G: { 
    bg: "bg-green-600", 
    text: "text-white", 
    border: "border-green-800", 
    from: "from-green-500", 
    to: "to-green-700" 
  },
  C: { // 無色マナ
    bg: "bg-slate-400", 
    text: "text-gray-900", 
    border: "border-slate-500", 
    from: "from-slate-300", 
    to: "to-slate-500" 
  },
  P: { // ファイレクシア（黒/血のようなイメージ）
    bg: "bg-gray-900", 
    text: "text-white", 
    border: "border-black", 
    from: "from-gray-900", 
    to: "to-black" 
  },
  S: { // 氷雪 (Snow)
    bg: "bg-cyan-200",
    text: "text-cyan-900",
    border: "border-cyan-300",
    from: "from-cyan-100",
    to: "to-cyan-300"
  }
};

// ---------------------------------------------------------------------------
// ヘルパー: シンボル文字列からスタイルを解決する
// ---------------------------------------------------------------------------
const getSymbolStyles = (symbol: string) => {
  const upper = symbol.toUpperCase();

  // --- パターンA: 混成 / ファイレクシア / 不特定混成 (スラッシュを含む) ---
  if (upper.includes("/")) {
    const [leftChar, rightChar] = upper.split("/");
    
    // 定義がない文字(数字など)はDEFAULT_COLORを使う
    const left = PALETTE[leftChar] || DEFAULT_COLOR;
    const right = PALETTE[rightChar] || DEFAULT_COLOR;

    // 左側の文字色を採用するが、視認性のためテキストシャドウ(drop-shadow)をつける
    return `bg-gradient-to-br ${left.from} ${right.to} ${left.text} border-gray-400 drop-shadow-sm`;
  }

  // --- パターンB: 通常の単色 / 数字 / X ---
  const color = PALETTE[upper] || DEFAULT_COLOR;
  return `${color.bg} ${color.text} ${color.border}`;
};


// ---------------------------------------------------------------------------
// コンポーネント本体
// ---------------------------------------------------------------------------

type Props = {
  manaCost?: string;
  size?: "sm" | "md" | "lg";
  className?: string; // 追加のスタイル調整用
};

export default function ManaCost({ manaCost, size = "sm", className = "" }: Props) {
  if (!manaCost) return null;

  // 正規表現で {W}, {U}, {2/W} などを抽出
  const symbols = manaCost.match(/\{[^}]+\}/g);

  if (!symbols) return null;

  // サイズごとのベースクラス定義
  const sizeConfig = {
    sm: { container: "gap-0.5", box: "w-5 h-5", textBase: "text-xs" },
    md: { container: "gap-1",   box: "w-6 h-6", textBase: "text-sm" },
    lg: { container: "gap-1.5", box: "w-8 h-8", textBase: "text-base" },
  };
  
  const currentSize = sizeConfig[size];

  return (
    <div 
      className={`flex items-center flex-wrap ${currentSize.container} ${className}`} 
      aria-label={`Mana cost: ${manaCost}`}
    >
      {symbols.map((symbolRaw, index) => {
        // { } を削除して中身だけにする
        const symbolText = symbolRaw.replace(/[\{\}]/g, "");
        
        // スタイル取得
        const colorClasses = getSymbolStyles(symbolText);

        // 文字数によるフォントサイズの微調整
        // 1文字: 太字
        // 2文字 (10, 12): 標準
        // 3文字以上 (W/U, G/P): 極小
        let fontScaleClass = "font-bold";
        if (symbolText.length >= 3) {
           // 混成マナなどは小さくしないと枠からはみ出る
           fontScaleClass = "text-[0.6em] leading-none font-bold tracking-tighter transform scale-90";
        } else if (symbolText.length === 2) {
           fontScaleClass = "text-[0.8em] font-semibold";
        }

        return (
          <span
            key={`${index}-${symbolText}`}
            className={`
              ${currentSize.box} 
              ${currentSize.textBase}
              ${colorClasses}
              inline-flex items-center justify-center
              rounded-full border select-none shadow-sm box-border
              font-sans
            `}
            title={symbolRaw} // マウスオーバーで元のテキストを表示
          >
            <span className={fontScaleClass}>
              {symbolText}
            </span>
          </span>
        );
      })}
    </div>
  );
}
