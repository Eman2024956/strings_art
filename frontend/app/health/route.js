import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    engine: "Next.js TypeScript/JS Engine",
    timestamp: Date.now(),
  });
}
