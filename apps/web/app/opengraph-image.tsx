import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo/config";

// Edge, not Node: on Next 14 the Node runtime fails to load @vercel/og's
// bundled font on Windows. The artwork is bundled via `new URL(..., import.meta.url)`.
export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function asDataUri(url: URL, mime: string) {
  const buf = await (await fetch(url)).arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + 0x8000)),
    );
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

// Mirrors the homepage hero: space backdrop, glowing board on the right,
// headline on the left. Satori supports flexbox only (no CSS grid).
export default async function OpenGraphImage() {
  const [bg, board] = await Promise.all([
    asDataUri(new URL("../public/assets/homeBg.jpg", import.meta.url), "image/jpeg"),
    asDataUri(new URL("../public/assets/board.png", import.meta.url), "image/png"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#07060f",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bg}
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0, objectFit: "cover" }}
          alt=""
        />
        {/* Darken the left side so the headline stays readable. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(90deg, rgba(7,6,15,0.92) 0%, rgba(7,6,15,0.7) 45%, rgba(7,6,15,0.1) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 72,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 20,
              letterSpacing: 8,
              color: "#d4d4d8",
              marginBottom: 20,
            }}
          >
            THE BOARD NEVER STAYS STILL
          </div>
          <div style={{ fontSize: 92, fontWeight: 800, color: "white", lineHeight: 1 }}>
            INFINITE
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#c084fc",
              marginBottom: 24,
            }}
          >
            TIC-TAC-TOE
          </div>
          <div style={{ fontSize: 24, letterSpacing: 6, color: "#e4e4e7", marginBottom: 36 }}>
            FREE ONLINE MULTIPLAYER
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "14px 34px",
              background: "linear-gradient(90deg, #a855f7, #7c3aed)",
              borderRadius: 12,
              color: "white",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            Play Now — No Download
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={board}
          width={500}
          height={500}
          style={{ position: "absolute", right: 40, top: 65 }}
          alt=""
        />
      </div>
    ),
    { ...size }
  );
}
