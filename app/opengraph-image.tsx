import { ImageResponse } from "next/og";

export const alt = "참아낸다이어 - 절약 챌린지";
export const size   = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #FF2A7A 0%, #FF85AD 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <div style={{ fontSize: 140, lineHeight: 1 }}>🐷</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-2px",
          }}
        >
          참아낸다이어
        </div>
        <div
          style={{
            fontSize: 30,
            color: "rgba(255,255,255,0.85)",
            marginTop: 4,
          }}
        >
          절약 챌린지를 함께해요 🎉
        </div>
      </div>
    ),
    { ...size }
  );
}
