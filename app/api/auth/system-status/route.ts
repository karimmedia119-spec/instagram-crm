import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      hasAdmin: userCount > 0,
      userCount,
    });
  } catch (error) {
    console.error("System status error:", error);
    return NextResponse.json({ hasAdmin: false, userCount: 0 });
  }
}
