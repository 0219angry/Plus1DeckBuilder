"use client";

import { 
  X, 
  Search, 
  MousePointerClick, 
  BarChart3, 
  Play, 
  Share2, 
  HelpCircle, 
  Gamepad2, 
  LayoutDashboard, 
  // 以下、ボタン説明用にアイコンを追加
  Trash2,
  Sparkles,
  Upload,
  Download,
  List,
  LayoutGrid,
  Settings2
} from "lucide-react";
import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SECTIONS = [
  {
    id: "basic",
    title: "基本 & PLUS1ルール",
    icon: MousePointerClick,
    content: (
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-lg text-blue-400 mb-2">PLUS1 フォーマットとは？</h3>
          <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-lg">
            <p className="text-slate-200 mb-2">
              <strong>「基本セット(Foundations)」</strong> ＋ <strong>「好きなエキスパンション1つ」</strong>
            </p>
            <p className="text-sm text-slate-400">
              この2つのセットに含まれるカードのみを使用して構築する、シンプルかつ奥深い限定構築戦です。
              当ビルダーでは、エキスパンションを選択すると自動的にフィルタリングがかかります。
            </p>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-lg text-white mb-2">デッキ作成の流れ</h3>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>
              <strong className="text-white">セット選択:</strong> 画面右上のドロップダウンから、相棒となるエキスパンションを選びます。
            </li>
            <li>
              <strong className="text-white">カード検索:</strong> 左パネルでカードを探し、クリックしてデッキに追加します。
            </li>
            <li>
              <strong className="text-white">調整:</strong> -/+ボタンで枚数を調整、Main/Sideを切り替えてデッキを完成させます。
            </li>
          </ul>
        </section>
      </div>
    ),
  },
  {
    id: "buttons",
    title: "パネル機能・ボタン",
    icon: Settings2,
    content: (
      <div className="space-y-6">
        <h3 className="font-bold text-lg text-white mb-4">デッキパネルの機能</h3>
        <div className="grid gap-4">
          
          <div className="flex gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="shrink-0 pt-1">
              <div className="p-2 bg-slate-800 rounded border border-slate-600 text-slate-300">
                <Trash2 size={20} />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-red-400 text-sm mb-1">リセット</h4>
              <p className="text-xs text-slate-400">
                現在のデッキ内容（カード・デッキ名など）を全て消去します。取り消しできないためご注意ください。
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="shrink-0 pt-1">
              <div className="p-2 bg-slate-800 rounded border border-slate-600 text-slate-300">
                <Sparkles size={20} />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">言語統一</h4>
              <p className="text-xs text-slate-400">
                リスト内のカード名を選択した言語に統一し、リーガルチェックを行います。
                このボタンを押してもエラーが出ている場合、それは使用できないカードです。
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="shrink-0 pt-1">
              <div className="p-2 bg-slate-800 rounded border border-slate-600 text-slate-300">
                <Upload size={20} />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">インポート (Import)</h4>
              <p className="text-xs text-slate-400">
                MTG Arena形式やテキスト形式のデッキリストを読み込みます。
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="shrink-0 pt-1">
              <div className="p-2 bg-blue-600 rounded border border-blue-500 text-white">
                <Download size={20} />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">エクスポート (Export)</h4>
              <p className="text-xs text-slate-400 mb-2">
                メニューを開き、以下の形式で出力できます。
              </p>
              <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 ml-1">
                <li><strong className="text-slate-300">MTG Arena:</strong> アリーナインポート用テキスト</li>
                <li><strong className="text-slate-300">Simple List:</strong> カード名のみのリスト</li>
                <li><strong className="text-slate-300">Image (.png):</strong> デッキリスト画像を作成して保存</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="shrink-0 pt-1 flex gap-1">
              <div className="p-1.5 bg-slate-800 rounded border border-slate-600 text-slate-300"><List size={16} /></div>
              <div className="p-1.5 bg-slate-800 rounded border border-slate-600 text-slate-300"><LayoutGrid size={16} /></div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">表示切り替え</h4>
              <p className="text-xs text-slate-400">
                カードの表示形式を「リスト」と「グリッド」で切り替えます。
              </p>
            </div>
          </div>

        </div>
      </div>
    ),
  },
  {
    id: "account",
    title: "保存とアカウント",
    icon: LayoutDashboard,
    content: (
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-lg text-green-400 mb-2">ログインのメリット</h3>
          <p className="text-slate-300 mb-3">
            Googleアカウントでログインすると、以下の機能が解放されます。
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex gap-3 bg-slate-800/50 p-3 rounded border border-slate-700">
              <div className="shrink-0 bg-blue-500/20 p-2 rounded text-blue-400"><LayoutDashboard size={20} /></div>
              <div>
                <h4 className="font-bold text-white text-sm">ダッシュボード管理</h4>
                <p className="text-xs text-slate-400">作成したデッキを一覧で管理・再編集・削除できます。</p>
              </div>
            </div>
            <div className="flex gap-3 bg-slate-800/50 p-3 rounded border border-slate-700">
              <div className="shrink-0 bg-purple-500/20 p-2 rounded text-purple-400"><Share2 size={20} /></div>
              <div>
                <h4 className="font-bold text-white text-sm">公開設定</h4>
                <p className="text-xs text-slate-400">「公開」「限定公開」「非公開」をデッキごとに設定できます。</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-lg text-orange-400 mb-2">ゲスト保存（未ログイン）</h3>
          <div className="bg-orange-900/20 border border-orange-800/50 p-4 rounded-lg">
            <p className="text-sm text-slate-300">
              未ログイン状態でも一時的にブラウザに保存されますが、
              <strong>キャッシュの削除などでデータが消える可能性があります。</strong>
              <br/>
              長期的な保存や共有にはログインを推奨します。
            </p>
          </div>
        </section>
      </div>
    ),
  },
  {
    id: "search",
    title: "検索テクニック",
    icon: Search,
    content: (
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-purple-400">Scryfall準拠の検索</h3>
        <p className="text-slate-300 text-sm">
          検索ボックスでは、カード名だけでなく以下の構文が使用可能です。
        </p>
        <div className="bg-slate-800 p-4 rounded-lg space-y-3 border border-slate-700">
          <div className="grid grid-cols-[100px_1fr] gap-2 items-center border-b border-slate-700 pb-2">
            <span className="text-xs font-bold text-slate-500">色</span>
            <div>
              <code className="bg-slate-950 px-1.5 py-0.5 rounded text-green-400 text-xs font-mono mr-2">c:red</code>
              <span className="text-xs text-slate-400">赤を含むカード</span>
            </div>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2 items-center border-b border-slate-700 pb-2">
            <span className="text-xs font-bold text-slate-500">タイプ</span>
            <div>
              <code className="bg-slate-950 px-1.5 py-0.5 rounded text-green-400 text-xs font-mono mr-2">t:creature</code>
              <span className="text-xs text-slate-400">クリーチャーのみ</span>
            </div>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2 items-center border-b border-slate-700 pb-2">
            <span className="text-xs font-bold text-slate-500">マナ総量</span>
            <div>
              <code className="bg-slate-950 px-1.5 py-0.5 rounded text-green-400 text-xs font-mono mr-2">mv=3</code>
              <code className="bg-slate-950 px-1.5 py-0.5 rounded text-green-400 text-xs font-mono mr-2">mv&lt;=2</code>
            </div>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
            <span className="text-xs font-bold text-slate-500">レアリティ</span>
            <div>
              <code className="bg-slate-950 px-1.5 py-0.5 rounded text-green-400 text-xs font-mono mr-2">r:rare</code>
              <span className="text-xs text-slate-400">レアのみ</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          ※ 複数の条件をスペース区切りで組み合わせ可能です。<br/>
          例: <code className="text-green-400">c:u t:instant mv=1</code> (青の1マナインスタント)
        </p>
      </div>
    ),
  },
  {
    id: "tools",
    title: "アリーナ & ツール",
    icon: Gamepad2,
    content: (
      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-orange-500/20 p-1.5 rounded text-orange-400"><Gamepad2 size={20} /></div>
            <h3 className="font-bold text-lg text-white">MTG Arena エクスポート</h3>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-300 mb-3">
              作成したデッキをMTGアリーナで使用できます。
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
              <li>画面上部のツールバーから<strong className="text-white">「Export」</strong>ボタンをクリック。</li>
              <li>クリップボードにデッキリストがコピーされます。</li>
              <li>MTGアリーナを起動し、<strong className="text-white">「Decks」タブ ＞ 「Import」</strong>を選択。</li>
              <li>自動的にデッキが構築されます。</li>
            </ol>
            <p className="text-xs text-yellow-500 mt-3 pt-3 border-t border-slate-700">
              ※ アリーナ未実装のカードが含まれる場合、インポート時にエラーが出ることがあります。
            </p>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-lg text-green-400 mb-3">その他の分析ツール</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-700 rounded p-3 bg-slate-800/30">
              <div className="flex items-center gap-2 mb-1 font-bold text-green-400 text-sm">
                <Play size={14} /> Solitaire
              </div>
              <p className="text-xs text-slate-400">
                一人回し機能。初手チェックやドローのシミュレーションが可能。
              </p>
            </div>
            <div className="border border-slate-700 rounded p-3 bg-slate-800/30">
              <div className="flex items-center gap-2 mb-1 font-bold text-purple-400 text-sm">
                <BarChart3 size={14} /> Stats
              </div>
              <p className="text-xs text-slate-400">
                マナカーブや色分布のグラフ表示。土地事故の防止に。
              </p>
            </div>
          </div>
        </section>
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
          <div className="w-16 md:w-48 bg-slate-950/50 border-r border-slate-800 overflow-y-auto shrink-0">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full text-left px-0 md:px-4 py-3 md:py-3 text-xs md:text-sm font-bold flex flex-col md:flex-row items-center md:gap-3 transition-colors border-l-2 ${
                  activeTab === section.id
                    ? "bg-slate-800 text-blue-400 border-blue-500"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border-transparent"
                }`}
              >
                <section.icon size={20} className="mb-1 md:mb-0" />
                <span className="hidden md:inline">{section.title}</span>
                <span className="md:hidden text-[10px]">{section.title.slice(0, 4)}..</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="max-w-xl mx-auto animate-in slide-in-from-right-2 duration-300">
               {activeContent}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors shadow-lg shadow-blue-900/20"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}