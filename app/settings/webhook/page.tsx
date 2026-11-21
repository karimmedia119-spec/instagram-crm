"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Terminal,
  CheckCircle2,
  AlertCircle,
  X,
  Code2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { generateSecureToken, formatDateTime } from "@/lib/utils";

interface WebhookConfigData {
  id: string;
  verifyToken: string;
  appSecret: string;
  businessAccountId: string;
  pageAccessToken: string;
  subscriptions: string[];
}

interface WebhookLogItem {
  id: string;
  method: string;
  endpoint: string;
  statusCode: number;
  headers?: string | null;
  payload: string;
  response?: string | null;
  latencyMs: number;
  createdAt: string;
}

const ALL_SUBSCRIPTIONS = [
  { key: "messages", label: "Messages & Direct Replies" },
  { key: "messaging_postbacks", label: "Messaging Postbacks & Buttons" },
  { key: "comments", label: "Feed Post Comments" },
  { key: "live_comments", label: "Live Broadcast Comments" },
  { key: "mentions", label: "Story Mentions & Tags" },
  { key: "story_insights", label: "Story Interactions & Insights" },
];

export default function WebhookSettingsPage() {
  const { toast } = useToast();

  const [config, setConfig] = useState<WebhookConfigData | null>(null);
  const [logs, setLogs] = useState<WebhookLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Field states
  const [verifyToken, setVerifyToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  // JSON Log Modal state
  const [selectedLog, setSelectedLog] = useState<WebhookLogItem | null>(null);

  // Auto-detected callback URL
  const [callbackUrl, setCallbackUrl] = useState("https://your-domain.com/api/webhooks/instagram");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCallbackUrl(`${window.location.origin}/api/webhooks/instagram`);
    }
  }, []);

  const loadData = async () => {
    try {
      const [configRes, logsRes] = await Promise.all([
        fetch("/api/settings/webhook"),
        fetch("/api/settings/logs"),
      ]);

      const configData = await configRes.json();
      const logsData = await logsRes.json();

      if (configData) {
        setConfig(configData);
        setVerifyToken(configData.verifyToken || "");
        setAppSecret(configData.appSecret || "");
        setBusinessAccountId(configData.businessAccountId || "");
        setPageAccessToken(configData.pageAccessToken || "");
        setSubscriptions(configData.subscriptions || []);
      }

      if (Array.isArray(logsData)) {
        setLogs(logsData);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Settings load failed:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied`,
      description: "Copied to clipboard successfully",
      type: "success",
    });
  };

  const handleGenerateToken = () => {
    const newToken = generateSecureToken(32);
    setVerifyToken(newToken);
    toast({
      title: "New Secure Token Generated",
      description: "Remember to save your configuration changes",
      type: "info",
    });
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/webhook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifyToken,
          appSecret,
          businessAccountId,
          pageAccessToken,
          subscriptions,
        }),
      });

      const updated = await res.json();
      if (res.ok) {
        setConfig(updated);
        toast({
          title: "Webhook Credentials Saved",
          description: "All database settings synchronized",
          type: "success",
        });
      } else {
        toast({ title: "Failed to save configuration", type: "error" });
      }
      setIsSaving(false);
    } catch {
      setIsSaving(false);
      toast({ title: "Network error saving config", type: "error" });
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessAccountId, pageAccessToken }),
      });
      const data = await res.json();
      setIsTesting(false);
      setTestResult(data);
      if (data.connected) {
        toast({
          title: "Connection Verified",
          description: `Account: ${data.account?.name || data.status}`,
          type: "success",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Unable to reach Meta Graph API",
          type: "error",
        });
      }
    } catch (err) {
      setIsTesting(false);
      toast({ title: "Verification Error", type: "error" });
    }
  };

  const handleToggleSubscription = (key: string) => {
    if (subscriptions.includes(key)) {
      setSubscriptions(subscriptions.filter((s) => s !== key));
    } else {
      setSubscriptions([...subscriptions, key]);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch("/api/settings/logs", { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
        toast({ title: "Webhook logs cleared", type: "info" });
      }
    } catch {
      toast({ title: "Failed to clear logs", type: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-28 rounded-2xl bg-surface border border-borderline animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-surface border border-borderline animate-pulse" />
          <div className="h-64 rounded-2xl bg-surface border border-borderline animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Gateway Status Banner */}
      <div className="p-7 rounded-3xl glass-panel border border-white/80 shadow-[0_16px_36px_-12px_rgba(24,26,31,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#242730] to-[#121418] text-white flex items-center justify-center shrink-0 shadow-sm border border-white/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-charcoal">
                Instagram Webhook Gateway
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full glass-pill text-charcoal text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-charcoal shadow-sm" />
                Production Live
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Listening to real Meta Graph API v20.0 webhooks with SHA256 payload verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl glass-pill hover:bg-white text-xs font-semibold text-charcoal flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Status</span>
          </button>
        </div>
      </div>

      {/* 2 & 3. Webhook Credentials & Graph API Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Webhook Endpoint Credentials */}
        <div className="p-7 rounded-3xl glass-card border border-white/80 shadow-[0_16px_36px_-12px_rgba(24,26,31,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/60">
            <Webhook className="w-4 h-4 text-charcoal" />
            <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider">
              Webhook Endpoint Credentials
            </h3>
          </div>

          {/* Callback URL */}
          <div>
            <label className="text-[11px] font-medium text-body block mb-1">
              Callback URL (Paste into Meta App Dashboard)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={callbackUrl}
                className="flex-1 px-3 py-2 rounded-xl glass-input text-xs text-charcoal font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(callbackUrl, "Callback URL")}
                className="px-3 py-2 rounded-xl glass-pill hover:bg-white text-xs font-medium text-charcoal transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Verify Token */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-body">
                Verify Token (hub.verify_token)
              </label>
              <button
                type="button"
                onClick={handleGenerateToken}
                className="text-[10px] text-body hover:text-charcoal font-medium underline"
              >
                Generate Secure Token
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl glass-input text-xs text-charcoal font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(verifyToken, "Verify Token")}
                className="px-3 py-2 rounded-xl glass-pill hover:bg-white text-xs font-medium text-charcoal transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Meta App Secret */}
          <div>
            <label className="text-[11px] font-medium text-body block mb-1">
              Meta App Secret (X-Hub-Signature-256 HMAC Validation)
            </label>
            <div className="relative">
              <input
                type={showAppSecret ? "text" : "password"}
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder="Enter Meta App Secret..."
                className="w-full px-3 py-2 pr-10 rounded-xl glass-input text-xs text-charcoal font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowAppSecret(!showAppSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
              >
                {showAppSecret ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Instagram Graph API Credentials */}
        <div className="p-7 rounded-3xl glass-card border border-white/80 shadow-[0_16px_36px_-12px_rgba(24,26,31,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/60">
            <Key className="w-4 h-4 text-charcoal" />
            <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider">
              Instagram Graph API Credentials
            </h3>
          </div>

          {/* Business Account ID */}
          <div>
            <label className="text-[11px] font-medium text-body block mb-1">
              Instagram Business Account ID
            </label>
            <input
              type="text"
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
              placeholder="e.g. 17841405391088219"
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-charcoal font-mono focus:outline-none"
            />
          </div>

          {/* Access Token */}
          <div>
            <label className="text-[11px] font-medium text-body block mb-1">
              Page / System User Access Token
            </label>
            <div className="relative">
              <input
                type={showAccessToken ? "text" : "password"}
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
                placeholder="EAAB..."
                className="w-full px-3 py-2 pr-10 rounded-xl glass-input text-xs text-charcoal font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowAccessToken(!showAccessToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
              >
                {showAccessToken ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Verify & Test Connection Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full py-2.5 rounded-xl glass-pill hover:bg-white text-xs font-semibold text-charcoal transition-all flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying Live Meta Credentials...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verify & Test Live Connection
                </>
              )}
            </button>

            {testResult && (
              <div className="mt-2.5 p-3 rounded-2xl bg-white/50 backdrop-blur-md text-xs border border-white">
                <span className="font-semibold text-charcoal">
                  Status: {testResult.status}
                </span>
                {testResult.account && (
                  <p className="text-muted text-[11px] mt-0.5">
                    Connected Account: {testResult.account.name} (ID: {testResult.account.id})
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Webhook Event Subscriptions Card */}
      <div className="p-7 rounded-3xl glass-panel border border-white/80 shadow-[0_16px_36px_-12px_rgba(24,26,31,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/60">
          <div>
            <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider">
              Webhook Event Subscriptions
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Select which Instagram Graph API webhook events the application listens to
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {ALL_SUBSCRIPTIONS.map((sub) => {
            const isSubscribed = subscriptions.includes(sub.key);
            return (
              <button
                key={sub.key}
                type="button"
                onClick={() => handleToggleSubscription(sub.key)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  isSubscribed
                    ? "border-charcoal bg-white/90 shadow-sm"
                    : "border-white/70 glass-card"
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-charcoal block">
                    {sub.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    {sub.key}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSubscribed
                      ? "border-charcoal bg-charcoal text-white shadow-sm"
                      : "border-borderline"
                  }`}
                >
                  {isSubscribed && <Check className="w-2.5 h-2.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Save Configuration Action Bar */}
        <div className="pt-4 border-t border-white/60 flex items-center justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl glass-button-primary text-white text-xs font-semibold flex items-center gap-2"
          >
            {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* 5. Live Webhook Event Inspector Table */}
      <div className="p-7 rounded-3xl glass-panel border border-white/80 shadow-[0_16px_36px_-12px_rgba(24,26,31,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/60">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-charcoal" />
            <div>
              <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                Live Webhook Event Inspector
              </h3>
              <p className="text-xs text-muted">
                Real-time log stream of incoming GET challenges and POST event deliveries from Meta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-1.5 rounded-xl glass-pill hover:bg-white text-muted hover:text-charcoal transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearLogs}
              className="p-1.5 rounded-xl glass-pill hover:bg-white text-muted hover:text-charcoal transition-colors"
              title="Clear Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/60 text-[10px] font-semibold text-muted uppercase tracking-wider">
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No webhook events recorded yet. Connect your Meta App to begin receiving live traffic.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-semibold ${
                          log.method === "POST"
                            ? "bg-charcoal text-white shadow-sm"
                            : "glass-pill text-charcoal"
                        }`}
                      >
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-charcoal font-semibold">
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-muted truncate max-w-[180px]">
                      {log.endpoint}
                    </td>
                    <td className="py-3 px-3 font-mono text-muted">
                      {log.latencyMs}ms
                    </td>
                    <td className="py-3 px-3 text-muted">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 rounded-xl glass-pill hover:bg-white text-charcoal font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>Inspect JSON</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      <AnimatePresence>
        {selectedLog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-charcoal/25 backdrop-blur-sm z-40 transition-opacity"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-50 w-full max-w-2xl glass-panel rounded-3xl shadow-[0_25px_60px_-15px_rgba(24,26,31,0.25),inset_0_1px_2px_rgba(255,255,255,0.95)] overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-white/60 flex items-center justify-between bg-white/30 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-charcoal text-xs">
                    {selectedLog.method} {selectedLog.endpoint}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-charcoal text-white text-[10px] font-mono shadow-sm">
                    {selectedLog.statusCode} OK
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-muted hover:text-charcoal p-1 rounded-lg hover:bg-white/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
                <div>
                  <span className="font-semibold text-charcoal block mb-1">
                    Incoming Request Payload:
                  </span>
                  <pre className="p-4 rounded-2xl bg-white/50 backdrop-blur-md text-charcoal border border-white overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.payload), null, 2);
                      } catch {
                        return selectedLog.payload;
                      }
                    })()}
                  </pre>
                </div>

                {selectedLog.response && (
                  <div>
                    <span className="font-semibold text-charcoal block mb-1">
                      Handler Response:
                    </span>
                    <pre className="p-4 rounded-2xl bg-white/50 backdrop-blur-md text-charcoal border border-white overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.response), null, 2);
                        } catch {
                          return selectedLog.response;
                        }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
