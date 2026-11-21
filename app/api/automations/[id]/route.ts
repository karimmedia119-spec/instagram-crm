import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

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
    const { id } = params;
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
