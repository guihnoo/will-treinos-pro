import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Will Treinos PRO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #000000 0%, #111111 50%, #1a1000 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 24 }}>🏐</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "#EAB308",
            letterSpacing: "-2px",
          }}
        >
          Will Treinos PRO
        </div>
        <div style={{ fontSize: 28, color: "#a1a1aa", marginTop: 16 }}>
          Vôlei de Alta Performance
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
            fontSize: 18,
            color: "#71717a",
          }}
        >
          <span>⚡ XP por aula</span>
          <span>🏆 Tiers exclusivos</span>
          <span>📊 IA personalizada</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
