import { prisma } from "./prisma";
import { sendCommentReply, sendDirectMessage } from "./metaApi";

export interface AutomationEvaluationInput {
  eventType: "COMMENT" | "DM" | "STORY_MENTION";
  content: string;
  contactId: string;
  conversationId: string;
  postId?: string | null;
  commentId?: string | null;
}

export interface AutomationResult {
  matched: boolean;
  ruleName?: string;
  appliedTag?: string | null;
  publicReplySent?: boolean;
  privateReplySent?: boolean;
}

// Normalize Arabic & English text for accurate matching
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "") // remove Arabic tashkeel/diacritics
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s\-_,.]+/g, " ")
    .trim();
}

export async function evaluateAutomationRules(
  input: AutomationEvaluationInput
): Promise<AutomationResult> {
  const { eventType, content, contactId, conversationId, postId, commentId } = input;

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  if (!contact) {
    return { matched: false };
  }

  // Fetch only active rules belonging to this contact's tenant workspace
  const rules = await prisma.automationRule.findMany({
    where: {
      userId: contact.userId,
      isActive: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Fetch tenant-specific Instagram Page Access Token
  const tenantConfig = await prisma.webhookConfig.findFirst({
    where: { userId: contact.userId },
  });
  const accessToken = tenantConfig?.pageAccessToken || null;

  const normalizedContent = normalizeText(content);

  for (const rule of rules) {
    let typeMatches = false;

    if (eventType === "COMMENT") {
      if (rule.triggerType === "COMMENT_ANY") {
        typeMatches = true;
      } else if (rule.triggerType === "COMMENT_SPECIFIC_POST") {
        typeMatches = !!postId && rule.postId === postId;
      }
    } else if (eventType === "DM") {
      typeMatches = rule.triggerType === "DM_KEYWORD";
    } else if (eventType === "STORY_MENTION") {
      typeMatches = rule.triggerType === "STORY_MENTION";
    }

    if (!typeMatches) continue;

    // Check keyword matching
    let keywordsMatch = false;

    if (rule.keywords.trim() === "*" || rule.matchType === "ALL") {
      keywordsMatch = true;
    } else {
      const ruleKeywords = rule.keywords
        .split(",")
        .map((k) => normalizeText(k))
        .filter(Boolean);

      if (rule.matchType === "EXACT") {
        keywordsMatch = ruleKeywords.some((k) => normalizedContent === k);
      } else {
        // CONTAINS_ANY default
        keywordsMatch = ruleKeywords.some((k) => normalizedContent.includes(k));
      }
    }

    if (!keywordsMatch) continue;

    // Match found! Process actions
    await prisma.automationRule.update({
      where: { id: rule.id },
      data: { triggerCount: { increment: 1 } },
    });

    // Helper for variable substitution
    const replaceVariables = (templateStr: string) => {
      return templateStr
        .replace(/\{\{username\}\}/g, contact.username)
        .replace(/\{\{full_name\}\}/g, contact.fullName || contact.username)
        .replace(/\{\{order_link\}\}/g, "https://atelier-collection.luxury/order");
    };

    // 1. Auto-apply CRM Tag
    if (rule.applyTag) {
      let currentTags: string[] = [];
      try {
        currentTags = JSON.parse(contact.tags || "[]");
      } catch {
        currentTags = [];
      }

      if (!currentTags.includes(rule.applyTag)) {
        currentTags.push(rule.applyTag);
        await prisma.contact.update({
          where: { id: contact.id },
          data: { tags: JSON.stringify(currentTags) },
        });
      }
    }

    // 2. Public Reply to comment
    let publicReplySent = false;
    if (eventType === "COMMENT" && rule.publicReply && rule.publicReply.trim() !== "") {
      const replyVariations = rule.publicReply
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const chosenReply =
        replyVariations[Math.floor(Math.random() * replyVariations.length)] ||
        replyVariations[0];
      const parsedPublicReply = replaceVariables(chosenReply);

      await prisma.message.create({
        data: {
          conversationId,
          senderType: "AUTOMATION",
          isPublicComment: true,
          parentCommentId: commentId || null,
          content: parsedPublicReply,
        },
      });

      if (commentId) {
        await sendCommentReply({
          commentId,
          text: parsedPublicReply,
          accessToken,
        });
      }
      publicReplySent = true;
    }

    // 3. Private DM Reply
    let privateReplySent = false;
    if (rule.privateReply && rule.privateReply.trim() !== "") {
      let dmContent = replaceVariables(rule.privateReply);
      if (rule.ctaTitle && rule.ctaUrl) {
        dmContent += `\n\n[${rule.ctaTitle}]: ${rule.ctaUrl}`;
      }

      await prisma.message.create({
        data: {
          conversationId,
          senderType: "AUTOMATION",
          isPublicComment: false,
          content: dmContent,
        },
      });

      await sendDirectMessage({
        recipientId: contact.instagramId,
        text: dmContent,
        accessToken,
      });

      privateReplySent = true;
    }

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        status: "OPEN",
      },
    });

    return {
      matched: true,
      ruleName: rule.name,
      appliedTag: rule.applyTag,
      publicReplySent,
      privateReplySent,
    };
  }

  return { matched: false };
}
