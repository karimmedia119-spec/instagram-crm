import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            notes: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Automatically mark as read when opened
    if (conversation.unreadCount > 0) {
      await prisma.conversation.update({
        where: { id },
        data: { unreadCount: 0 },
      });
      conversation.unreadCount = 0;
    }

    const formattedContact = {
      ...conversation.contact,
      tags: (() => {
        try {
          return JSON.parse(conversation.contact.tags);
        } catch {
          return [];
        }
      })(),
    };

    return NextResponse.json({
      ...conversation,
      contact: formattedContact,
    });
  } catch (error) {
    console.error("Fetch conversation detail error:", error);
    return NextResponse.json(
      { error: "Failed to load conversation details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(typeof body.unreadCount === "number" ? { unreadCount: body.unreadCount } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update conversation error:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}
