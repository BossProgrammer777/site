import Script from 'next/script';

// Подключает Google Analytics, Google Ads и Meta (Facebook) Pixel по ID из env:
//   NEXT_PUBLIC_GA_ID       — напр. G-XXXXXXX  (Google Analytics)
//   NEXT_PUBLIC_GADS_ID     — напр. AW-XXXXXXX (Google Ads — для конверсий)
//   NEXT_PUBLIC_FB_PIXEL_ID — напр. 1234567890 (Meta Pixel)
// Без ID соответствующий тег не рендерится.
export function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const ads = process.env.NEXT_PUBLIC_GADS_ID;
  const pixel = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  // gtag.js достаточно подключить один раз — он обслуживает и GA, и Google Ads.
  const gtagId = ga || ads;

  return (
    <>
      {gtagId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
${ga ? `gtag('config', '${ga}');` : ''}
${ads ? `gtag('config', '${ads}');` : ''}`}
          </Script>
        </>
      )}

      {pixel && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixel}');
fbq('track', 'PageView');`}
        </Script>
      )}
    </>
  );
}
