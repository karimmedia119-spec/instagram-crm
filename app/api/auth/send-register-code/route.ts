import { NextRequest, NextResponse } from "next/server";
import { sendRegistrationCodeEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = body.username ? `@${body.username}` : "New Account";
    const email = body.email || "";

    const result = await sendRegistrationCodeEmail(`${username} (${email})`);

    return NextResponse.json({
      success: true,
      message: "تم إرسال كود التحقق بنجاح إلى karim.media.119@gmail.com",
      targetEmail: "karim.media.119@gmail.com",
      authTicket: result.authTicket,
      mode: result.mode,
    });
  } catch (error: any) {
    console.error("Send register code error:", error);
    return NextResponse.json(
      { error: error?.message || "فشل إرسال كود التحقق عبر البريد الإلكتروني" },
      { status: 500 }
    );
  }
}
