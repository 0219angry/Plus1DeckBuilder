"use client";

import { useState, useEffect } from "react";
import { useBannedCards } from "@/hooks/useBannedCards";
import { EXPANSIONS } from "@/types";
import { AlertTriangle, ArrowLeft, Ban, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

type CardData = {
  name: string;        
  displayName: string; 
  image_uri?: string;
  set: string;
  reason?: string;
};

// unique:prints で検索するとデータ量が増えるため、バッチサイズを小さくする
const BATCH_SIZE = 10;

const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export default function BannedCardsPage() {
  const { bannedMap, loading } = useBannedCards();
  const [cardsWithImages, setCardsWithImages] = useState<Record<string, CardData[]>>({});
  const [imageLoading, setImageLoading] = useState(true);

  // --- 名前整形ヘルパー ---
  const formatName = (card: any): string => {
    const clean = (str?: string) => str?.replace(/[（(].*?[）)]/g, "") || undefined;
    let printedName = clean(card.printed_name);
    if (!printedName && card.card_faces) {
      const parts = card.card_faces.map((f: any) => clean(f.printed_name || f.name));
      printedName = parts.join(" // ");
    }
    return printedName || card.name;
  };

  useEffect(() => {
    if (loading) return;

    const fetchAllImages = async () => {
      setImageLoading(true);
      
      const allBannedNames = new Set<string>();
      Object.values(bannedMap).forEach(list => {
        list.forEach(item => allBannedNames.add(item.name));
      });

      const uniqueNames = Array.from(allBannedNames);
      if (uniqueNames.length === 0) {
        setImageLoading(false);
        return;
      }

      const nameChunks = chunkArray(uniqueNames, BATCH_SIZE);
      
      // 英語名 -> 全バージョンのカードデータリスト
      const cardVersionsMap = new Map<string, any[]>();

      try {
        await Promise.all(nameChunks.map(async (chunk) => {
          // unique:prints で指定することで、再録版やプロモ版も含めて全て取得する
          const nameQuery = chunk.map(name => `!"${name}"`).join(" OR ");
          const fullQuery = `(${nameQuery}) (lang:ja OR lang:en) unique:prints`;
          
          try {
            const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(fullQuery)}`);
            const json = await res.json();
            const foundCards = json.data || [];

            chunk.forEach(targetName => {
              // この名前を持つカードを全バージョン抽出してマップに保存
              const versions = foundCards.filter((c: any) => c.name === targetName);
              if (versions.length > 0) {
                cardVersionsMap.set(targetName, versions);
              }
            });
          } catch (e) {
            console.error("Batch search failed", e);
          }
        }));

        // --- データの割り当て ---
        const newMap: Record<string, CardData[]> = {};
        
        Object.entries(bannedMap).forEach(([setCode, items]) => {
          newMap[setCode] = items.map(item => {
            const versions = cardVersionsMap.get(item.name) || [];
            let bestCard = null;

            if (versions.length > 0) {
              // 優先順位スコア計算関数
              const getScore = (c: any) => {
                let score = 0;
                // 1. セットの一致 (最優先)
                if (c.set === setCode) score += 10;
                // 2. 言語が日本語
                if (c.lang === "ja") score += 5;
                // 3. 画像が存在する
                if (c.image_uris || c.card_faces?.[0]?.image_uris) score += 1;
                return score;
              };

              // スコアが高い順にソート
              versions.sort((a, b) => getScore(b) - getScore(a));
              bestCard = versions[0];
            }
            
            if (bestCard) {
              return {
                name: item.name,
                displayName: formatName(bestCard),
                set: setCode,
                reason: item.reason,
                image_uri: bestCard.image_uris?.normal || bestCard.card_faces?.[0]?.image_uris?.normal
              };
            }
            
            return { 
              name: item.name, 
              displayName: item.name, 
              set: setCode, 
              reason: item.reason 
            };
          });
        });

        setCardsWithImages(newMap);

      } catch (error) {
        console.error("Image fetch error", error);
      } finally {
        setImageLoading(false);
      }
    };

    fetchAllImages();
  }, [bannedMap, loading]);

  const sortedSetCodes = EXPANSIONS.map(ex => ex.code).filter(code => bannedMap[code]?.length > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/builder" className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2 text-red-400">
            <Ban /> 禁止カード一覧 (Banned List)
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="mb-8 bg-red-900/20 border border-red-900/50 p-4 rounded-lg flex items-start gap-3 text-red-200">
          <AlertTriangle className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold mb-1">デッキ構築ルールについて</p>
            <p>以下のカードは、指定されたセットを選択した場合、デッキに入れることができません。</p>
            <p className="mt-2 text-red-300 text-xs">※禁止カードに指定されたカードは、他のセットに収録されている同名カードも含めて使用できません。</p>
          </div>
        </div>

        {loading || imageLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Loading banned cards...</p>
          </div>
        ) : Object.keys(cardsWithImages).length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-lg">
            禁止カードは現在設定されていません。
          </div>
        ) : (
          <div className="space-y-12">
            {sortedSetCodes.map(setCode => {
              const expansion = EXPANSIONS.find(e => e.code === setCode);
              const cards = cardsWithImages[setCode] || [];

              return (
                <section key={setCode} className="scroll-mt-20">
                  <div className="flex items-baseline gap-3 border-b border-slate-800 pb-2 mb-4">
                    <h2 className="text-2xl font-bold text-white">
                      {expansion ? expansion.name_ja : setCode.toUpperCase()}
                    </h2>
                    <span className="text-sm font-mono text-slate-500 uppercase">({setCode})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {cards.map((card, idx) => (
                      <div key={`${card.set}-${card.name}-${idx}`} className="group relative bg-slate-900 rounded-lg border border-slate-800 overflow-hidden hover:border-red-500/50 transition-colors">
                        {/* 画像 */}
                        <div className="aspect-[5/7] bg-slate-950 relative overflow-hidden">
                          {card.image_uri ? (
                            <img 
                              src={card.image_uri} 
                              alt={card.displayName} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              No Image
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Ban className="text-red-500 w-16 h-16 drop-shadow-lg" />
                          </div>
                        </div>

                        {/* 情報 */}
                        <div className="p-3">
                          <h3 className="font-bold text-sm text-white mb-1 truncate" title={card.displayName}>
                            {card.displayName}
                          </h3>
                          <div className="text-[10px] text-slate-500 font-mono truncate mb-2">{card.name}</div>

                          {card.reason && (
                            <div className="text-xs text-slate-400 bg-slate-950/50 p-2 rounded mt-2 border border-slate-800">
                              <span className="text-red-400 font-bold block mb-0.5">Reason:</span>
                              {card.reason}
                            </div>
                          )}
                          <a 
                            href={`https://scryfall.com/search?q=${encodeURIComponent(card.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 w-fit"
                          >
                            Scryfall <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}