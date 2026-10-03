import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";
import { games } from "@/lib/data/games";
import { LOGO_DATA_URI } from "@/lib/logo-data";
import { tools } from "@/lib/tools/registry";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0a0a0c 0%, #14121f 55%, #1b1730 100%)",
          color: "#f4f4f5",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-140px",
            right: "-80px",
            width: "460px",
            height: "460px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(124,108,245,0.55) 0%, rgba(124,108,245,0) 70%)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img
            alt=""
            width={72}
            height={72}
            src={LOGO_DATA_URI}
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              objectFit: "cover",
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>

        <div
          style={{
            marginTop: 42,
            display: "flex",
            flexDirection: "column",
            fontSize: 74,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          Everything DarkUniverse,
          <br />
          in one place.
        </div>

        <div
          style={{
            marginTop: 30,
            fontSize: 30,
            color: "#9ca3af",
            maxWidth: 880,
            lineHeight: 1.4,
          }}
        >
          {siteConfig.tagline}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 44 }}>
          {[
            `${tools.length} tools`,
            `${games.length} ${games.length === 1 ? "game" : "games"}`,
            "Codes",
            "Roblox + YouTube",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(124,108,245,0.15)",
                border: "1px solid rgba(124,108,245,0.45)",
                color: "#c9c4ff",
                fontSize: 24,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
