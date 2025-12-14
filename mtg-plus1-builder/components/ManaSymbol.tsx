import { getMtgColor } from "@/lib/mtg";

type Props = {
  color: string; // 'W', 'U', etc.
  size?: 'sm' | 'md';
};

export default function ManaSymbol({ color, size = 'md' }: Props) {
  const colorDef = getMtgColor(color);
  const sizeClass = size === 'sm' ? 'w-4 h-4 text-[10px]' : 'w-5 h-5 text-xs';

  return (
    <span
      className={`
        ${colorDef.class} 
        ${sizeClass}
        inline-flex items-center justify-center 
        rounded-full border shadow-sm font-bold font-serif select-none
      `}
      title={colorDef.label}
    >
      {/* シンボル文字: 
        公式アイコン画像を使わない場合は文字で代用します。
        U(青)は水滴💧などにしても良いですが、文字の方が統一感が出ます。
      */}
      {color}
    </span>
  );
}