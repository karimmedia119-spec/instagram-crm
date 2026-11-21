import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Fetch templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, shortcut, content, category = "GENERAL" } = body;

    if (!title || !shortcut || !content) {
      return NextResponse.json(
        { error: "Title, shortcut, and content are required" },
        { status: 400 }
      );
    }

    const cleanShortcut = shortcut.startsWith("/") ? shortcut : `/${shortcut}`;

    const template = await prisma.template.create({
      data: {
        title,
        shortcut: cleanShortcut,
        content,
        category,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
