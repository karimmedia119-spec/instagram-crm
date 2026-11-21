import nodemailer from "nodemailer";
import { prisma } from "./prisma";

const TARGET_ADMIN_EMAIL = "karim.media.119@gmail.com";

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

  // Delete previous codes for this email and type
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

  const subjectTitle =
    type === "REGISTRATION"
      ? "New Account Creation Security Code"
      : "Password Reset Verification Code";

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F4F5F7; padding: 40px 20px; color: #181A1F;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E5EC; padding: 36px; box-shadow: 0 10px 25px -5px rgba(24, 26, 31, 0.05);">
        <div style="margin-bottom: 24px; text-align: center;">
          <div style="display: inline-block; background-color: #181A1F; color: #FFFFFF; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; font-weight: bold; font-size: 14px;">
            IG
          </div>
          <h1 style="font-size: 20px; font-weight: 700; color: #181A1F; margin: 16px 0 4px 0;">Instagram CRM Security</h1>
          <p style="font-size: 13px; color: #8E95A2; margin: 0;">${subjectTitle}</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #525866; margin-bottom: 24px;">
          ${
            type === "REGISTRATION"
              ? `An authorization request was made to create a new user account (${requestDetails || "New Admin"}). Use the 6-digit code below to approve and create this account:`
              : `A password reset request was initiated for your account. Use the 6-digit verification code below to authorize this change:`
          }
        </p>

        <div style="background-color: #ECEEF2; border-radius: 12px; border: 1px solid #E2E5EC; padding: 18px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #181A1F;">
            ${code}
          </span>
        </div>

        <p style="font-size: 12px; color: #8E95A2; line-height: 1.5; margin: 0 0 16px 0;">
          This code expires in <strong>15 minutes</strong>. If you did not authorize this action, you can safely ignore this email.
        </p>

        <div style="border-top: 1px solid #E2E5EC; padding-top: 16px; text-align: center; font-size: 11px; color: #8E95A2;">
          Atelier Instagram CRM • Monochromatic Multi-Tenant Architecture
        </div>
      </div>
    </div>
  `;

  // Attempt dispatch via SMTP if configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
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

      console.log(`[MAILER] ${type} code sent via SMTP to ${targetEmail}`);
      return { success: true, code, mode: "smtp" };
    } catch (err) {
      console.error("[MAILER ERROR] SMTP failed:", err);
    }
  }

  // Fallback log for development
  console.log(`\n======================================================`);
  console.log(`[${type} CODE FOR ${targetEmail}]: ${code}`);
  console.log(`======================================================\n`);

  return { success: true, code, mode: "logged" };
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
