import type { Metadata } from "next";
import "./globals.css";

const APP_URL = "https://personal-uxo-vibecoding-k4sv.vercel.app";

export const metadata: Metadata = {
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
