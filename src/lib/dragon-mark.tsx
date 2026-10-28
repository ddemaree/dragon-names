import { ImageResponse } from "next/og";
import { faDragon } from "@fortawesome/pro-duotone-svg-icons";

// The duotone dragon on the night ground, rendered as a PNG for the favicon and home screen icon
export function dragonMark(size: number) {
  const [width, height, , , paths] = faDragon.icon;
  const [secondary, primary] = Array.isArray(paths) ? paths : ["", paths];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: size * 0.22,
          background: "#150d2b",
        }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} width={size * 0.78} height={size * 0.62}>
          <path d={secondary} fill="#7cc8ff" />
          <path d={primary} fill="#ffb8dd" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
