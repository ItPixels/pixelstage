import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "PixelStage - AI Real Estate Staging";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#050505",
            backgroundImage:
              "linear-gradient(to bottom, #050505, #1a1a1a)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px",
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: "bold",
                background: "linear-gradient(to right, #C4B454, #E3D3BD)",
                backgroundClip: "text",
                color: "transparent",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#E3D3BD",
                textAlign: "center",
                opacity: 0.8,
              }}
            >
              #1 AI Real Estate Staging in Dubai
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.error(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

