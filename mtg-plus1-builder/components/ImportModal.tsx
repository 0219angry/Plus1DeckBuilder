import { useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { DeckCard, Card } from "@/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (main: DeckCard[], side: DeckCard[], deckName?: string) => void;
  language: string;
  selectedSet: string;
};

export default function ImportModal({ isOpen, onClose, onImport, language, selectedSet }: Props) {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");

  if (!isOpen) return null;

  const handleImport = async () => {
    setIsProcessing(true);
    setProgress("テキストを解析中...");
    try {
      const { main, side, name } = await parseImportText(inputText, language, selectedSet, setProgress);
      onImport(main, side, name);
      setInputText("");
      onClose();
    } catch (e) {
      alert("インポートに失敗しました。ネットワーク接続やテキスト形式を確認してください。");
      console.error(e);
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload size={20} className="text-blue-400" />
            デッキインポート
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-hidden flex flex-col gap-2">
          <p className="text-sm text-slate-400 leading-relaxed">
            MTG Arena (英語/日本語), Magic Online, テキスト形式に対応しています。<br />
            セクション区切りは <span className="text-white font-mono bg-slate-800 px-1 rounded">Deck</span> / <span className="text-white font-mono bg-slate-800 px-1 rounded">Sideboard</span> または <span className="text-white font-mono bg-slate-800 px-1 rounded">デッキ</span> / <span className="text-white font-mono bg-slate-800 px-1 rounded">サイドボード</span> が有効です。
          </p>
          <div className="relative flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing}
              placeholder={`デッキ
4 平地
4 島
4 記憶の氾濫

サイドボード
2 否認
...`}
              className="w-full h-full bg-slate-950 border border-slate-700 rounded p-4 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none placeholder:text-slate-600"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white rounded">
                <Loader2 size={32} className="animate-spin mb-2 text-blue-400" />
                <span className="font-bold text-sm">{progress}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/30 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={handleImport}
            disabled={isProcessing || !inputText.trim()}
            className="px-6 py-2 rounded bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {isProcessing ? "読み込み中..." : "インポート実行"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- テキスト解析とカードデータ取得ロジック ---
async function parseImportText(
  text: string, 
  language: string, 
  selectedSet: string, 
  onProgress: (msg: string) => void
): Promise<{ main: DeckCard[], side: DeckCard[], name?: string }> {
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const mainCards: DeckCard[] = [];
  const sideCards: DeckCard[] = [];
  let currentTarget: 'main' | 'side' = 'main';
  let deckName: string | undefined;

  // 【修正】優先度スコア計算関数
  // セット一致を最優先、次に言語一致とする
  const getScore = (c: any) => {
    let score = 0;
    
    // 1. セット優先（桁違いの重み付け）
    const cSet = c.set.toLowerCase();
    if (cSet === selectedSet.toLowerCase()) score += 10000;
    else if (cSet === 'fdn') score += 5000;
    
    // 2. 言語一致（セット内での順位決定用）
    if (c.lang === language) score += 1000;
    else if (c.lang === 'en') score += 500; // 日本語がなくて英語があるならそれ
    
    // 3. その他調整
    // 再録セット等は優先度を下げる
    if (cSet === 'plist' || cSet === 'mb1' || cSet.length > 3) score -= 100;

    // プロモ等は避ける（数字のみのコレクター番号を優先）
    if (!isNaN(Number(c.collector_number))) score += 50;

    return score;
  };

  // Scryfall検索ヘルパー
  const searchBestCard = async (cardName: string) => {
    // 広く検索して、手元でスコアリングして選ぶ
    const query = `!"${cardName}" unique:prints (lang:${language} or lang:en)`; 
    const fetchUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(fetchUrl);
    
    if (res.ok) {
      const searchData = await res.json();
      if (searchData.data && searchData.data.length > 0) {
        const candidates = searchData.data.sort((a: any, b: any) => getScore(b) - getScore(a));
        return candidates[0];
      }
    }
    return null;
  };

  type ImportItem = {
    quantity: number;
    name: string;
    set?: string;
    cn?: string;
    target: 'main' | 'side';
  };
  const itemsToFetch: ImportItem[] = [];

  for (const line of lines) {
    if (line.match(/^(?:Sideboard|サイドボード)(?:\s|$)/i)) {
      currentTarget = 'side';
      continue;
    }
    if (line.match(/^(?:Deck|デッキ)(?:\s|$)/i)) {
      currentTarget = 'main';
      continue;
    }
    
    if (line.startsWith("Name") && line.includes(")")) {
       const match = line.match(/Name\s+\(.*\)\s+(.*)/);
       if (match) deckName = match[1].trim();
       continue;
    }
    if (line.startsWith("About")) continue;
    if (line.startsWith("Companion")) continue; 
    if (line.startsWith("Commander")) continue;

    const match = line.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const quantity = parseInt(match[1], 10);
      let rawName = match[2];
      let setCode: string | undefined;
      let collectorNumber: string | undefined;

      const arenaMatch = rawName.match(/^(.+)\s+\(([a-zA-Z0-9]+)\)\s+(\d+[a-z]*)$/);
      if (arenaMatch) {
        rawName = arenaMatch[1].trim();
        setCode = arenaMatch[2].toLowerCase();
        collectorNumber = arenaMatch[3];
      }

      itemsToFetch.push({
        quantity,
        name: rawName,
        set: setCode,
        cn: collectorNumber,
        target: currentTarget
      });
    }
  }

  // Scryfall APIでカードデータを取得
  const total = itemsToFetch.length;
  for (let i = 0; i < total; i++) {
    const item = itemsToFetch[i];
    onProgress(`カード情報を取得中... (${i + 1}/${total})`);

    try {
      let cardData: any = null;

      // --- A. セット指定がある場合 ---
      if (item.set && item.cn) {
        // 1. 指定されたセット・番号・指定言語での取得を試みる
        // 例: (NEO) 123 の 日本語版
        let fetchUrl = `https://api.scryfall.com/cards/${item.set}/${item.cn}/${language}`;
        let res = await fetch(fetchUrl);
        
        if (res.ok) {
          cardData = await res.json();
        } else {
          // 2. 指定言語がない場合、デフォルト言語（英語など）で取得
          // 【修正】他セットへは行かず、指定セットのカードをそのまま採用する
          fetchUrl = `https://api.scryfall.com/cards/${item.set}/${item.cn}`;
          res = await fetch(fetchUrl);
          if (res.ok) {
            cardData = await res.json();
          }
        }
      } 
      // --- B. 名前のみの場合 ---
      else {
        // 名前検索で最適な1枚を探す（セット優先 > 言語優先）
        cardData = await searchBestCard(item.name);

        // 見つからなければ named API (最終手段)
        if (!cardData) {
          const fetchUrlNamed = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(item.name)}`;
          const resNamed = await fetch(fetchUrlNamed);
          if (resNamed.ok) cardData = await resNamed.json();
        }
      }

      if (cardData) {
        const newCard: DeckCard = {
          id: cardData.id,
          name: cardData.name,
          set: cardData.set,
          collector_number: cardData.collector_number,
          image_uris: cardData.image_uris || cardData.card_faces?.[0]?.image_uris,
          card_faces: cardData.card_faces,
          mana_cost: cardData.mana_cost,
          cmc: cardData.cmc,
          type_line: cardData.type_line,
          lang: cardData.lang,
          printed_name: cardData.printed_name, 
          full_art: cardData.full_art,
          quantity: item.quantity,
          rarity: cardData.rarity
        };

        const targetList = item.target === 'main' ? mainCards : sideCards;
        const existingIdx = targetList.findIndex(c => c.name === newCard.name);
        if (existingIdx >= 0) {
           targetList[existingIdx].quantity += item.quantity;
        } else {
           targetList.push(newCard);
        }
      }
    } catch (e) {
      console.error(`Error fetching ${item.name}`, e);
    }
    await new Promise(r => setTimeout(r, 80));
  }

  return { main: mainCards, side: sideCards, name: deckName };
}