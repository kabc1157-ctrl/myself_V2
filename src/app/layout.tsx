import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./legal.css";
import "./home-summary.css";

export const metadata: Metadata = { title: "이음새 2.0", description: "기록에서 나를 찾다." };

const gmarketSans = localFont({ src: [{ path: "./fonts/GmarketSansTTFMedium.woff2", weight: "500" }, { path: "./fonts/GmarketSansTTFBold.woff2", weight: "700" }], variable: "--font-gmarket-sans", display: "swap" });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html className={gmarketSans.variable} lang="ko"><body>{children}</body></html>;
}
