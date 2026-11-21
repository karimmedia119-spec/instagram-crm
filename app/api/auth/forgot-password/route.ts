import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail, TARGET_ADMIN_EMAIL } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const result = await sendPasswordResetEmail(TARGET_ADMIN_EMAIL);

    return NextResponse.json({
      success: true,
      message: `تم إرسال كود التحقق بنجاح إلى ${TARGET_ADMIN_EMAIL}`,
      targetEmail: TARGET_ADMIN_EMAIL,
      authTicket: result.authTicket,
      mode: result.mode,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error?.message || "فشل إرسال كود التحقق عبر البريد الإلكتروني" },
      { status: 500 }
    );
  }
}
