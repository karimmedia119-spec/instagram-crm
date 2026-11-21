"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  CheckCircle2,
  ChevronLeft,
  Send,
  Sparkles,
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
  const [systemHasAdmin, setSystemHasAdmin] = useState<boolean | null>(null);

  // Form Fields (Sign In)
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registration Fields
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("ADMIN");
  const [regCode, setRegCode] = useState("");
  const [regAuthTicket, setRegAuthTicket] = useState("");
  const [regCodeSent, setRegCodeSent] = useState(false);
  const [isSendingRegCode, setIsSendingRegCode] = useState(false);

  // Forgot Password Fields
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resetAuthTicket, setResetAuthTicket] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Check if system already has an admin user
  useEffect(() => {
    fetch("/api/auth/system-status")
      .then((r) => r.json())
      .then((data) => {
        setSystemHasAdmin(data.hasAdmin);
        if (!data.hasAdmin) {
          setMode("REGISTER");
        }
      })
      .catch(() => {});
  }, []);

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
        if (data.authTicket) setRegAuthTicket(data.authTicket);
        setRegCode(""); // Keep input blank for user to type from email
        toast({
          title: "تم إرسال كود التحقق بنجاح",
          description: "تم إرسال الرمز المكون من 6 أرقام إلى بريدك karim.media.119@gmail.com",
          type: "success",
        });
      } else {
        toast({
          title: "فشل الإرسال",
          description: data.error || "تعذر إرسال كود التحقق إلى البريد",
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
        title: "الرمز مطلوب",
        description: "يرجى إدخال الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني",
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
          authTicket: regAuthTicket,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: `تم تهيئة مساحة العمل الخاصة بك @${data.user.username}!`,
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
        if (data.authTicket) setResetAuthTicket(data.authTicket);
        setVerificationCode(""); // Keep input blank for user to type from email
        toast({
          title: "تم إرسال كود الاستعادة بنجاح",
          description: "تم إرسال رمز الأمان المكون من 6 أرقام إلى بريدك karim.media.119@gmail.com",
          type: "success",
        });
      } else {
        toast({ title: "فشل إرسال كود الاستعادة", type: "error" });
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
          code: verificationCode.trim(),
          newPassword,
          authTicket: resetAuthTicket,
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
        setResetAuthTicket("");
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
      toast({ title: "Network error during password reset", type: "error" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative">
      {/* 3D Floating Glass Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center mb-7 relative z-10"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#242730] to-[#121418] text-white flex items-center justify-center font-bold text-sm mx-auto mb-3.5 shadow-[0_14px_30px_-6px_rgba(24,26,31,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/20 transition-transform duration-300 hover:scale-105 cursor-pointer">
          <span className="tracking-widest">IG</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal">
          Atelier Instagram CRM
        </h1>
        <p className="text-xs text-muted mt-1 font-medium tracking-wide">
          Ultra-Glass 3D Luxury Social Automation Engine
        </p>
      </motion.div>

      {/* Main 3D Floating Glass Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 relative overflow-hidden z-10"
      >
        {/* Specular Ambient Glow inside Glass */}
        <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-white/45 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full bg-slate-300/30 blur-2xl pointer-events-none" />

        {/* First-time setup banner if 0 admins exist */}
        {systemHasAdmin === false && (
          <div className="mb-5 p-3.5 rounded-2xl bg-black/[0.03] border border-black/10 text-xs text-charcoal flex items-start gap-2.5 shadow-subtle">
            <Sparkles className="w-4 h-4 text-charcoal shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-charcoal">إعداد المدير الأول / Primary Setup</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                أنشئ حساب المدير الرئيسي لتفعيل مساحة عمل CRM الخاصة بك بالكامل.
              </p>
            </div>
          </div>
        )}

        {/* Tab Switcher: Login vs Add New Account */}
        {mode !== "FORGOT_PASSWORD" && (
          <div className="flex items-center gap-1 p-1 bg-white/40 backdrop-blur-md rounded-2xl border border-white/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] mb-6 text-xs font-medium">
            <button
              onClick={() => setMode("LOGIN")}
              className={`flex-1 py-2.5 rounded-xl transition-all duration-200 ${
                mode === "LOGIN"
                  ? "bg-white/95 text-charcoal font-semibold shadow-[0_4px_14px_rgba(24,26,31,0.06),inset_0_1px_1px_rgba(255,255,255,1)] border border-white"
                  : "text-muted hover:text-charcoal"
              }`}
            >
              Sign In (تسجيل الدخول)
            </button>
            <button
              onClick={() => setMode("REGISTER")}
              className={`flex-1 py-2.5 rounded-xl transition-all duration-200 ${
                mode === "REGISTER"
                  ? "bg-white/95 text-charcoal font-semibold shadow-[0_4px_14px_rgba(24,26,31,0.06),inset_0_1px_1px_rgba(255,255,255,1)] border border-white"
                  : "text-muted hover:text-charcoal"
              }`}
            >
              {systemHasAdmin === false ? "Create Admin (إنشاء حساب)" : "Add Account (إضافة حساب)"}
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none transition-all font-mono"
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
                  onClick={() => {
                    setMode("FORGOT_PASSWORD");
                    setCodeSent(false);
                    setVerificationCode("");
                    setNewPassword("");
                  }}
                  className="text-[11px] font-semibold text-muted hover:text-charcoal transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none transition-all font-mono"
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
              className="w-full py-3.5 rounded-xl glass-button-primary text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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
            MODE 2: REGISTRATION WITH SECURITY CODE
           ========================================================================= */}
        {mode === "REGISTER" && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. karim_admin"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none transition-all font-mono"
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
                  placeholder="karim.media.119@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none transition-all font-mono"
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none transition-all font-mono"
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
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none bg-white/70"
              >
                <option value="ADMIN">Administrator (Independent System / مساحة عمل مستقلة)</option>
                <option value="AGENT">CRM Agent (Team Member / عضو فريق)</option>
              </select>
            </div>

            {/* 3D Glass Verification Box */}
            <div className="p-3.5 rounded-2xl bg-white/40 backdrop-blur-md border border-white/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_14px_rgba(24,26,31,0.02)] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-charcoal" />
                  <span>Security Authorization Code</span>
                </label>
                <button
                  type="button"
                  onClick={handleSendRegistrationCode}
                  disabled={isSendingRegCode}
                  className="text-[11px] font-semibold text-charcoal underline hover:opacity-80 flex items-center gap-1 disabled:opacity-50"
                >
                  {isSendingRegCode ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>{regCodeSent ? "إعادة إرسال الكود" : "إرسال الكود إلى الإيميل"}</span>
                </button>
              </div>

              {regCodeSent && (
                <div className="text-xs text-emerald-900 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    تم إرسال كود التحقق بنجاح إلى <strong>karim.media.119@gmail.com</strong>. يرجى فتح بريدك الإلكتروني وكتابة الكود بالأسفل:
                  </span>
                </div>
              )}

              <input
                type="text"
                required
                maxLength={6}
                value={regCode}
                onChange={(e) => setRegCode(e.target.value)}
                placeholder="أدخل الرمز المكون من 6 أرقام من الإيميل"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-charcoal text-center tracking-widest font-mono font-bold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl glass-button-primary text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
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
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-charcoal font-medium mb-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            <div>
              <h2 className="text-sm font-semibold text-charcoal">
                Reset Administrator Password
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Security verification code will be sent to your administrator recovery address:{" "}
                <strong className="text-charcoal font-mono">karim.media.119@gmail.com</strong>
              </p>
            </div>

            {!codeSent ? (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl glass-button-primary text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>إرسال كود الاستعادة إلى karim.media.119@gmail.com</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 text-emerald-900 shadow-subtle">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تم إرسال كود التحقق بنجاح!</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    يرجى تفقد صندوق الوارد في <strong>karim.media.119@gmail.com</strong> وإدخال الرمز المكون من 6 أرقام بالأسفل:
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
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-charcoal text-center tracking-widest font-mono font-bold focus:outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal font-mono focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl glass-button-primary text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Code & Update Password</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </motion.div>

      {/* Luxury Footer Monogram */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[11px] text-muted mt-7 text-center font-medium tracking-wider uppercase relative z-10"
      >
        Atelier Monochromatic • Ultra-Glass Architectural Design
      </motion.p>
    </div>
  );
}
