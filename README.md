# Instagram CRM Web Application (Atelier Studio)

> **100% Complete, Production-Ready Instagram CRM & Meta Graph API Webhook Automation Engine**  
> Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, and Prisma ORM.

---

## 🌟 Visual Identity & Apple-Inspired Monochromatic Palette
- **Canvas / App Background:** `#F4F5F7`
- **Card & Panel Surfaces:** `#FFFFFF`
- **Secondary Surfaces / Hover Fills:** `#ECEEF2`
- **Hairline Borders & Dividers:** `#E2E5EC`
- **Muted Icons & Micro-Labels:** `#8E95A2`
- **Secondary Body Text:** `#525866`
- **Headings & Primary CTA Buttons:** `#181A1F` (with `#FFFFFF` text)
- **Typography:** Seamless RTL/LTR bilingual Arabic & English typography (`Cairo` + `Plus Jakarta Sans`).

---

## 🚀 Core Features
1. **Executive Analytics Dashboard (`/`):**
   - 4 Animated KPI Cards (Total Conversations, Comment-to-DM Conversions, Response Latency, Resolution Rate).
   - Interaction Volume Chart (7-day / 30-day DMs vs. Post Comments).
   - High-Conversion Posts & Live Automation Execution Counters.
2. **Unified Omnichannel Inbox (`/inbox`):**
   - 3-column layout: Queue with animated filter tabs (`All`, `DMs`, `Comments`, `Unread`, `Attention`).
   - Post comment thread support with **Public Reply** vs. **Private DM** switcher, comment like/hide controls.
   - Smart Reply Composer with `/` quick replies popover and **AI Smart Reply Assistant** (bilingual Arabic & English).
   - CRM Customer Profile with sales pipeline stages (`New Lead`, `Interested`, `Negotiating`, `Converted`, `Closed`), custom tags, and internal team notes.
3. **Automations & Auto-Reply Engine (`/automations`):**
   - Trigger rules on post comments, specific post IDs, keywords, or story mentions.
   - Arabic & English keyword normalization.
   - Randomized public replies to prevent spam flags + automated private DMs with CTA URL buttons + auto-applied CRM tags.
4. **Quick Replies & Templates (`/templates`):**
   - Pre-approved response templates triggered via `/` in composer.
   - Dynamic variable chips: `{{username}}`, `{{full_name}}`, `{{order_link}}`.
5. **Meta Webhook & API Gateway (`/settings/webhook`):**
   - Auto-detected Callback URL with one-click copy.
   - Verify Token generator + Meta App Secret HMAC SHA-256 validation.
   - Real-time Webhook Event Inspector table showing live GET & POST payloads, HTTP status, and latency.
6. **Authentication & Password Recovery:**
   - **Default Administrator:** `admin` / Password: `admin123`
   - Add new accounts (Admin or Agent) from the UI.
   - Change password dialog.
   - **Forgot Password Workflow:** Dispatches a 6-digit security code to `karim.media.119@gmail.com` with a 15-minute expiration to authorize password resets.

---

## 🛠️ Local Development & Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup SQLite database & generate Prisma client
npx prisma db push

# 3. Seed initial admin user and data
npm run db:seed

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and sign in with:
- **Username:** `admin`
- **Password:** `admin123`

---

## 📦 How to Push to GitHub & Deploy Online (خطوات الرفع على جيت هب والنشر)

### 1. Initialize Git & Push to GitHub:
If you haven't installed Git on your machine, [download Git for Windows](https://git-scm.com/download/win). Then run in your terminal:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Make the initial commit
git commit -m "feat: complete production-ready Instagram CRM"

# Set main branch
git branch -M main

# Link to your new GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/instagram-crm.git

# Push to GitHub
git push -u origin main
```

---

### 2. Deploy to Vercel (1-Click Deployment):
1. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Import your GitHub repository `instagram-crm`.
3. In **Environment Variables**, add:
   - `JWT_SECRET`: A random secure string (e.g. `ig_crm_secret_2026_xyz...`)
   - `DATABASE_URL`: Your production database URL (use free PostgreSQL on [Supabase](https://supabase.com) or [Neon](https://neon.tech)).
   - `META_VERIFY_TOKEN`: Your secret token (e.g. `ig_crm_secret_token_2026`).
   - `NEXT_PUBLIC_APP_URL`: Your deployed Vercel URL (e.g. `https://your-crm.vercel.app`).
4. Click **Deploy**. Vercel will automatically run `prisma generate && next build`.

---

### 3. Connect Meta Instagram Graph API Webhook:
1. Go to the [Meta for Developers Portal](https://developers.facebook.com/).
2. Select your App -> **Instagram** -> **Webhooks**.
3. Set **Callback URL** to:  
   `https://your-domain.vercel.app/api/webhooks/instagram`
4. Set **Verify Token** to match your `META_VERIFY_TOKEN` (default: `ig_crm_secret_token_2026`).
5. Click **Verify and Save**. Meta will send a GET challenge handshake which the CRM answers instantly with `HTTP 200 OK`.
6. Subscribe to `messages` and `comments`. Incoming comments and DMs will now arrive live in your CRM!

---

## 📧 Password Recovery Notification
If the admin forgets their password, clicking **"Forgot Password?"** on the login page sends a 6-digit security verification code to:  
👉 **`karim.media.119@gmail.com`**

Configure SMTP in `.env` for direct email delivery:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
RESET_NOTIFICATION_EMAIL="karim.media.119@gmail.com"
```
*(If SMTP is not configured, the code is securely logged to the console and stored in the database for 15 minutes).*

---

© 2026 Atelier Instagram CRM. All rights reserved.
