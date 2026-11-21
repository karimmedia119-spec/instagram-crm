import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding multi-tenant production database...");

  await prisma.webhookLog.deleteMany();
  await prisma.contactNote.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.template.deleteMany();
  await prisma.webhookConfig.deleteMany();
  await prisma.passwordResetCode.deleteMany();
  await prisma.user.deleteMany();

  // Create clean primary admin user
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("admin123", salt);

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "karim.media.119@gmail.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  // Create default Webhook configuration for the admin
  await prisma.webhookConfig.create({
    data: {
      userId: admin.id,
      verifyToken: "ig_crm_secret_token_2026",
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

  console.log("Multi-tenant database initialized! Primary admin created:", admin.username);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
