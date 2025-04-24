import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Custom Duty Schedule",
  description: "기관별 맞춤 당직표 생성기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
        <head>
        {/* ✅ 카카오 애드핏 스크립트 삽입 */}
        <Script
          src="//t1.daumcdn.net/kas/static/ba.min.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen relative overflow-x-hidden`}>
        {/* 💫 그라데이션 배경 (다크모드 대응!) */}
        <div className="absolute inset-0 -z-10 
          bg-[linear-gradient(to_bottom_right,rgba(255,236,179,0.3),rgba(255,205,210,0.3),rgba(248,187,208,0.3))] 
          dark:bg-[linear-gradient(to_bottom_right,rgba(30,30,30,0.8),rgba(50,50,50,0.7),rgba(20,20,20,0.8))]"
        />

        <Header />
        <main className="flex-1 pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}