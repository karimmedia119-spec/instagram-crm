import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { code, newPassword } = await request.json();

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

    const resetRecord = await prisma.passwordResetCode.findFirst({
      where: {
        code: code.trim(),
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetRecord) {
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
          { email: resetRecord.email },
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

    // Clean up used code
    await prisma.passwordResetCode.deleteMany({
      where: { email: resetRecord.email },
    });

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
