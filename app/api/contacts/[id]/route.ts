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

    const contact = await prisma.contact.findFirst({
      where: { id, userId: workspaceId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (body.email !== undefined) dataToUpdate.email = body.email;
    if (body.phone !== undefined) dataToUpdate.phone = body.phone;
    if (body.pipelineStage !== undefined) dataToUpdate.pipelineStage = body.pipelineStage;
    if (body.tags !== undefined) {
      dataToUpdate.tags = Array.isArray(body.tags)
        ? JSON.stringify(body.tags)
        : body.tags;
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      ...updated,
      tags: (() => {
        try {
          return JSON.parse(updated.tags);
        } catch {
          return [];
        }
      })(),
    });
  } catch (error) {
    console.error("Update contact error:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}
