import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMetaConnection } from "@/lib/metaApi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let config = await prisma.webhookConfig.findFirst();

    if (!config) {
      config = await prisma.webhookConfig.create({
        data: {
          verifyToken: "ig_crm_secret_token_2026",
          appSecret: "",
          businessAccountId: "17841405391088219",
          pageAccessToken: "",
          subscriptions: JSON.stringify([
            "messages",
            "messaging_postbacks",
            "comments",
            "live_comments",
            "mentions",
            "story_insights",
          ]),
        },
      });
    }

    let subscriptions: string[] = [];
    try {
      subscriptions = JSON.parse(config.subscriptions);
    } catch {
      subscriptions = [];
    }

    return NextResponse.json({
      ...config,
      subscriptions,
    });
  } catch (error) {
    console.error("Fetch webhook config error:", error);
    return NextResponse.json(
      { error: "Failed to load webhook configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    let config = await prisma.webhookConfig.findFirst();

    const dataToUpdate: any = {};
    if (body.verifyToken !== undefined) dataToUpdate.verifyToken = body.verifyToken;
    if (body.appSecret !== undefined) dataToUpdate.appSecret = body.appSecret;
    if (body.businessAccountId !== undefined) dataToUpdate.businessAccountId = body.businessAccountId;
    if (body.pageAccessToken !== undefined) dataToUpdate.pageAccessToken = body.pageAccessToken;
    if (body.subscriptions !== undefined) {
      dataToUpdate.subscriptions = Array.isArray(body.subscriptions)
        ? JSON.stringify(body.subscriptions)
        : body.subscriptions;
    }

    if (!config) {
      config = await prisma.webhookConfig.create({
        data: {
          verifyToken: body.verifyToken || "ig_crm_secret_token_2026",
          ...dataToUpdate,
        },
      });
    } else {
      config = await prisma.webhookConfig.update({
        where: { id: config.id },
        data: dataToUpdate,
      });
    }

    return NextResponse.json({
      ...config,
      subscriptions: JSON.parse(config.subscriptions || "[]"),
    });
  } catch (error) {
    console.error("Update webhook config error:", error);
    return NextResponse.json(
      { error: "Failed to update webhook configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessAccountId, pageAccessToken } = await request.json();
    const result = await verifyMetaConnection(businessAccountId, pageAccessToken);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Test connection error:", error);
    return NextResponse.json(
      { error: "Connection test failed", details: String(error) },
      { status: 500 }
    );
  }
}
