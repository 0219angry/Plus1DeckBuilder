import { useState } from "react";
import { DeckCard } from "@/types";
import { List as ListIcon, LayoutGrid, Copy, Check, RefreshCw, Download, ChevronDown } from "lucide-react";
import CardView from "./CardView";

type Props = {
  deck: DeckCard[];
  sideboard: DeckCard[]; // 【追加】
  deckName: string;
  onChangeDeckName: (name: string) => void;
  onRemove: (card: DeckCard, target: "main" | "side") => void; // 型変更
  onUnifyLanguage: () => void;
  isProcessing: boolean;
};

export default function DeckPanel({ 
  deck = [], 
  sideboard = [],
  deckName, 
  onChangeDeckName, 
  onRemove, 
  onUnifyLanguage, 
  isProcessing 
}: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState<"main" | "side">("main"); // タブ切り替え
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const mainCount = deck.reduce((acc, c) => acc + c.quantity, 0);
  const sideCount = sideboard.reduce((acc, c) => acc + c.quantity, 0);

  // 【重要】エクスポート処理
  const handleExport = (format: "arena" | "mo" | "jp") => {
    
    // カード1枚のテキスト化関数
    const formatCard = (c: DeckCard) => {
      switch (format) {
        case "arena":
          // Arena: 4 Name (SET) CN
          return `${c.quantity} ${c.name} (${c.set.toUpperCase()}) ${c.collector_number}`;
        case "mo":
          // Simple: 4 Name
          return `${c.quantity} ${c.name}`;
        case "jp":
          // Japanese: 4 日本語名
          return `${c.quantity} ${c.printed_name ?? c.name}`;
        default: return "";
      }
    };

    const mainText = deck.map(formatCard).join("\n");
    const sideText = sideboard.map(formatCard).join("\n");

    // アリーナ形式の構造: Deck \n ... \n\n Sideboard \n ...
    let fullText = "";
    
    if (format === "arena") {
        fullText = `Deck\n${mainText}`;
        if (sideboard.length > 0) {
            fullText += `\n\nSideboard\n${sideText}`;
        }
    } else {
        // その他の形式も同じ構造で出力しておくと便利
        fullText = `Deck\n${mainText}\n\nSideboard\n${sideText}`;
    }

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setShowExportMenu(false);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col gap-3">
        
        {/* デッキ名 */}
        <div>
          <input
            type="text"
            value={deckName}
            onChange={(e) => onChangeDeckName(e.target.value)}
            placeholder="Deck Name"
            className="w-full bg-transparent text-lg font-bold text-white placeholder-slate-600 border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none transition-colors px-1"
          />
        </div>

        <div className="flex justify-between items-center">
          {/* メイン/サイド切り替えタブ */}
          <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
            <button
              onClick={() => setActiveTab("main")}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === "main" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Main ({mainCount})
            </button>
            <button
              onClick={() => setActiveTab("side")}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${activeTab === "side" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Side ({sideCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 言語統一ボタン */}
            <button
               onClick={onUnifyLanguage}
               disabled={isProcessing}
               className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors"
               title="全カードの言語を統一"
             >
               <RefreshCw size={14} className={isProcessing ? "animate-spin" : ""} />
             </button>

            {/* エクスポートメニュー */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
              >
                {copied ? <Check size={14} /> : <Download size={14} />}
                <span>Export</span>
                <ChevronDown size={12} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 overflow-hidden">
                  <div className="p-2 text-xs text-slate-400 font-bold border-b border-slate-700">Format</div>
                  <button onClick={() => handleExport("arena")} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors">
                    MTG Arena <span className="text-xs text-slate-500">(Importable)</span>
                  </button>
                  <button onClick={() => handleExport("mo")} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors">
                    Simple List <span className="text-xs text-slate-500">(Name only)</span>
                  </button>
                  <button onClick={() => handleExport("jp")} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors">
                    日本語リスト <span className="text-xs text-slate-500">(Text)</span>
                  </button>
                </div>
              )}
              {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />}
            </div>

            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            
            {/* 表示モード */}
            <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
              <button onClick={() => setViewMode("list")} className={`p-1 rounded ${viewMode === "list" ? "bg-slate-600 text-white" : "text-slate-400"}`}><ListIcon size={14} /></button>
              <button onClick={() => setViewMode("grid")} className={`p-1 rounded ${viewMode === "grid" ? "bg-slate-600 text-white" : "text-slate-400"}`}><LayoutGrid size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "main" ? (
          <CardView 
             cards={deck} 
             mode={viewMode} 
             onAction={(c) => onRemove(c, "main")} 
             actionType="remove" 
             isDeckArea={true} 
          />
        ) : (
          <CardView 
             cards={sideboard} 
             mode={viewMode} 
             onAction={(c) => onRemove(c, "side")} 
             actionType="remove" 
             isDeckArea={true} 
          />
        )}
      </div>
    </div>
  );
}