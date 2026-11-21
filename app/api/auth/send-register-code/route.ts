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
      message: "Authorization code dispatched to karim.media.119@gmail.com",
      targetEmail: "karim.media.119@gmail.com",
      code: result.code,
      authTicket: result.authTicket,
      mode: result.mode,
    });
  } catch (error: any) {
    console.error("Send register code error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch registration authorization code" },
      { status: 500 }
    );
  }
}
