import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cairo } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { AppShell } from "@/components/layout/AppShell";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const arabic = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Instagram CRM & Webhook Automation",
  description:
    "Production-ready Instagram CRM Web Application with unified inbox, automations, and Meta Graph API simulator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${arabic.variable}`}>
      <body className="antialiased font-sans bg-canvas text-charcoal min-h-screen relative selection:bg-charcoal selection:text-white">
        {/* Ambient 3D Depth Layer */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <div className="absolute -top-[12%] -right-[8%] w-[580px] h-[580px] rounded-full bg-gradient-to-br from-slate-200/60 via-gray-300/40 to-transparent blur-[120px] opacity-75" />
          <div className="absolute -bottom-[15%] -left-[10%] w-[640px] h-[640px] rounded-full bg-gradient-to-tr from-gray-300/50 via-slate-200/35 to-transparent blur-[140px] opacity-70" />
          <div className="absolute top-[30%] left-[20%] w-[480px] h-[480px] rounded-full bg-gradient-to-r from-white/70 via-slate-100/45 to-transparent blur-[110px] opacity-85" />
        </div>

        <ToastProvider>
          <div className="relative z-10">
            <AppShell>{children}</AppShell>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
