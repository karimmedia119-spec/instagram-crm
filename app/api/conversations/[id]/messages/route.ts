import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCommentReply, sendDirectMessage } from "@/lib/metaApi";
import { getTenantWorkspaceId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getTenantWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = params;
    const body = await request.json();

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        contact: { userId: workspaceId },
      },
      include: { contact: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Action 1: Toggle Like or Hide on an existing comment
    if (body.action === "TOGGLE_LIKE" || body.action === "TOGGLE_HIDE") {
      const { messageId } = body;
      const targetMessage = await prisma.message.findFirst({
        where: { id: messageId, conversationId },
      });

      if (!targetMessage) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          isLiked: body.action === "TOGGLE_LIKE" ? !targetMessage.isLiked : targetMessage.isLiked,
          isHidden: body.action === "TOGGLE_HIDE" ? !targetMessage.isHidden : targetMessage.isHidden,
        },
      });

      return NextResponse.json(updated);
    }

    // Action 2: Send Outbound Reply (Public comment or Private DM)
    const { content, isPublicComment = false, parentCommentId } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        senderType: "AGENT",
        content: content.trim(),
        isPublicComment: Boolean(isPublicComment),
        parentCommentId: parentCommentId || null,
      },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        status: "OPEN",
      },
    });

    // Fetch tenant-specific Instagram Meta credentials
    const tenantConfig = await prisma.webhookConfig.findFirst({
      where: { userId: workspaceId },
    });
    const accessToken = tenantConfig?.pageAccessToken || null;

    // Dispatch via Meta API
    if (isPublicComment && parentCommentId) {
      await sendCommentReply({
        commentId: parentCommentId,
        text: content,
        accessToken,
      });
    } else {
      await sendDirectMessage({
        recipientId: conversation.contact.instagramId,
        text: content,
        accessToken,
      });
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Post message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
