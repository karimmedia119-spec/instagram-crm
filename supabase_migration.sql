-- ==============================================================================
-- INSTAGRAM CRM - MULTI-TENANT SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Copy & Paste into Supabase Dashboard -> SQL Editor -> Click "Run"
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables
DROP TABLE IF EXISTS "WebhookLog" CASCADE;
DROP TABLE IF EXISTS "ContactNote" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;
DROP TABLE IF EXISTS "Contact" CASCADE;
DROP TABLE IF EXISTS "PasswordResetCode" CASCADE;
DROP TABLE IF EXISTS "AutomationRule" CASCADE;
DROP TABLE IF EXISTS "Template" CASCADE;
DROP TABLE IF EXISTS "WebhookConfig" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- 1. Users Table (Each Admin is an independent tenant workspace)
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "username" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN', -- 'ADMIN' | 'AGENT'
    "adminId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Verification & Reset Codes (Sends to karim.media.119@gmail.com)
CREATE TABLE "PasswordResetCode" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RESET', -- 'RESET' | 'REGISTRATION'
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Webhook Configuration (Each Admin connects their own Meta Instagram account)
CREATE TABLE "WebhookConfig" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "verifyToken" TEXT NOT NULL DEFAULT 'ig_crm_secret_token_2026',
    "appSecret" TEXT DEFAULT '',
    "businessAccountId" TEXT DEFAULT '',
    "pageAccessToken" TEXT DEFAULT '',
    "subscriptions" TEXT NOT NULL DEFAULT '["messages","messaging_postbacks","comments","live_comments","mentions","story_insights"]',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Contacts Table (Scoped to Admin/Tenant)
CREATE TABLE "Contact" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "instagramId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "email" TEXT,
    "phone" TEXT,
    "pipelineStage" TEXT NOT NULL DEFAULT 'NEW_LEAD',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_userId_instagramId_key" UNIQUE ("userId", "instagramId")
);

-- 5. Conversations Table
CREATE TABLE "Conversation" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "contactId" TEXT NOT NULL REFERENCES "Contact"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL, -- 'DM' | 'POST_COMMENT'
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "postId" TEXT,
    "postCaption" TEXT,
    "postMediaUrl" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Messages Table
CREATE TABLE "Message" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "storyReplyContext" TEXT,
    "isPublicComment" BOOLEAN NOT NULL DEFAULT false,
    "commentId" TEXT,
    "parentCommentId" TEXT,
    "isLiked" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Contact Notes
CREATE TABLE "ContactNote" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "contactId" TEXT NOT NULL REFERENCES "Contact"("id") ON DELETE CASCADE,
    "author" TEXT NOT NULL DEFAULT 'Agent',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Automation Rules (Scoped to Admin/Tenant)
CREATE TABLE "AutomationRule" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "postId" TEXT,
    "matchType" TEXT NOT NULL DEFAULT 'CONTAINS_ANY',
    "keywords" TEXT NOT NULL,
    "publicReply" TEXT,
    "privateReply" TEXT,
    "ctaUrl" TEXT,
    "ctaTitle" TEXT,
    "applyTag" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Reusable Templates (Scoped to Admin/Tenant)
CREATE TABLE "Template" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "shortcut" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Webhook Logs
CREATE TABLE "WebhookLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "headers" TEXT,
    "payload" TEXT NOT NULL,
    "response" TEXT,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX "idx_contact_userId" ON "Contact"("userId");
CREATE INDEX "idx_contact_instagramId" ON "Contact"("instagramId");
CREATE INDEX "idx_conversation_contactId" ON "Conversation"("contactId");
CREATE INDEX "idx_message_conversationId" ON "Message"("conversationId");
CREATE INDEX "idx_webhooklog_userId" ON "WebhookLog"("userId");

-- Insert Primary Administrator
INSERT INTO "User" ("id", "username", "email", "passwordHash", "role", "createdAt", "updatedAt")
VALUES (
    'usr_admin_default',
    'admin',
    'karim.media.119@gmail.com',
    '$2a$10$f3fW1l649yMqvf14/L7XmO.e2g7yX7O6J.j5C4dK8X7x5v9n6l7m',
    'ADMIN',
    NOW(),
    NOW()
) ON CONFLICT ("username") DO NOTHING;

-- Insert Primary Webhook Configuration
INSERT INTO "WebhookConfig" ("id", "userId", "verifyToken", "appSecret", "businessAccountId", "pageAccessToken", "subscriptions", "updatedAt")
VALUES (
    'wh_config_default',
    'usr_admin_default',
    'ig_crm_secret_token_2026',
    '',
    '',
    '',
    '["messages","messaging_postbacks","comments","live_comments","mentions","story_insights"]',
    NOW()
) ON CONFLICT DO NOTHING;
