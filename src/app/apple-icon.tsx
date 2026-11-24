import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS: the same green cross as icon.svg. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0f7a55", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", width: 28, height: 100, borderRadius: 14, background: "#fff" }} />
        <div style={{ position: "absolute", width: 100, height: 28, borderRadius: 14, background: "#fff" }} />
      </div>
    ),
    size,
  );
}
