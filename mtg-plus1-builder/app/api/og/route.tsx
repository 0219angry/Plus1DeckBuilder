import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // URLパラメータから情報を取得 (なければデフォルト値)
    const title = searchParams.get('title')?.slice(0, 100) || 'Untitled Deck';
    const builder = searchParams.get('builder')?.slice(0, 50) || 'Unknown Builder';
    const format = searchParams.get('format') || 'PLUS1';
    
    // 日本語フォント (Noto Sans JP) をGoogle Fontsから読み込む
    // ※日本語を表示するには必須です
    const fontData = await fetch(
      new URL('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap', request.url)
    ).then((res) => res.text());

    // CSSの@font-faceからURLを抽出してフォントバッファを取得する簡易ロジック
    const fontUrl = fontData.match(/src: url\((.+?)\)/)?.[1];
    if (!fontUrl) throw new Error('Failed to load font');
    const fontArrayBuffer = await fetch(fontUrl).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#020617', // slate-950
            backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            color: 'white',
            fontFamily: '"Noto Sans JP"',
          }}
        >
          {/* 背景の装飾 (光る枠線) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '20px solid #1e293b', // slate-800
              display: 'flex',
            }}
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, padding: '40px 80px', textAlign: 'center' }}>
            
            {/* ロゴ部分 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
              <div
                style={{
                  display: 'flex',
                  width: '60px',
                  height: '60px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563eb, #06b6d4)', // blue to cyan
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5)',
                }}
              >
                +1
              </div>
              <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#94a3b8' }}>
                MtG PLUS1 Deck Builder
              </div>
            </div>

            {/* デッキ名 */}
            <div
              style={{
                fontSize: '60px',
                fontWeight: 'bold',
                backgroundImage: 'linear-gradient(90deg, #fff, #cbd5e1)',
                backgroundClip: 'text',
                color: 'transparent',
                marginBottom: '20px',
                lineHeight: 1.2,
                textShadow: '0 0 40px rgba(56, 189, 248, 0.2)',
              }}
            >
              {title}
            </div>

            {/* 製作者情報 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
              <div
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#1e293b',
                  borderRadius: '999px',
                  fontSize: '24px',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                }}
              >
                Built by {builder}
              </div>
              
              <div
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '999px',
                  fontSize: '24px',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                {format}
              </div>
            </div>

          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Noto Sans JP',
            data: fontArrayBuffer,
            style: 'normal',
            weight: 700,
          },
        ],
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}