"use client";

import { useState, useEffect } from "react";
import { useBannedCards } from "@/hooks/useBannedCards";
import { EXPANSIONS } from "@/types";
import { Trash2, Plus, AlertTriangle, Loader2, Search, X } from "lucide-react";

type SearchCandidate = {
  name: string; // 英語名
  printed_name?: string; // 日本語名など
  set: string;
  image_uri?: string;
};

export default function BannedCardsAdmin() {
  const { bannedMap, loading, addBannedCard, removeBannedCard } = useBannedCards();
  
  // フォーム用State
  const [cardName, setCardName] = useState("");
  const [targetSet, setTargetSet] = useState("neo");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ★追加: 検索機能用State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Scryfallでカードを検索
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setShowResults(true);
    setSearchResults([]);

    try {
      // 英語名と日本語名の両方で検索できるようにする
      // unique:cards にすることで同名カードをまとめる
      const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)} unique:cards`);
      const data = await res.json();

      if (data.data) {
        const candidates = data.data.map((c: any) => ({
          name: c.name, // これが登録すべき英語名
          printed_name: c.printed_name, // 表示用の日本語名
          set: c.set,
          image_uri: c.image_uris?.art_crop || c.card_faces?.[0]?.image_uris?.art_crop
        })).slice(0, 10); // 上位10件のみ表示
        setSearchResults(candidates);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  // 候補を選択した時の処理
  const selectCard = (card: SearchCandidate) => {
    setCardName(card.name); // 正確な英語名をセット
    setSearchQuery(""); // 検索欄をクリア
    setShowResults(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName) return;
    
    setIsSubmitting(true);
    await addBannedCard(targetSet, cardName, reason);
    setCardName("");
    setReason("");
    setIsSubmitting(false);
  };

  // 表示用にマップをフラットな配列に変換
  const flatList = Object.entries(bannedMap).flatMap(([setCode, cards]) => 
    cards.map(card => ({ ...card, set: setCode }))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-2">
          <AlertTriangle /> 禁止カード管理 (Firebase)
        </h1>

        {/* 登録フォーム */}
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 mb-8 space-y-4">
          
          {/* ★追加: カード検索エリア */}
          <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
            <label className="block text-xs font-bold text-blue-400 mb-2">Step 1: カードを検索して選択</label>
            <div className="relative flex gap-2">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="カード名を入力 (日本語OK)"
                className="flex-1 bg-slate-950 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2"
              >
                {isSearching ? <Loader2 className="animate-spin" size={16}/> : <Search size={16} />}
                検索
              </button>

              {/* 検索結果リスト */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded shadow-xl z-10 max-h-60 overflow-y-auto">
                  <div className="flex justify-between items-center p-2 border-b border-slate-700 bg-slate-900/90 sticky top-0">
                    <span className="text-xs text-slate-400">検索結果</span>
                    <button onClick={() => setShowResults(false)}><X size={14} /></button>
                  </div>
                  {searchResults.length === 0 && !isSearching ? (
                    <div className="p-4 text-center text-slate-500 text-sm">見つかりませんでした</div>
                  ) : (
                    searchResults.map((card) => (
                      <button
                        key={`${card.set}-${card.name}`}
                        onClick={() => selectCard(card)}
                        className="w-full text-left p-2 hover:bg-slate-700 flex items-center gap-3 border-b border-slate-700/50 last:border-0"
                      >
                        {/* アートクロップ画像があれば表示 */}
                        {card.image_uri ? (
                          <img src={card.image_uri} alt="" className="w-10 h-8 object-cover rounded shadow-sm" />
                        ) : (
                          <div className="w-10 h-8 bg-slate-600 rounded" />
                        )}
                        <div>
                          <div className="font-bold text-sm text-white">{card.printed_name || card.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{card.name}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 my-4"></div>

          <label className="block text-xs font-bold text-red-400 mb-2">Step 2: 禁止設定を登録</label>
          <form onSubmit={handleAdd} className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">カード名 (英語)</label>
              <input 
                type="text" 
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white font-mono bg-slate-900/50"
                placeholder="上の検索から自動入力されます"
                required
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-bold text-slate-500 mb-1">セット</label>
              <select 
                value={targetSet}
                onChange={(e) => setTargetSet(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
              >
                {EXPANSIONS.map(ex => (
                  <option key={ex.code} value={ex.code}>{ex.code.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">理由</label>
              <input 
                type="text" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                placeholder="任意入力"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting || loading || !cardName}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18} />}
              登録
            </button>
          </form>
        </div>

        {/* 一覧 */}
        <div className="bg-slate-900 rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-3">Set</th>
                <th className="p-3">Name</th>
                <th className="p-3">Reason</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center">Loading...</td></tr>
              ) : flatList.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No Banned Cards</td></tr>
              ) : (
                flatList.map((item) => (
                  <tr key={`${item.set}-${item.name}`}>
                    <td className="p-3 font-mono text-yellow-500 font-bold">{item.set.toUpperCase()}</td>
                    <td className="p-3 font-medium text-white font-mono">{item.name}</td>
                    <td className="p-3 text-slate-400">{item.reason}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => removeBannedCard(item.set, item.name)} className="text-slate-500 hover:text-red-400 p-1">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}