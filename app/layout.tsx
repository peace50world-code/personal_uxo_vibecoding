import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-8XPMX50DXC";

const APP_URL = "https://personal-uxo-vibecoding-k4sv.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "참아낸다이어",
  description: "참은 소비를 기록하고 친구들과 공유하는 절약 챌린지",
  openGraph: {
    title: "참아낸다이어",
    description: "절약 챌린지를 함께해요 🐷",
    url: APP_URL,
    siteName: "참아낸다이어",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "참아낸다이어",
    description: "절약 챌린지를 함께해요 🐷",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-full">
        {children}
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
