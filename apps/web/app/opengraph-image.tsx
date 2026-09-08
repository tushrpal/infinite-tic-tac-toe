import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo/config";

export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          background: "linear-gradient(135deg, #0f0f14 0%, #1a1033 50%, #0f0f14 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Decorative grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.08,
            backgroundImage:
              "linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "48px",
          }}
        >
          {/* Mini board preview */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 64px)",
              gap: "8px",
              marginBottom: "40px",
            }}
          >
            {["X", "", "O", "", "X", "", "O", "", "X"].map((mark, i) => (
              <div
                key={i}
                style={{
                  width: 64,
                  height: 64,
                  background: "#16161d",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: 700,
                  color: mark === "X" ? "#00d4ff" : mark === "O" ? "#ff6b9d" : "transparent",
                }}
              >
                {mark}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "white",
              textAlign: "center",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Infinite Tic-Tac-Toe
          </div>

          <div
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.4,
            }}
          >
            Free online multiplayer · Ranked play · Sliding & Expanding modes
          </div>

          <div
            style={{
              marginTop: 32,
              padding: "12px 32px",
              background: "linear-gradient(90deg, #8b5cf6, #6d28d9)",
              borderRadius: 12,
              color: "white",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Play Now — No Download
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
