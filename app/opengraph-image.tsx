import { ImageResponse } from "next/og";

export const alt = "참으면 돼지 - 돼지 캐릭터";
export const size = { width: 1200, height: 630 };
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
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 430,
            height: 360,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 46,
              top: 24,
              width: 124,
              height: 138,
              borderRadius: "54% 46% 58% 42%",
              background: "#FFC0D2",
              transform: "rotate(-26deg)",
              boxShadow: "inset 14px 10px 0 rgba(255,255,255,0.2)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 46,
              top: 24,
              width: 124,
              height: 138,
              borderRadius: "46% 54% 42% 58%",
              background: "#FFC0D2",
              transform: "rotate(26deg)",
              boxShadow: "inset -14px 10px 0 rgba(255,255,255,0.2)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 340,
              height: 300,
              borderRadius: "48% 48% 44% 44%",
              background: "#FFC0D2",
              boxShadow: "0 28px 80px rgba(176, 16, 86, 0.25), inset 0 20px 0 rgba(255,255,255,0.25)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 114,
              top: 138,
              width: 34,
              height: 38,
              borderRadius: "50%",
              background: "#2F2528",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 114,
              top: 138,
              width: 34,
              height: 38,
              borderRadius: "50%",
              background: "#2F2528",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 124,
              top: 145,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#fff",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 132,
              top: 145,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#fff",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 150,
              height: 94,
              top: 184,
              borderRadius: "48px",
              background: "#FF7EA4",
              boxShadow: "inset 0 12px 0 rgba(255,255,255,0.22)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 180,
              top: 214,
              width: 20,
              height: 32,
              borderRadius: "50%",
              background: "#AD3D5E",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 180,
              top: 214,
              width: 20,
              height: 32,
              borderRadius: "50%",
              background: "#AD3D5E",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 76,
              top: 202,
              width: 58,
              height: 34,
              borderRadius: "50%",
              background: "rgba(255,126,164,0.55)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 76,
              top: 202,
              width: 58,
              height: 34,
              borderRadius: "50%",
              background: "rgba(255,126,164,0.55)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
