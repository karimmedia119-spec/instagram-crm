import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantWorkspaceId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getTenantWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const rule = await prisma.automationRule.findFirst({
      where: { id, userId: workspaceId },
    });

    if (!rule) {
      return NextResponse.json({ error: "Automation rule not found" }, { status: 404 });
    }

    const updated = await prisma.automationRule.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.triggerType !== undefined ? { triggerType: body.triggerType } : {}),
        ...(body.postId !== undefined ? { postId: body.postId } : {}),
        ...(body.matchType !== undefined ? { matchType: body.matchType } : {}),
        ...(body.keywords !== undefined ? { keywords: body.keywords } : {}),
        ...(body.publicReply !== undefined ? { publicReply: body.publicReply } : {}),
        ...(body.privateReply !== undefined ? { privateReply: body.privateReply } : {}),
        ...(body.ctaTitle !== undefined ? { ctaTitle: body.ctaTitle } : {}),
        ...(body.ctaUrl !== undefined ? { ctaUrl: body.ctaUrl } : {}),
        ...(body.applyTag !== undefined ? { applyTag: body.applyTag } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update automation rule error:", error);
    return NextResponse.json(
      { error: "Failed to update automation rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getTenantWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const rule = await prisma.automationRule.findFirst({
      where: { id, userId: workspaceId },
    });

    if (!rule) {
      return NextResponse.json({ error: "Automation rule not found" }, { status: 404 });
    }

    await prisma.automationRule.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete automation rule error:", error);
    return NextResponse.json(
      { error: "Failed to delete automation rule" },
      { status: 500 }
    );
  }
}
