import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, getSessionUser, verifyAuthTicket, COOKIE_NAME } from "@/lib/auth";
import { generateSecureToken } from "@/lib/utils";
import { verifyCodeInMemory, TARGET_ADMIN_EMAIL } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, role = "ADMIN", code, authTicket } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (!code || code.trim() === "") {
      return NextResponse.json(
        { error: "Security authorization code is required" },
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
        ticketPayload.type === "REGISTRATION" &&
        ticketPayload.code === cleanCode
      ) {
        isCodeValid = true;
      }
    }

    // 2. Verify via in-memory code store
    if (!isCodeValid && verifyCodeInMemory(TARGET_ADMIN_EMAIL, "REGISTRATION", cleanCode)) {
      isCodeValid = true;
    }

    // 3. Verify via database record
    if (!isCodeValid) {
      try {
        const validCode = await prisma.passwordResetCode.findFirst({
          where: {
            email: TARGET_ADMIN_EMAIL,
            type: "REGISTRATION",
            code: cleanCode,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });

        if (validCode) {
          isCodeValid = true;
          // Clean up database code
          await prisma.passwordResetCode.deleteMany({
            where: {
              email: TARGET_ADMIN_EMAIL,
              type: "REGISTRATION",
            },
          }).catch(() => {});
        }
      } catch (err) {
        console.warn("DB code verification check error:", err);
      }
    }

    if (!isCodeValid) {
      return NextResponse.json(
        { error: "Invalid or expired authorization code. Check karim.media.119@gmail.com" },
        { status: 403 }
      );
    }

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

    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    const currentLoggedInUser = await getSessionUser(request);
    const parentAdminId = currentLoggedInUser && currentLoggedInUser.role === "ADMIN"
      ? currentLoggedInUser.id
      : null;

    const passwordHash = await hashPassword(password);
    const assignedRole = isFirstUser ? "ADMIN" : (role === "AGENT" ? "AGENT" : "ADMIN");

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: assignedRole,
        adminId: (!isFirstUser && role === "AGENT") ? parentAdminId : null,
      },
    });

    // If new user is an Admin (or first user), create their dedicated WebhookConfig
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

    // Automatically log user in
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register user error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
