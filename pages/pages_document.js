import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="zh-Hant">
      <Head>
        {/* PWA：讓瀏覽器知道 manifest 在哪裡 */}
        <link rel="manifest" href="/manifest.json" />
		<link rel="apple-touch-icon" href="/apple-touch-icon-v2.png" />
        {/* 狀態列、標題列的顏色（手機上會看到） */}
        <meta name="theme-color" content="#38bdf8" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
