import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "Nirog: cheaper exact substitutes for your medicines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview card shown when a Nirog link is shared. Built once at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#f7f8f6", color: "#17201b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: 28, background: "#0f7a55", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", width: 15, height: 54, borderRadius: 8, background: "#fff" }} />
            <div style={{ position: "absolute", width: 54, height: 15, borderRadius: 8, background: "#fff" }} />
          </div>
          <div style={{ fontSize: 64, fontWeight: 700 }}>Nirog</div>
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 48, lineHeight: 1.1 }}>Pay less for the same medicine</div>
        <div style={{ fontSize: 34, marginTop: 28, color: "#5b675f" }}>
          Exact substitutes from Jan Aushadhi and other brands: same salts, strength and form.
        </div>
      </div>
    ),
    size,
  );
}
