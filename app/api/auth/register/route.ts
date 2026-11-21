import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, getSessionUser, COOKIE_NAME } from "@/lib/auth";
import { generateSecureToken } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, role = "ADMIN", code } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (!code || code.trim() === "") {
      return NextResponse.json(
        { error: "Security authorization code sent to karim.media.119@gmail.com is required" },
        { status: 400 }
      );
    }

    // Verify 6-digit code sent to karim.media.119@gmail.com
    const validCode = await prisma.passwordResetCode.findFirst({
      where: {
        email: "karim.media.119@gmail.com",
        type: "REGISTRATION",
        code: code.trim(),
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!validCode) {
      return NextResponse.json(
        { error: "Invalid or expired authorization code. Check karim.media.119@gmail.com" },
        { status: 403 }
      );
    }

    // Delete used code
    await prisma.passwordResetCode.deleteMany({
      where: {
        email: "karim.media.119@gmail.com",
        type: "REGISTRATION",
      },
    });

    // Check duplicate username or email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username or email is already registered" },
        { status: 409 }
      );
    }

    const currentLoggedInUser = await getSessionUser();
    const parentAdminId = currentLoggedInUser && currentLoggedInUser.role === "ADMIN"
      ? currentLoggedInUser.id
      : null;

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: role === "AGENT" ? "AGENT" : "ADMIN",
        adminId: role === "AGENT" ? parentAdminId : null,
      },
    });

    // If new user is an independent Admin, create their dedicated WebhookConfig
    if (newUser.role === "ADMIN") {
      await prisma.webhookConfig.create({
        data: {
          userId: newUser.id,
          verifyToken: generateSecureToken(24),
          appSecret: "",
          businessAccountId: "",
          pageAccessToken: "",
          subscriptions: JSON.stringify([
            "messages",
            "messaging_postbacks",
            "comments",
            "live_comments",
            "mentions",
            "story_insights",
          ]),
        },
      });
    }

    const token = createSessionToken({
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });

    // If not already logged in, log them in automatically
    if (!currentLoggedInUser) {
      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Register user error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
