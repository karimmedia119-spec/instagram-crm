import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail, TARGET_ADMIN_EMAIL } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const result = await sendPasswordResetEmail(TARGET_ADMIN_EMAIL);

    return NextResponse.json({
      success: true,
      message: `A 6-digit security code has been sent to ${TARGET_ADMIN_EMAIL}`,
      targetEmail: TARGET_ADMIN_EMAIL,
      code: result.code,
      authTicket: result.authTicket,
      mode: result.mode,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch verification code" },
      { status: 500 }
    );
  }
}
