"use client";

import { useAllowedSets } from "@/hooks/useAllowedSets";
import { Loader2 } from "lucide-react";

export default function ExpansionMarquee() {
  const { allowedSets, loading } = useAllowedSets();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (allowedSets.length === 0) return null;

  // アニメーションを滑らかにするため、リストを複製して連結する
  // (スクロールで端まで行った瞬間に先頭に戻っても違和感がないようにする)
  const marqueeItems = [...allowedSets, ...allowedSets];

  return (
    <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
      <ul className="flex items-center animate-scroll [&_li]:mx-4 [&_img]:max-w-none">
        {marqueeItems.map((set, index) => (
          <li key={`${set.code}-${index}`} className="flex flex-col items-center gap-2 group min-w-[120px]">
            {/* セットシンボル (SVG) */}
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-blue-500/50 group-hover:bg-blue-900/20 transition-colors p-3">
              <img 
                src={`https://svgs.scryfall.io/sets/${set.code}.svg`} 
                alt={set.code} 
                className="w-full h-full object-contain filter invert opacity-70 group-hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            </div>
            
            {/* セット名 & コード */}
            <div className="text-center">
              <span className="block text-xl font-bold text-slate-500 group-hover:text-blue-400 font-mono transition-colors uppercase">
                {set.code}
              </span>
              <span className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors whitespace-nowrap max-w-[140px] overflow-hidden text-ellipsis block">
                {set.name_ja || set.name_en}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}