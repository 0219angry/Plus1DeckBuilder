import React from "react";

export default function Footer() {
  return (
    <footer className="py-3 px-4 bg-slate-950 border-t border-slate-900 text-[10px] text-slate-500 text-center leading-relaxed shrink-0 z-10">
      <p className="mb-1">
        本サイトは、ファンコンテンツ・ポリシーに沿った非公式のファンコンテンツです。
        ウィザーズ社の認可/許諾は得ていません。
        題材の一部に、ウィザーズ・オブ・ザ・コースト社の財産を含んでいます。
        ©Wizards of the Coast LLC.
      </p>
      <p>
        Card data and images provided by{" "}
        <a 
          href="https://scryfall.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline hover:text-slate-400 transition-colors"
        >
          Scryfall
        </a>
        .
      </p>
    </footer>
  );
}