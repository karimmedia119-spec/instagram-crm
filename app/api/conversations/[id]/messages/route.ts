import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCommentReply, sendDirectMessage } from "@/lib/metaApi";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: conversationId } = params;
    const body = await request.json();

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Action 1: Toggle Like or Hide on an existing comment
    if (body.action === "TOGGLE_LIKE" || body.action === "TOGGLE_HIDE") {
      const { messageId } = body;
      const targetMessage = await prisma.message.findUnique({ where: { id: messageId } });

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

    // Dispatch via Meta API (or simulator)
    if (isPublicComment && parentCommentId) {
      await sendCommentReply({
        commentId: parentCommentId,
        text: content,
      });
    } else {
      await sendDirectMessage({
        recipientId: conversation.contact.instagramId,
        text: content,
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
