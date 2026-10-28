import type { Metadata } from "next";
import { Inter, Spectral, Spectral_SC } from "next/font/google";
import "./globals.css";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--next-font-spectral",
});

const spectralSC = Spectral_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--next-font-spectral-sc",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--next-font-inter",
});

export const metadata: Metadata = {
  title: "June's Dragon Generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spectral.variable} ${spectralSC.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
