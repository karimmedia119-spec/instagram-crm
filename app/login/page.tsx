"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

type AuthMode = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>("LOGIN");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields (Sign In)
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registration Fields
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("ADMIN");
  const [regCode, setRegCode] = useState("");
  const [regCodeSent, setRegCodeSent] = useState(false);
  const [isSendingRegCode, setIsSendingRegCode] = useState(false);

  // Forgot Password Fields
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        toast({
          title: "Welcome Back",
          description: `Logged in as @${data.user.username}`,
          type: "success",
        });
        router.push("/");
        router.refresh();
      } else {
        toast({
          title: "Sign In Failed",
          description: data.error || "Invalid username or password",
          type: "error",
        });
      }
    } catch {
      setIsLoading(false);
      toast({ title: "Network error during sign in", type: "error" });
    }
  };

  const handleSendRegistrationCode = async () => {
    setIsSendingRegCode(true);
    try {
      const res = await fetch("/api/auth/send-register-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
        }),
      });

      const data = await res.json();
      setIsSendingRegCode(false);

      if (res.ok) {
        setRegCodeSent(true);
        toast({
          title: "Authorization Code Dispatched",
          description: "6-digit code has been sent to karim.media.119@gmail.com",
          type: "success",
        });
      } else {
        toast({
          title: "Dispatch Failed",
          description: data.error || "Could not dispatch code",
          type: "error",
        });
      }
    } catch {
      setIsSendingRegCode(false);
      toast({ title: "Network error sending code", type: "error" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regCode || regCode.trim().length < 6) {
      toast({
        title: "Security Code Required",
        description: "Please enter the 6-digit code sent to karim.media.119@gmail.com",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
          role: regRole,
          code: regCode.trim(),
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        toast({
          title: "Account Created Successfully",
          description: `Independent workspace initialized for @${data.user.username}!`,
          type: "success",
        });
        router.push("/");
        router.refresh();
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Could not create account",
          type: "error",
        });
      }
    } catch {
      setIsLoading(false);
      toast({ title: "Network error during registration", type: "error" });
    }
  };

  const handleSendResetCode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setCodeSent(true);
        toast({
          title: "Security Code Dispatched",
          description: `Sent 6-digit code to karim.media.119@gmail.com`,
          type: "success",
        });
      } else {
        toast({ title: "Failed to send reset code", type: "error" });
      }
    } catch {
      setIsLoading(false);
      toast({ title: "Network error sending code", type: "error" });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: verificationCode,
          newPassword,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        toast({
          title: "Password Updated",
          description: "Your password has been changed. You can now sign in.",
          type: "success",
        });
        setPassword(newPassword);
        setMode("LOGIN");
        setCodeSent(false);
        setVerificationCode("");
        setNewPassword("");
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Invalid or expired code",
          type: "error",
        });
      }
    } catch {
      setIsLoading(false);
      toast({ title: "Network error resetting password", type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-charcoal text-white flex items-center justify-center font-bold text-sm mx-auto mb-3 shadow-lift">
          IG
        </div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal">
          Atelier Instagram CRM
        </h1>
        <p className="text-xs text-muted mt-1">
          Enterprise Monochromatic Workspace & Social Lead Engine
        </p>
      </div>

      {/* Main Card Container */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md bg-surface border border-borderline rounded-2xl shadow-lift p-8 relative overflow-hidden"
      >
        {/* Tab Switcher: Login vs Add New Account */}
        {mode !== "FORGOT_PASSWORD" && (
          <div className="flex items-center gap-1 p-1 bg-canvas rounded-xl border border-borderline mb-6 text-xs font-medium">
            <button
              onClick={() => setMode("LOGIN")}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === "LOGIN"
                  ? "bg-surface text-charcoal font-semibold shadow-subtle"
                  : "text-muted hover:text-charcoal"
              }`}
            >
              Sign In (تسجيل الدخول)
            </button>
            <button
              onClick={() => setMode("REGISTER")}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === "REGISTER"
                  ? "bg-surface text-charcoal font-semibold shadow-subtle"
                  : "text-muted hover:text-charcoal"
              }`}
            >
              Add New Account (إضافة حساب)
            </button>
          </div>
        )}

        {/* =========================================================================
            MODE 1: SIGN IN FORM
           ========================================================================= */}
        {mode === "LOGIN" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-borderline bg-canvas/30 text-xs text-charcoal focus:outline-none focus:border-charcoal transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-charcoal">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode("FORGOT_PASSWORD")}
                  className="text-[11px] text-body hover:text-charcoal underline"
                >
                  Forgot Password? (نسيت كلمة المرور)
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-borderline bg-canvas/30 text-xs text-charcoal focus:outline-none focus:border-charcoal transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal/90 transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In to CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* =========================================================================
            MODE 2: ADD NEW ACCOUNT (WITH MANDATORY SECURITY CODE TO karim.media.119@gmail.com)
           ========================================================================= */}
        {mode === "REGISTER" && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Security Notice Box */}
            <div className="p-3.5 rounded-xl bg-canvas border border-borderline text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-charcoal font-semibold">
                <ShieldCheck className="w-4 h-4 text-charcoal" />
                <span>Security Authorization Required</span>
              </div>
              <p className="text-body text-[11px] leading-relaxed">
                To create a new account, enter the 6-digit verification code sent to the master authorization email:{" "}
                <strong className="text-charcoal font-mono">karim.media.119@gmail.com</strong>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">
                New Account Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. omar_sales"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-borderline bg-canvas/30 text-xs text-charcoal focus:outline-none focus:border-charcoal transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="agent@atelier.luxury"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-borderline bg-canvas/30 text-xs text-charcoal focus:outline-none focus:border-charcoal transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-borderline bg-canvas/30 text-xs text-charcoal focus:outline-none focus:border-charcoal transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">
                Workspace Role
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-borderline bg-surface text-xs text-charcoal focus:outline-none focus:border-charcoal"
              >
                <option value="ADMIN">Administrator (Independent System / مساحة عمل مستقلة)</option>
                <option value="AGENT">CRM Agent (Team Member / عضو فريق)</option>
              </select>
            </div>

            {/* Verification Code Dispatch & Input Section */}
            <div className="p-3.5 rounded-xl border border-borderline bg-canvas/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-charcoal" />
                  <span>Security Authorization Code</span>
                </label>
                <button
                  type="button"
                  onClick={handleSendRegistrationCode}
                  disabled={isSendingRegCode}
                  className="text-[11px] font-medium text-charcoal underline hover:opacity-80 flex items-center gap-1 disabled:opacity-50"
                >
                  {isSendingRegCode ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>{regCodeSent ? "Resend Code" : "Send Code to Email"}</span>
                </button>
              </div>

              {regCodeSent && (
                <div className="text-[11px] text-body flex items-center gap-1.5 bg-surface p-2 rounded-lg border border-borderline">
                  <CheckCircle2 className="w-3.5 h-3.5 text-charcoal" />
                  <span>Code dispatched to <strong>karim.media.119@gmail.com</strong></span>
                </div>
              )}

              <input
                type="text"
                required
                maxLength={6}
                value={regCode}
                onChange={(e) => setRegCode(e.target.value)}
                placeholder="Enter 6-digit code (e.g. 849201)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-borderline bg-surface text-sm text-charcoal text-center tracking-widest font-mono font-bold focus:outline-none focus:border-charcoal"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal/90 transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account & Initialize Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* =========================================================================
            MODE 3: FORGOT PASSWORD & CODE TO karim.media.119@gmail.com
           ========================================================================= */}
        {mode === "FORGOT_PASSWORD" && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setMode("LOGIN");
                setCodeSent(false);
              }}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-charcoal font-medium mb-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            <div>
              <h2 className="text-sm font-semibold text-charcoal">
                Reset Administrator Password
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Security verification code will be sent to the administrator recovery address:{" "}
                <strong className="text-charcoal font-mono">karim.media.119@gmail.com</strong>
              </p>
            </div>

            {!codeSent ? (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal/90 transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send 6-Digit Code to karim.media.119@gmail.com</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                <div className="p-3 rounded-xl bg-canvas border border-borderline text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-charcoal font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Code Dispatched!</span>
                  </div>
                  <p className="text-muted text-[11px]">
                    Check the inbox of <strong>karim.media.119@gmail.com</strong> and enter the 6-digit code below:
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1.5">
                    6-Digit Security Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-borderline bg-canvas/30 text-sm text-charcoal text-center tracking-widest font-mono font-bold focus:outline-none focus:border-charcoal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1.5">
                    Enter New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-borderline bg-canvas/30 text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal/90 transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save New Password & Sign In</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
