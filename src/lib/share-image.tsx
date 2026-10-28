import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { faDragon } from "@fortawesome/pro-duotone-svg-icons";

export const shareImageSize = { width: 1200, height: 630 };

// Downloaded at build time by scripts/fetch-fonts.mjs; the image renderer can't read WOFF2
const roslindale = readFile(
  path.join(process.cwd(), "src/fonts/licensed/RoslindaleV2-DisplayLight.ttf"),
);

type Props = {
  eyebrow?: string;
  title: string;
  subtitle: string;
};

// A link preview card in the Night flight look: dragon, a small line, a big Roslindale title
export async function shareImage({ eyebrow, title, subtitle }: Props) {
  const [width, height, , , paths] = faDragon.icon;
  const [secondary, primary] = Array.isArray(paths) ? paths : ["", paths];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          textAlign: "center",
          fontFamily: "Roslindale",
          color: "#f4eeff",
          backgroundColor: "#150d2b",
          backgroundImage: [
            "radial-gradient(circle at 12% 10%, rgba(255,111,181,0.55) 0%, transparent 40%)",
            "radial-gradient(circle at 90% 18%, rgba(94,200,255,0.45) 0%, transparent 38%)",
            "radial-gradient(circle at 80% 95%, rgba(255,176,112,0.4) 0%, transparent 38%)",
            "radial-gradient(circle at 15% 85%, rgba(139,108,255,0.55) 0%, transparent 42%)",
          ].join(", "),
        }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} width={120} height={96}>
          <path d={secondary} fill="#7cc8ff" />
          <path d={primary} fill="#ffb8dd" />
        </svg>
        {eyebrow && <div style={{ marginTop: 28, fontSize: 32, color: "#c9beea" }}>{eyebrow}</div>}
        <div
          style={{
            marginTop: eyebrow ? 8 : 28,
            fontSize: title.length > 24 ? 92 : 120,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            color: "#ffffff",
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 28, fontSize: 36, lineHeight: 1.25, color: "#ffd3a6" }}>{subtitle}</div>
      </div>
    ),
    {
      ...shareImageSize,
      fonts: [{ name: "Roslindale", data: await roslindale, style: "normal", weight: 300 }],
    },
  );
}
