import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/metaApi";
import { evaluateAutomationRules } from "@/lib/automationEngine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const config = await prisma.webhookConfig.findFirst();
  const validToken = config?.verifyToken || process.env.META_VERIFY_TOKEN || "ig_crm_secret_token_2026";

  const headersObj: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headersObj[k] = v;
  });

  if (mode === "subscribe" && token === validToken) {
    const latencyMs = Date.now() - startTime;
    await prisma.webhookLog.create({
      data: {
        method: "GET",
        endpoint: "/api/webhooks/instagram",
        statusCode: 200,
        headers: JSON.stringify(headersObj),
        payload: JSON.stringify({
          "hub.mode": mode,
          "hub.verify_token": token,
          "hub.challenge": challenge,
        }),
        response: challenge || "OK",
        latencyMs,
      },
    });

    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const latencyMs = Date.now() - startTime;
  await prisma.webhookLog.create({
    data: {
      method: "GET",
      endpoint: "/api/webhooks/instagram",
      statusCode: 403,
      headers: JSON.stringify(headersObj),
      payload: JSON.stringify({
        "hub.mode": mode,
        "hub.verify_token": token,
        "hub.challenge": challenge,
      }),
      response: "Forbidden - Token mismatch",
      latencyMs,
    },
  });

  return new NextResponse("Verification token mismatch", { status: 403 });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const rawBody = await request.text();

  const headersObj: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headersObj[k] = v;
  });

  const signatureHeader = request.headers.get("x-hub-signature-256");
  const config = await prisma.webhookConfig.findFirst();

  // Signature validation if secret is set
  if (config?.appSecret && config.appSecret.trim() !== "") {
    const isValid = verifyWebhookSignature(rawBody, signatureHeader, config.appSecret);
    if (!isValid) {
      await prisma.webhookLog.create({
        data: {
          method: "POST",
          endpoint: "/api/webhooks/instagram",
          statusCode: 401,
          headers: JSON.stringify(headersObj),
          payload: rawBody,
          response: "Unauthorized: Invalid X-Hub-Signature-256",
          latencyMs: Date.now() - startTime,
        },
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let processedCount = 0;
  let lastMatchedRule: string | null = null;

  if (body.object === "instagram" && Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      // 1. Process Post Comments (entry.changes)
      if (Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          if (change.field === "comments" && change.value) {
            const val = change.value;
            const commentId = val.id || `cmt_${Date.now()}`;
            const commentText = val.text || "";
            const fromUser = val.from || {};
            const igUserId = fromUser.id || `ig_usr_${fromUser.username || "guest"}`;
            const username = fromUser.username || "instagram_user";
            const postId = val.media?.id || "ig_post_general";
            const postCaption = val.media?.caption || "Instagram Post";

            // Upsert contact
            let contact = await prisma.contact.findUnique({
              where: { instagramId: igUserId },
            });

            if (!contact) {
              contact = await prisma.contact.create({
                data: {
                  instagramId: igUserId,
                  username,
                  fullName: username.replace(/[._]/g, " "),
                  pipelineStage: "NEW_LEAD",
                  tags: JSON.stringify(["Commenter"]),
                  isOnline: true,
                },
              });
            }

            // Find or create conversation for this post comment
            let conversation = await prisma.conversation.findFirst({
              where: {
                contactId: contact.id,
                postId,
                type: "POST_COMMENT",
              },
            });

            if (!conversation) {
              conversation = await prisma.conversation.create({
                data: {
                  contactId: contact.id,
                  type: "POST_COMMENT",
                  postId,
                  postCaption,
                  unreadCount: 1,
                  status: "OPEN",
                },
              });
            } else {
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  unreadCount: { increment: 1 },
                  lastMessageAt: new Date(),
                  status: "OPEN",
                },
              });
            }

            // Create incoming Message
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                senderType: "CUSTOMER",
                content: commentText,
                isPublicComment: true,
                commentId,
              },
            });

            // Evaluate Automation Rules
            const autoResult = await evaluateAutomationRules({
              eventType: "COMMENT",
              content: commentText,
              contactId: contact.id,
              conversationId: conversation.id,
              postId,
              commentId,
            });

            if (autoResult.matched) {
              lastMatchedRule = autoResult.ruleName || "Rule matched";
            }

            processedCount++;
          }
        }
      }

      // 2. Process Direct Messages & Story Mentions (entry.messaging)
      if (Array.isArray(entry.messaging)) {
        for (const msgItem of entry.messaging) {
          const senderId = msgItem.sender?.id;
          const msgObj = msgItem.message;

          if (senderId && msgObj) {
            const messageText = msgObj.text || "";
            const isStoryMention = !!msgObj.reply_to?.story;
            const username = msgItem.sender?.username || `user_${senderId.slice(-4)}`;

            let contact = await prisma.contact.findUnique({
              where: { instagramId: senderId },
            });

            if (!contact) {
              contact = await prisma.contact.create({
                data: {
                  instagramId: senderId,
                  username,
                  fullName: username.replace(/[._]/g, " "),
                  pipelineStage: "NEW_LEAD",
                  tags: JSON.stringify(["DirectMessage"]),
                  isOnline: true,
                },
              });
            }

            // Find or create DM conversation
            let conversation = await prisma.conversation.findFirst({
              where: {
                contactId: contact.id,
                type: "DM",
              },
            });

            if (!conversation) {
              conversation = await prisma.conversation.create({
                data: {
                  contactId: contact.id,
                  type: "DM",
                  unreadCount: 1,
                  status: "OPEN",
                },
              });
            } else {
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  unreadCount: { increment: 1 },
                  lastMessageAt: new Date(),
                  status: "OPEN",
                },
              });
            }

            // Create incoming Message
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                senderType: "CUSTOMER",
                content: messageText,
                storyReplyContext: isStoryMention
                  ? `Replied to your story [${msgObj.reply_to.story.id || "Story"}]`
                  : null,
                isPublicComment: false,
              },
            });

            // Evaluate Automation Rules
            const autoResult = await evaluateAutomationRules({
              eventType: isStoryMention ? "STORY_MENTION" : "DM",
              content: messageText,
              contactId: contact.id,
              conversationId: conversation.id,
            });

            if (autoResult.matched) {
              lastMatchedRule = autoResult.ruleName || "Rule matched";
            }

            processedCount++;
          }
        }
      }
    }
  }

  const latencyMs = Date.now() - startTime;
  const responseData = {
    success: true,
    processed: processedCount,
    matchedRule: lastMatchedRule,
  };

  await prisma.webhookLog.create({
    data: {
      method: "POST",
      endpoint: "/api/webhooks/instagram",
      statusCode: 200,
      headers: JSON.stringify(headersObj),
      payload: rawBody,
      response: JSON.stringify(responseData),
      latencyMs,
    },
  });

  return NextResponse.json(responseData, { status: 200 });
}
