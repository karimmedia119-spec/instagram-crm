import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { createAuthTicket } from "./auth";

export const TARGET_ADMIN_EMAIL = "karim.media.119@gmail.com";

// In-memory verification code store as robust fallback
interface VerificationCodeEntry {
  code: string;
  type: "REGISTRATION" | "PASSWORD_RESET";
  email: string;
  expiresAt: Date;
}

const memoryCodeStore = new Map<string, VerificationCodeEntry>();

export function storeCodeInMemory(
  email: string,
  type: "REGISTRATION" | "PASSWORD_RESET",
  code: string,
  expiresAt: Date
) {
  memoryCodeStore.set(`${email.toLowerCase()}:${type}`, {
    code,
    type,
    email: email.toLowerCase(),
    expiresAt,
  });
}

export function verifyCodeInMemory(
  email: string,
  type: "REGISTRATION" | "PASSWORD_RESET",
  inputCode: string
): boolean {
  const key = `${email.toLowerCase()}:${type}`;
  const entry = memoryCodeStore.get(key);
  if (!entry) return false;
  if (entry.expiresAt.getTime() < Date.now()) {
    memoryCodeStore.delete(key);
    return false;
  }
  if (entry.code === inputCode.trim()) {
    memoryCodeStore.delete(key);
    return true;
  }
  return false;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendAuthorizationEmail({
  type,
  targetEmail = TARGET_ADMIN_EMAIL,
  requestDetails,
}: {
  type: "REGISTRATION" | "PASSWORD_RESET";
  targetEmail?: string;
  requestDetails?: string;
}) {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // 1. Generate cryptographic authorization ticket
  const authTicket = createAuthTicket({
    code,
    type,
    email: targetEmail,
  });

  // 2. Store in memory store
  storeCodeInMemory(targetEmail, type, code, expiresAt);

  // 3. Attempt DB persistence (wrapped safely in try/catch)
  try {
    await prisma.passwordResetCode.deleteMany({
      where: { email: targetEmail, type },
    });

    await prisma.passwordResetCode.create({
      data: {
        email: targetEmail,
        code,
        type,
        expiresAt,
      },
    });
  } catch (dbErr) {
    console.warn("[MAILER] Could not persist code to DB, fallback stores active:", dbErr);
  }

  const subjectTitle =
    type === "REGISTRATION"
      ? "رمز التحقق لإنشاء حساب جديد في Instagram CRM"
      : "رمز استعادة وتغيير كلمة المرور في Instagram CRM";

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F5F7; padding: 40px 20px; color: #181A1F;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E5EC; padding: 36px; box-shadow: 0 10px 25px -5px rgba(24, 26, 31, 0.05); text-align: center;">
        <div style="display: inline-block; background-color: #181A1F; color: #FFFFFF; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-weight: bold; font-size: 16px; margin-bottom: 16px;">
          IG
        </div>
        <h1 style="font-size: 20px; font-weight: 700; color: #181A1F; margin: 0 0 8px 0;">Instagram CRM Security</h1>
        <p style="font-size: 14px; color: #525866; margin: 0 0 24px 0;">${subjectTitle}</p>

        <p style="font-size: 14px; line-height: 1.6; color: #525866; margin-bottom: 24px; text-align: right; direction: rtl;">
          ${
            type === "REGISTRATION"
              ? `تم طلب إنشاء حساب جديد (${requestDetails || "مدير جديد"}). استخدم رمز الأمان المكون من 6 أرقام أدناه لإتمام التسجيل:`
              : `تم طلب إعادة تعيين كلمة المرور لحسابك. استخدم رمز الأمان المكون من 6 أرقام أدناه لتأكيد التغيير:`
          }
        </p>

        <div style="background-color: #F0F2F5; border-radius: 12px; border: 1px solid #E2E5EC; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #181A1F;">
            ${code}
          </span>
        </div>

        <p style="font-size: 12px; color: #8E95A2; line-height: 1.6; margin: 0 0 20px 0; direction: rtl;">
          هذا الرمز صالح لمدة <strong>15 دقيقة فقط</strong>. إذا لم تكن أنت من قام بهذا الإجراء، يمكنك تجاهل هذه الرسالة بأمان.
        </p>

        <div style="border-top: 1px solid #E2E5EC; padding-top: 16px; text-align: center; font-size: 11px; color: #8E95A2;">
          Atelier Instagram CRM • Monochromatic Multi-Tenant Architecture
        </div>
      </div>
    </div>
  `;

  // Dispatch directly via official Gmail SMTP
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER || TARGET_ADMIN_EMAIL;
  const smtpPass = process.env.SMTP_PASS || "zbrqqrssiczvvxel";

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: `"Instagram CRM Security" <${smtpUser}>`,
    to: targetEmail,
    subject: `[${code}] ${subjectTitle}`,
    html: emailHtml,
  });

  console.log(`[MAILER] ${type} code sent via Gmail SMTP to ${targetEmail}`);

  return { success: true, authTicket, mode: "smtp" };
}

export async function sendPasswordResetEmail(targetEmail: string = TARGET_ADMIN_EMAIL) {
  return sendAuthorizationEmail({ type: "PASSWORD_RESET", targetEmail });
}

export async function sendRegistrationCodeEmail(requestDetails?: string) {
  return sendAuthorizationEmail({
    type: "REGISTRATION",
    targetEmail: TARGET_ADMIN_EMAIL,
    requestDetails,
  });
}
