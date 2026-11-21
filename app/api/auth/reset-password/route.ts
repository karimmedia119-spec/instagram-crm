import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyAuthTicket } from "@/lib/auth";
import { verifyCodeInMemory, TARGET_ADMIN_EMAIL } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { code, newPassword, authTicket } = await request.json();

    if (!code || !newPassword) {
      return NextResponse.json(
        { error: "Verification code and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();
    let isCodeValid = false;

    // 1. Verify via cryptographic authTicket if provided
    if (authTicket) {
      const ticketPayload = verifyAuthTicket(authTicket);
      if (
        ticketPayload &&
        ticketPayload.type === "PASSWORD_RESET" &&
        ticketPayload.code === cleanCode
      ) {
        isCodeValid = true;
      }
    }

    // 2. Verify via in-memory store
    if (!isCodeValid && verifyCodeInMemory(TARGET_ADMIN_EMAIL, "PASSWORD_RESET", cleanCode)) {
      isCodeValid = true;
    }

    // 3. Verify via database record
    if (!isCodeValid) {
      try {
        const resetRecord = await prisma.passwordResetCode.findFirst({
          where: {
            code: cleanCode,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });

        if (resetRecord) {
          isCodeValid = true;
          await prisma.passwordResetCode.deleteMany({
            where: { email: resetRecord.email },
          }).catch(() => {});
        }
      } catch (err) {
        console.warn("DB reset code lookup error:", err);
      }
    }

    if (!isCodeValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    // Update admin user (or user with matching email)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: TARGET_ADMIN_EMAIL },
          { username: "admin" },
        ],
      },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You may now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
