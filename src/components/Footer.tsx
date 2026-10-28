"use client";

import { useEffect } from "react";
import type { BnlLogoElement } from "bitsandletters-logo";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "bnl-logo": React.HTMLAttributes<HTMLElement> &
        Partial<Pick<BnlLogoElement, "variant" | "theme" | "href" | "caption">>;
    }
  }
}

export default function Footer() {
  // The package defines <bnl-logo> when imported, which needs the browser
  useEffect(() => {
    import("bitsandletters-logo");
  }, []);

  return (
    <footer className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-muted">
      <bnl-logo variant="small-lockup" theme="on-dark">
        A project by Bits&amp;Letters
      </bnl-logo>
      <p>Made by <a href="https://demaree.me">David Demaree</a>. Stories are written by AI.</p>
    </footer>
  );
}
