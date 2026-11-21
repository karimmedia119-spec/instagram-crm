"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Inbox,
  Zap,
  MessageSquareText,
  Webhook,
  LogOut,
  KeyRound,
  UserPlus,
  ShieldCheck,
  Instagram,
  User,
  X,
  RefreshCw,
  Lock,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Unified Inbox", href: "/inbox", icon: Inbox, badge: "3" },
  { title: "Automations", href: "/automations", icon: Zap },
  { title: "Quick Replies", href: "/templates", icon: MessageSquareText },
  { title: "Meta Webhook & API", href: "/settings/webhook", icon: Webhook },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [unreadTotal, setUnreadTotal] = useState(3);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // New Account Form
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAccPassword, setNewAccPassword] = useState("");
  const [newRole, setNewRole] = useState("ADMIN");
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccCodeSent, setNewAccCodeSent] = useState(false);
  const [isSendingNewAccCode, setIsSendingNewAccCode] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Fetch current user and check unread count
  useEffect(() => {
    if (pathname === "/login") return;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      });

    fetch("/api/conversations?filter=UNREAD")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUnreadTotal(data.length);
      })
      .catch(() => {});
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast({ title: "Signed out successfully", type: "info" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      setIsChangingPassword(false);

      if (res.ok) {
        toast({ title: "Password Updated Successfully", type: "success" });
        setIsPasswordModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast({
          title: "Password Change Failed",
          description: data.error || "Please verify your current password",
          type: "error",
        });
      }
    } catch {
      setIsChangingPassword(false);
      toast({ title: "Network error updating password", type: "error" });
    }
  };

  const handleSendNewAccCode = async () => {
    setIsSendingNewAccCode(true);
    try {
      const res = await fetch("/api/auth/send-register-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, email: newEmail }),
      });
      const data = await res.json();
      setIsSendingNewAccCode(false);
      if (res.ok) {
        setNewAccCodeSent(true);
        toast({
          title: "Authorization Code Dispatched",
          description: "Sent 6-digit code to karim.media.119@gmail.com",
          type: "success",
        });
      } else {
        toast({
          title: "Dispatch Failed",
          description: data.error || "Failed to send code",
          type: "error",
        });
      }
    } catch {
      setIsSendingNewAccCode(false);
      toast({ title: "Network error sending code", type: "error" });
    }
  };

  const handleCreateNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAccCode || newAccCode.trim().length < 6) {
      toast({
        title: "Security Code Required",
        description: "Please enter the 6-digit code sent to karim.media.119@gmail.com",
        type: "error",
      });
      return;
    }

    setIsCreatingAccount(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password: newAccPassword,
          role: newRole,
          code: newAccCode.trim(),
        }),
      });

      const data = await res.json();
      setIsCreatingAccount(false);

      if (res.ok) {
        toast({
          title: "Account Created Successfully",
          description: `User @${data.user.username} is now registered`,
          type: "success",
        });
        setIsNewAccountModalOpen(false);
        setNewUsername("");
        setNewEmail("");
        setNewAccPassword("");
        setNewAccCode("");
        setNewAccCodeSent(false);
      } else {
        toast({
          title: "Account Creation Failed",
          description: data.error || "Could not register account",
          type: "error",
        });
      }
    } catch {
      setIsCreatingAccount(false);
      toast({ title: "Network error creating account", type: "error" });
    }
  };

  // If on login page, render cleanly without sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-canvas text-charcoal flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-borderline bg-surface flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-borderline">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-charcoal text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-subtle">
                IG
              </div>
              <div>
                <span className="text-sm font-semibold tracking-tight text-charcoal block leading-none">
                  Atelier CRM
                </span>
                <span className="text-[10px] text-muted tracking-wider uppercase font-medium mt-0.5 block">
                  Instagram Studio
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-subtle text-[10px] font-medium text-body border border-borderline">
              Production
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? "text-charcoal font-semibold bg-subtle"
                      : "text-body hover:text-charcoal hover:bg-subtle/50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-charcoal"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-charcoal" : "text-muted group-hover:text-charcoal"
                      }`}
                    />
                    <span>{item.title}</span>
                  </div>

                  {item.href === "/inbox" && unreadTotal > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-charcoal text-white">
                      {unreadTotal}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User Account & Security Controls */}
        <div className="p-4 border-t border-borderline space-y-3 bg-canvas/30">
          {/* Active Admin Profile */}
          <div className="p-3 rounded-xl bg-surface border border-borderline space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-charcoal text-white flex items-center justify-center text-xs font-semibold">
                  {currentUser?.username?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-charcoal truncate">
                    @{currentUser?.username || "admin"}
                  </p>
                  <p className="text-[10px] text-muted truncate">
                    {currentUser?.role || "ADMIN"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="text-muted hover:text-charcoal p-1 rounded-lg hover:bg-subtle transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions (Change Password / Add Account) */}
            <div className="pt-2 border-t border-borderline flex items-center justify-between text-[11px]">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="text-muted hover:text-charcoal flex items-center gap-1 font-medium transition-colors"
              >
                <KeyRound className="w-3 h-3" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => setIsNewAccountModalOpen(true)}
                className="text-muted hover:text-charcoal flex items-center gap-1 font-medium transition-colors"
              >
                <UserPlus className="w-3 h-3" />
                <span>Add Account</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-borderline bg-surface/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-charcoal capitalize">
              {pathname === "/"
                ? "Executive Analytics Dashboard"
                : pathname.replace("/", "").replace(/-/g, " ")}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewAccountModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-borderline hover:bg-subtle text-xs font-medium text-charcoal flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Account (إضافة حساب)</span>
            </button>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-charcoal text-white hover:bg-charcoal/90 text-xs font-medium flex items-center gap-1.5 shadow-subtle transition-all active:scale-[0.98]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>

      {/* =========================================================================
          MODAL 1: CHANGE PASSWORD
         ========================================================================= */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="fixed inset-0 bg-charcoal/30 backdrop-blur-[2px] z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-50 w-full max-w-md bg-surface border border-borderline rounded-2xl shadow-lift overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-borderline flex items-center justify-between bg-canvas/40">
                <h3 className="text-sm font-semibold text-charcoal">
                  Change Password (تغيير كلمة المرور)
                </h3>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="text-muted hover:text-charcoal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-borderline text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-borderline text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                  />
                </div>

                <div className="pt-3 border-t border-borderline flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-borderline text-xs font-medium text-body hover:bg-subtle"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-5 py-2 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal/90 flex items-center gap-2"
                  >
                    {isChangingPassword && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 2: ADD NEW ACCOUNT
         ========================================================================= */}
      <AnimatePresence>
        {isNewAccountModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewAccountModalOpen(false)}
              className="fixed inset-0 bg-charcoal/30 backdrop-blur-[2px] z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-50 w-full max-w-md bg-surface border border-borderline rounded-2xl shadow-lift overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-borderline flex items-center justify-between bg-canvas/40">
                <h3 className="text-sm font-semibold text-charcoal">
                  Add New Team Account (إضافة حساب جديد)
                </h3>
                <button
                  onClick={() => setIsNewAccountModalOpen(false)}
                  className="text-muted hover:text-charcoal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewAccount} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. omar_advisor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-borderline text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="omar@atelier.luxury"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-borderline text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newAccPassword}
                    onChange={(e) => setNewAccPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-borderline text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                  />
                </div>

                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-borderline text-xs text-charcoal focus:outline-none focus:border-charcoal bg-surface"
                  >
                    <option value="ADMIN">Administrator (Independent System / مساحة عمل مستقلة)</option>
                    <option value="AGENT">CRM Agent (Team Member / عضو فريق)</option>
                  </select>
                </div>

                {/* Authorization Code from karim.media.119@gmail.com */}
                <div className="p-3 rounded-xl border border-borderline bg-canvas/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-charcoal flex items-center gap-1.5 text-[11px]">
                      <KeyRound className="w-3.5 h-3.5 text-charcoal" />
                      <span>Security Code (karim.media.119@gmail.com)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSendNewAccCode}
                      disabled={isSendingNewAccCode}
                      className="text-[11px] font-medium text-charcoal underline hover:opacity-85 flex items-center gap-1 disabled:opacity-50"
                    >
                      {isSendingNewAccCode ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>{newAccCodeSent ? "Resend" : "Send Code"}</span>
                    </button>
                  </div>

                  {newAccCodeSent && (
                    <div className="text-[10px] text-body flex items-center gap-1 bg-surface p-1.5 rounded-lg border border-borderline">
                      <CheckCircle2 className="w-3 h-3 text-charcoal" />
                      <span>Code sent to karim.media.119@gmail.com</span>
                    </div>
                  )}

                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newAccCode}
                    onChange={(e) => setNewAccCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3 py-2 rounded-xl border border-borderline text-xs text-charcoal font-mono font-bold tracking-widest text-center focus:outline-none focus:border-charcoal bg-surface"
                  />
                </div>

                <div className="pt-3 border-t border-borderline flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewAccountModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-borderline text-xs font-medium text-body hover:bg-subtle"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingAccount}
                    className="px-5 py-2 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal/90 flex items-center gap-2"
                  >
                    {isCreatingAccount && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create User</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
