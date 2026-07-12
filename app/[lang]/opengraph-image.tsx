import { ImageResponse } from 'next/og';

// Брендовая картинка-превью для ссылок (главная, категории, блог, статичные
// страницы). У страниц товара своё превью с фото — оно задаётся отдельно и
// перекрывает эту обложку.

export const alt = 'Bootsbaza — Football boots & gear';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0d0b 0%, #10261b 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 26 }}>
          <div
            style={{
              width: 116,
              height: 116,
              borderRadius: 26,
              background: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 66,
              fontWeight: 800,
              color: '#06210f',
            }}
          >
            BB
          </div>
          <div style={{ fontSize: 104, fontWeight: 800, color: '#ffffff', letterSpacing: -3 }}>
            Bootsbaza
          </div>
        </div>
        <div style={{ fontSize: 42, fontWeight: 700, color: '#37d67a' }}>
          Football boots &amp; gear
        </div>
        <div style={{ fontSize: 30, color: '#9fb3a6', marginTop: 18 }}>
          Nike · Adidas · Puma · Mizuno · Joma
        </div>
        <div style={{ position: 'absolute', bottom: 44, fontSize: 28, color: '#6b7d71' }}>
          bootsbaza.com.ua
        </div>
      </div>
    ),
    { ...size },
  );
}
