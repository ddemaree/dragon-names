import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Font files are licensed, so they're downloaded at build time by scripts/fetch-fonts.mjs
const roslindale = localFont({
  src: "../fonts/licensed/RoslindaleVariableV2-VF.woff2",
  weight: "200 900",
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
  variable: "--next-font-roslindale",
});

const polymath = localFont({
  src: [
    { path: "../fonts/licensed/PolymathVar.woff2", style: "normal" },
    { path: "../fonts/licensed/PolymathVar.woff2", style: "italic" },
  ],
  weight: "100 900",
  variable: "--next-font-polymath",
});

export const metadata: Metadata = {
  title: "June's Dragon Generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${roslindale.variable} ${polymath.variable}`}>
      <body>{children}</body>
    </html>
  );
}
