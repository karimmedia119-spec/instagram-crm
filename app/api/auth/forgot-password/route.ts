import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const targetEmail = "karim.media.119@gmail.com";
    const result = await sendPasswordResetEmail(targetEmail);

    return NextResponse.json({
      success: true,
      message: `A 6-digit security code has been sent to ${targetEmail}`,
      targetEmail,
      mode: result.mode,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch verification code" },
      { status: 500 }
    );
  }
}
