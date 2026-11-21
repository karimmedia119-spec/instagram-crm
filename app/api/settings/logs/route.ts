import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await prisma.webhookLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Fetch webhook logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook logs" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await prisma.webhookLog.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear webhook logs error:", error);
    return NextResponse.json(
      { error: "Failed to clear webhook logs" },
      { status: 500 }
    );
  }
}
