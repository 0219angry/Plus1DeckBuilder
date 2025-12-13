"use client";

import { X, Search, MousePointerClick, Save, BarChart3, Play, Info, Key, Share2, HelpCircle } from "lucide-react";
import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SECTIONS = [
  {
    id: "basic",
    title: "基本フロー",
    icon: MousePointerClick,
    content: (
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-blue-400">デッキ作成の基本</h3>
        <ul className="list-disc list-inside space-y-2 text-slate-300">
          <li>
            左側のパネルで<strong className="text-white">「Search」</strong>タブを選び、カードを探します。
          </li>
          <li>
            カードをクリック（またはタップ）すると、デッキ（メインボード）に追加されます。
          </li>
          <li>
            デッキに追加されたカードをクリックすると、枚数が減ります（0枚で削除）。
          </li>
          <li>
            <strong className="text-white">「Save」</strong>ボタンでクラウドに保存し、URLを発行できます。
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "search",
    title: "検索のコツ",
    icon: Search,
    content: (
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-purple-400">高度な検索テクニック</h3>
        <p className="text-slate-300">
          検索ボックスでは、Scryfall準拠の構文が一部使用可能です。
        </p>
        <div className="bg-slate-800 p-3 rounded space-y-2 border border-slate-700">
          <div>
            <span className="text-xs font-bold text-slate-500 block">色指定</span>
            <code className="bg-slate-900 px-1 py-0.5 rounded text-green-400 text-sm">c:red</code>
            <span className="text-sm ml-2 text-slate-300">赤を含むカード</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">タイプ指定</span>
            <code className="bg-slate-900 px-1 py-0.5 rounded text-green-400 text-sm">t:instant</code>
            <span className="text-sm ml-2 text-slate-300">インスタントのみ</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">マナコスト</span>
            <code className="bg-slate-900 px-1 py-0.5 rounded text-green-400 text-sm">mv=3</code>
            <span className="text-sm ml-2 text-slate-300">マナ総量が3</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          ※ 日本語入力時は自動的に英語名への変換を試みますが、ヒットしない場合は英語名での検索をお試しください。
        </p>
      </div>
    ),
  },
  {
    id: "deck",
    title: "デッキ操作",
    icon: Key,
    content: (
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-orange-400">便利なデッキ編集機能</h3>
        <ul className="space-y-3 text-slate-300">
          <li className="flex gap-2">
            <div className="shrink-0 bg-slate-800 p-1 rounded"><Key size={16} className="text-yellow-400"/></div>
            <div>
              <strong>キーカード設定:</strong> カード左上の★マークをクリックすると「キーカード」に設定でき、画像生成時に強調表示されます。
            </div>
          </li>
          <li className="flex gap-2">
            <div className="shrink-0 bg-slate-800 p-1 rounded"><Share2 size={16} className="text-blue-400"/></div>
            <div>
              <strong>サイドボード:</strong> デッキパネル上部の「Side」タブに切り替えてからカードを追加すると、サイドボードに入ります。
            </div>
          </li>
          <li className="flex gap-2">
            <div className="shrink-0 bg-slate-800 p-1 rounded"><MousePointerClick size={16} className="text-slate-400"/></div>
            <div>
              <strong>表示切替:</strong> リストアイコン/グリッドアイコンで表示形式を変更できます。
            </div>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "tools",
    title: "分析・ツール",
    icon: BarChart3,
    content: (
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-green-400">分析とソリティア</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="border border-slate-700 rounded p-3 bg-slate-800/50">
            <div className="flex items-center gap-2 mb-1 font-bold text-purple-400">
              <BarChart3 size={16} /> Stats (統計)
            </div>
            <p className="text-sm text-slate-300">
              マナカーブ、色の分布、カードタイプ配分をグラフで確認できます。バランス調整に役立ちます。
            </p>
          </div>
          <div className="border border-slate-700 rounded p-3 bg-slate-800/50">
            <div className="flex items-center gap-2 mb-1 font-bold text-green-400">
              <Play size={16} /> Solitaire (一人回し)
            </div>
            <p className="text-sm text-slate-300">
              初手7枚のシミュレーションができます。「マリガン」や「1ターン進める（ドロー）」操作で事故率を確認できます。
            </p>
          </div>
          <div className="border border-slate-700 rounded p-3 bg-slate-800/50">
            <div className="flex items-center gap-2 mb-1 font-bold text-yellow-400">
              <Info size={16} /> Info (詳細)
            </div>
            <p className="text-sm text-slate-300">
              アーキタイプ、コンセプト、ターンごとの動き（ゲームプラン）をメモできます。これらは画像生成時に反映されます。
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "save",
    title: "保存と共有",
    icon: Save,
    content: (
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-blue-400">クラウド保存の仕組み</h3>
        <p className="text-slate-300">
          「保存して共有」ボタンを押すと、2つのURLが発行されます。
        </p>
        <div className="space-y-3 mt-2">
          <div className="bg-slate-800 p-2 rounded border-l-4 border-green-500">
            <div className="text-xs font-bold text-green-400 mb-1">公開用URL</div>
            <p className="text-sm text-slate-300">
              SNSなどでシェアするためのURLです。閲覧のみが可能で、編集はできません。
            </p>
          </div>
          <div className="bg-slate-800 p-2 rounded border-l-4 border-red-500">
            <div className="text-xs font-bold text-red-400 mb-1">編集用URL (重要)</div>
            <p className="text-sm text-slate-300">
              あなた専用の編集URLです。ブラウザのブックマークに保存してください。
              <br/>
              <span className="text-yellow-400 text-xs">※ URLを紛失すると再編集できなくなります。</span>
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function HelpModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState("basic");

  if (!isOpen) return null;

  const activeContent = SECTIONS.find(s => s.id === activeTab)?.content;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <h2 className="font-bold text-white flex items-center gap-2 text-lg">
            <HelpCircle className="text-blue-400" />
            使い方ガイド
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-40 bg-slate-950/50 border-r border-slate-800 overflow-y-auto">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-2 transition-colors border-l-2 ${
                  activeTab === section.id
                    ? "bg-slate-800 text-blue-400 border-blue-500"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border-transparent"
                }`}
              >
                <section.icon size={16} />
                {section.title}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
            {activeContent}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}