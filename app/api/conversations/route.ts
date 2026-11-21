import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantWorkspaceId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const workspaceId = await getTenantWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "ALL";
    const search = searchParams.get("search") || "";

    const whereClause: any = {
      contact: {
        userId: workspaceId,
      },
    };

    if (filter === "DM") {
      whereClause.type = "DM";
    } else if (filter === "COMMENT") {
      whereClause.type = "POST_COMMENT";
    } else if (filter === "UNREAD") {
      whereClause.unreadCount = { gt: 0 };
    } else if (filter === "NEEDS_ATTENTION") {
      whereClause.status = "NEEDS_ATTENTION";
    }

    if (search.trim() !== "") {
      whereClause.OR = [
        {
          contact: {
            username: { contains: search },
          },
        },
        {
          contact: {
            fullName: { contains: search },
          },
        },
        {
          messages: {
            some: {
              content: { contains: search },
            },
          },
        },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    const formatted = conversations.map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      postId: c.postId,
      postCaption: c.postCaption,
      unreadCount: c.unreadCount,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.messages[0] ? c.messages[0].content : "",
      contact: {
        id: c.contact.id,
        username: c.contact.username,
        fullName: c.contact.fullName,
        avatarUrl: c.contact.avatarUrl,
        pipelineStage: c.contact.pipelineStage,
        tags: (() => {
          try {
            return JSON.parse(c.contact.tags);
          } catch {
            return [];
          }
        })(),
        isOnline: c.contact.isOnline,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
