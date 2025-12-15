import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ★追加: 表示タイプ (deck | profile | site)
    const type = searchParams.get('type') || 'deck';
    
    // 共通パラメータ
    const title = searchParams.get('title')?.slice(0, 100) || 'MtG PLUS1';
    
    // デッキ用・ユーザー用パラメータ
    const subText = searchParams.get('subText')?.slice(0, 50); // builder名やIDなど

    // 日本語フォント読み込み
    const fontData = await fetch(
      new URL('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap', request.url)
    ).then((res) => res.text());
    const fontUrl = fontData.match(/src: url\((.+?)\)/)?.[1];
    if (!fontUrl) throw new Error('Failed to load font');
    const fontArrayBuffer = await fetch(fontUrl).then((res) => res.arrayBuffer());

    // --- コンテンツの切り替えロジック ---
    let content;

    // A. トップページ (Site) 用デザイン
    if (type === 'site') {
      content = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* ロゴ特大 */}
          <div
            style={{
              display: 'flex',
              width: '120px',
              height: '120px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              color: 'white',
              fontSize: '64px',
              fontWeight: 'bold',
              marginBottom: '40px',
              boxShadow: '0 20px 50px -10px rgba(37, 99, 235, 0.6)',
            }}
          >
            +1
          </div>
          <div style={{ fontSize: '70px', fontWeight: 'bold', color: 'white', lineHeight: 1.1 }}>
            MtG PLUS1<br/>Deck Builder
          </div>
          <div style={{ fontSize: '30px', color: '#94a3b8', marginTop: '30px' }}>
            Simple, Fast, and Shareable Deck Builder
          </div>
        </div>
      );
    } 
    // B. ユーザープロフィール (Profile) 用デザイン
    else if (type === 'profile') {
      content = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#60a5fa', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '4px' }}>
            Deck Builder Profile
          </div>
          <div
            style={{
              fontSize: '70px',
              fontWeight: 'bold',
              backgroundImage: 'linear-gradient(90deg, #fff, #cbd5e1)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '30px',
            }}
          >
            {title}
          </div>
          <div style={{ 
            padding: '10px 30px', 
            background: '#1e293b', 
            borderRadius: '99px', 
            color: '#94a3b8',
            fontSize: '28px',
            border: '1px solid #334155'
          }}>
            Check out my decks on MtG PLUS1
          </div>
        </div>
      );
    }
    // C. デッキ詳細 (Deck) 用デザイン (既存のものを微調整)
    else {
      content = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* ロゴ小 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
            <div
              style={{
                display: 'flex', width: '60px', height: '60px', alignItems: 'center', justifyContent: 'center',
                borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', color: 'white',
                fontSize: '32px', fontWeight: 'bold', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5)',
              }}
            >
              +1
            </div>
            <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#94a3b8' }}>
              MtG PLUS1
            </div>
          </div>
          {/* デッキ名 */}
          <div
            style={{
              fontSize: '60px', fontWeight: 'bold',
              backgroundImage: 'linear-gradient(90deg, #fff, #cbd5e1)', backgroundClip: 'text', color: 'transparent',
              marginBottom: '20px', lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {/* 製作者・フォーマット */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
             <div style={{ padding: '10px 24px', backgroundColor: '#1e293b', borderRadius: '999px', fontSize: '24px', color: '#e2e8f0', border: '1px solid #334155' }}>
                Built by {subText || 'Anonymous'}
             </div>
          </div>
        </div>
      );
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#020617',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            color: 'white', fontFamily: '"Noto Sans JP"',
          }}
        >
          {/* 背景の装飾枠 */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '20px solid #1e293b', display: 'flex' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, padding: '40px 80px', width: '100%' }}>
            {content}
          </div>
        </div>
      ),
      {
        width: 1200, height: 630,
        fonts: [{ name: 'Noto Sans JP', data: fontArrayBuffer, style: 'normal', weight: 700 }],
      },
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}