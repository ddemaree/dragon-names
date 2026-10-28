import type { Metadata } from "next";
import FathomAnalytics from "@/components/Fathom";
import "./globals.css";

export const metadata: Metadata = {
  title: "June's Dragon Generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FathomAnalytics />
        {children}
      </body>
    </html>
  );
}
