import { useState } from "react";
import { createPortal } from "react-dom";
import { DeckCard, Card } from "@/types";
import { X, Upload, AlertCircle, Loader2 } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (main: DeckCard[], side: DeckCard[], deckName?: string) => void;
};

type ParsedLine = {
  quantity: number;
  name: string;
  set?: string;
  cn?: string;
  isSideboard: boolean;
};

export default function ImportModal({ isOpen, onClose, onImport }: Props) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || typeof document === "undefined") return null;

  const handleImport = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const lines = inputText.split("\n");
      const parsedCards: ParsedLine[] = [];
      let isSideboardMode = false;
      let detectedName: string | undefined = undefined;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        // 【修正】デッキ名の解析を強化
        // コロン(:)があってもなくてもOK、スペースがあってもなくてもOKにする
        const nameMatch = trimmed.match(/^Name[:]?\s*(.+)$/i);
        if (nameMatch) {
          detectedName = nameMatch[1].trim();
          continue;
        }

        if (trimmed.toLowerCase() === "sideboard") {
          isSideboardMode = true;
          continue;
        }
        if (trimmed.toLowerCase() === "deck") {
          isSideboardMode = false;
          continue;
        }
        if (trimmed.toLowerCase() === "about") {
          continue;
        }

        // カード行の解析 (Arena形式: 4 Name (SET) 123)
        const match = trimmed.match(/^(\d+)(?:x)?\s+(.+?)(?:\s+\(([a-zA-Z0-9]+)\)\s+(\d+))?\s*$/);
        if (match) {
          parsedCards.push({
            quantity: parseInt(match[1]),
            name: match[2],
            set: match[3],
            cn: match[4],
            isSideboard: isSideboardMode,
          });
        }
      }

      if (parsedCards.length === 0) {
        throw new Error("有効なカードが見つかりませんでした。");
      }

      // APIリクエスト (POST)
      // 重複を除去してリクエストを作成
      const identifiers = parsedCards.map((p) => {
        if (p.set && p.cn) {
          return { set: p.set, collector_number: p.cn };
        }
        return { name: p.name };
      });

      const res = await fetch("https://api.scryfall.com/cards/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifiers }),
      });

      const data = await res.json();
      
      if (data.not_found && data.not_found.length > 0) {
        console.warn("Not found:", data.not_found);
        setError(`${data.not_found.length}枚のカードが見つかりませんでした。`);
      }

      const foundCards: Card[] = data.data || [];
      const newMain: DeckCard[] = [];
      const newSide: DeckCard[] = [];

      parsedCards.forEach((parsed) => {
        let matchedCard: Card | undefined;

        // セット指定がある場合は厳密に検索
        if (parsed.set && parsed.cn) {
          matchedCard = foundCards.find(
            (c) => c.set.toLowerCase() === parsed.set!.toLowerCase() && c.collector_number === parsed.cn
          );
        }
        // 見つからない場合は名前で検索
        if (!matchedCard) {
          matchedCard = foundCards.find((c) => c.name === parsed.name);
          if (!matchedCard) {
             matchedCard = foundCards.find((c) => c.name.startsWith(parsed.name));
          }
        }

        if (matchedCard) {
          const deckCard: DeckCard = { ...matchedCard, quantity: parsed.quantity };
          if (parsed.isSideboard) {
            newSide.push(deckCard);
          } else {
            newMain.push(deckCard);
          }
        }
      });

      onImport(newMain, newSide, detectedName);
      onClose();

    } catch (err: any) {
      console.error(err);
      setError(err.message || "インポート中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload size={20} /> Import Deck
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-4 overflow-hidden">
          <p className="text-sm text-slate-400">
            MTG Arena等のテキスト形式（About / Name 行を含むものも可）を貼り付けてください。
          </p>
          
          <textarea
            className="flex-1 w-full bg-slate-800 border border-slate-700 rounded p-3 text-sm text-white font-mono focus:border-blue-500 focus:outline-none resize-none min-h-[300px]"
            placeholder={`About\nName [PLUS1]NEO 赤白侍改三\n\nDeck\n4 Mountain\n...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-200 text-sm p-3 rounded flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !inputText.trim()}
            className="px-6 py-2 rounded text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Import
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}