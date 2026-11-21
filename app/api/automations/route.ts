import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantWorkspaceId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspaceId = await getTenantWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await prisma.automationRule.findMany({
      where: { userId: workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Fetch rules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspaceId = await getTenantWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      triggerType = "COMMENT_ANY",
      postId,
      matchType = "CONTAINS_ANY",
      keywords,
      publicReply,
      privateReply,
      ctaTitle,
      ctaUrl,
      applyTag,
      isActive = true,
    } = body;

    if (!name || !keywords) {
      return NextResponse.json(
        { error: "Name and keywords are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.automationRule.create({
      data: {
        userId: workspaceId,
        name,
        triggerType,
        postId: postId || null,
        matchType,
        keywords,
        publicReply: publicReply || null,
        privateReply: privateReply || null,
        ctaTitle: ctaTitle || null,
        ctaUrl: ctaUrl || null,
        applyTag: applyTag || null,
        isActive,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Create automation rule error:", error);
    return NextResponse.json(
      { error: "Failed to create automation rule" },
      { status: 500 }
    );
  }
}
