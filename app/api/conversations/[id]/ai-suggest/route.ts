import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: conversationId } = params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 4,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const lastCustomerMessage = conversation.messages.find(
      (m) => m.senderType === "CUSTOMER"
    );

    const messageText = lastCustomerMessage?.content || "";
    const isArabic = /[\u0600-\u06FF]/.test(messageText);
    const username = conversation.contact.username;

    let suggestion = "";

    if (isArabic) {
      if (messageText.includes("سعر") || messageText.includes("بكم")) {
        suggestion = `أهلاً بك @${username}، تبدأ أسعار التشكيلة من 450$ وتصل إلى 2,800$ حسب المواصفات واللمسات المصنوعة يدوياً. يمكننا تزويدك بالكتالوج الخاص عبر رسالة مباشرة الآن.`;
      } else if (messageText.includes("شحن") || messageText.includes("توصيل")) {
        suggestion = `مرحباً @${username}، الشحن مؤمن وسريع إلى كافة مدن الخليج والشرق الأوسط خلال 2-3 أيام عمل. هل تود منا تنسيق طلبك وتجهيز رقم التتبع؟`;
      } else {
        suggestion = `مرحباً @${username}، شكراً لتواصلك واهتمامك بتصميماتنا الحصرية. يسعدنا الإجابة عن أي استفسار وتوفير تجربة استثنائية لك. كيف يمكننا خدمتك اليوم؟`;
      }
    } else {
      if (messageText.toLowerCase().includes("price") || messageText.toLowerCase().includes("cost")) {
        suggestion = `Hello @${username}, thank you for your inquiry. Our limited editions range from $450 to $2,800 with bespoke finishing. Would you like us to share our private collection catalogue?`;
      } else if (
        messageText.toLowerCase().includes("ship") ||
        messageText.toLowerCase().includes("delivery") ||
        messageText.toLowerCase().includes("london") ||
        messageText.toLowerCase().includes("riyadh")
      ) {
        suggestion = `Hello @${username}, express insured courier transit is guaranteed within 48-72 hours with priority direct tracking. We'd be delighted to assist with your order.`;
      } else if (messageText.toLowerCase().includes("reserve") || messageText.toLowerCase().includes("deposit")) {
        suggestion = `Hello @${username}, we would be glad to reserve this allocation for you. I have marked this serial number as priority on your client profile.`;
      } else {
        suggestion = `Hello @${username}, thank you for contacting our atelier. We appreciate your appreciation of our minimalist craft. How can our team assist you today?`;
      }
    }

    return NextResponse.json({
      suggestion,
      detectedLanguage: isArabic ? "ar" : "en",
    });
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI suggestion" },
      { status: 500 }
    );
  }
}
