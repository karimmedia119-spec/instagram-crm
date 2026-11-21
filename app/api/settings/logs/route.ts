import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantWorkspaceId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspaceId = await getTenantWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.webhookLog.findMany({
      where: {
        OR: [{ userId: workspaceId }, { userId: null }],
      },
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
    const workspaceId = await getTenantWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.webhookLog.deleteMany({
      where: {
        OR: [{ userId: workspaceId }, { userId: null }],
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear webhook logs error:", error);
    return NextResponse.json(
      { error: "Failed to clear webhook logs" },
      { status: 500 }
    );
  }
}
