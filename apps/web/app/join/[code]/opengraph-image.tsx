import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo/config";

export const runtime = "edge";
export const alt = "Join an Infinite Tic-Tac-Toe match";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function JoinOpenGraphImage({
  params,
}: {
  params: { code: string };
}) {
  const code = (params.code ?? "").toUpperCase();

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
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            marginBottom: 16,
          }}
        >
          You&apos;re invited to play
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "white",
            marginBottom: 32,
          }}
        >
          {SITE.name}
        </div>

        <div
          style={{
            padding: "20px 48px",
            background: "#16161d",
            border: "2px solid #8b5cf6",
            borderRadius: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: "#a1a1aa",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Match Code
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#00d4ff",
              letterSpacing: 8,
              fontFamily: "monospace",
            }}
          >
            {code || "------"}
          </div>
        </div>

        <div style={{ fontSize: 22, color: "#a1a1aa" }}>
          Tap to join — free, no download
        </div>
      </div>
    ),
    { ...size }
  );
}
