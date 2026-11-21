import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Preparing clean production database slate...");

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

  console.log("Database initialized with 0 mock users. Ready for initial user registration!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
