"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Tag,
  ArrowRight,
  ExternalLink,
  Sparkles,
  MessageSquare,
  MessageCircle,
  HelpCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface AutomationRule {
  id: string;
  name: string;
  triggerType: "COMMENT_ANY" | "COMMENT_SPECIFIC_POST" | "DM_KEYWORD" | "STORY_MENTION";
  postId?: string | null;
  matchType: "EXACT" | "CONTAINS_ANY" | "ALL";
  keywords: string;
  publicReply?: string | null;
  privateReply?: string | null;
  ctaTitle?: string | null;
  ctaUrl?: string | null;
  applyTag?: string | null;
  isActive: boolean;
  triggerCount: number;
}

export default function AutomationsPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formTriggerType, setFormTriggerType] = useState<AutomationRule["triggerType"]>("COMMENT_ANY");
  const [formPostId, setFormPostId] = useState("");
  const [formMatchType, setFormMatchType] = useState<AutomationRule["matchType"]>("CONTAINS_ANY");
  const [formKeywords, setFormKeywords] = useState("");
  const [formPublicReply, setFormPublicReply] = useState("");
  const [formPrivateReply, setFormPrivateReply] = useState("");
  const [formCtaTitle, setFormCtaTitle] = useState("");
  const [formCtaUrl, setFormCtaUrl] = useState("");
  const [formApplyTag, setFormApplyTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load Rules
  const fetchRules = async () => {
    try {
      const res = await fetch("/api/automations");
      const data = await res.json();
      if (Array.isArray(data)) setRules(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Rules fetch failed:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const openCreateModal = () => {
    setEditingRule(null);
    setFormName("");
    setFormTriggerType("COMMENT_ANY");
    setFormPostId("");
    setFormMatchType("CONTAINS_ANY");
    setFormKeywords("price, pricing, كم السعر");
    setFormPublicReply("Hello @{{username}}, we just sent you a private DM with the complete price sheet!");
    setFormPrivateReply("Hi {{username}}, our pieces begin at $1,250 with complimentary courier transit.");
    setFormCtaTitle("View Price Sheet");
    setFormCtaUrl("https://atelier-collection.luxury/pricing");
    setFormApplyTag("Inquiry");
    setIsModalOpen(true);
  };

  const openEditModal = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormTriggerType(rule.triggerType);
    setFormPostId(rule.postId || "");
    setFormMatchType(rule.matchType);
    setFormKeywords(rule.keywords);
    setFormPublicReply(rule.publicReply || "");
    setFormPrivateReply(rule.privateReply || "");
    setFormCtaTitle(rule.ctaTitle || "");
    setFormCtaUrl(rule.ctaUrl || "");
    setFormApplyTag(rule.applyTag || "");
    setIsModalOpen(true);
  };

  // Toggle Active State
  const handleToggleActive = async (rule: AutomationRule) => {
    try {
      const updatedStatus = !rule.isActive;
      const res = await fetch(`/api/automations/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, isActive: updatedStatus } : r))
        );
        toast({
          title: updatedStatus ? "Rule Activated" : "Rule Paused",
          description: `"${rule.name}" is now ${updatedStatus ? "live" : "paused"}`,
          type: "info",
        });
      }
    } catch {
      toast({ title: "Failed to update rule status", type: "error" });
    }
  };

  // Delete Rule
  const handleDeleteRule = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the rule "${name}"?`)) return;
    try {
      const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
        toast({ title: `Rule "${name}" deleted`, type: "info" });
      }
    } catch {
      toast({ title: "Failed to delete rule", type: "error" });
    }
  };

  // Save Rule (Create or Update)
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formKeywords.trim()) return;

    setIsSaving(true);
    const payload = {
      name: formName.trim(),
      triggerType: formTriggerType,
      postId: formTriggerType === "COMMENT_SPECIFIC_POST" ? formPostId : null,
      matchType: formMatchType,
      keywords: formKeywords.trim(),
      publicReply: formPublicReply.trim() || null,
      privateReply: formPrivateReply.trim() || null,
      ctaTitle: formCtaTitle.trim() || null,
      ctaUrl: formCtaUrl.trim() || null,
      applyTag: formApplyTag.trim() || null,
    };

    try {
      if (editingRule) {
        const res = await fetch(`/api/automations/${editingRule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setRules((prev) =>
            prev.map((r) => (r.id === editingRule.id ? { ...r, ...updated } : r))
          );
          toast({ title: "Automation Rule Updated", type: "success" });
          setIsModalOpen(false);
        }
      } else {
        const res = await fetch("/api/automations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, isActive: true }),
        });
        if (res.ok) {
          const created = await res.json();
          setRules((prev) => [created, ...prev]);
          toast({ title: "New Automation Flow Created", type: "success" });
          setIsModalOpen(false);
        }
      }
      setIsSaving(false);
    } catch {
      setIsSaving(false);
      toast({ title: "Failed to save rule", type: "error" });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-charcoal">
            Automations & Auto-Reply Workflows
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Convert post comments to private direct messages and automate instant replies
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl glass-button-primary text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Automation Rule</span>
        </button>
      </div>

      {/* Rules Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-60 rounded-3xl glass-card animate-pulse"
            />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="p-12 text-center glass-panel border border-white/80 rounded-3xl">
          <Zap className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-charcoal">No automation rules yet</p>
          <p className="text-xs text-muted mt-1">
            Create your first comment-to-DM or keyword auto-reply flow.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 glass-button-primary text-white text-xs font-semibold rounded-xl"
          >
            Create Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rules.map((rule) => (
            <motion.div
              key={rule.id}
              className={`p-6 rounded-3xl glass-card border transition-all flex flex-col justify-between relative ${
                rule.isActive ? "border-white/80" : "border-white/50 opacity-70"
              }`}
            >
              <div>
                {/* Card Top Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-b from-[#242730] to-[#14161A] text-white flex items-center justify-center shrink-0 shadow-sm border border-white/20">
                      {rule.triggerType.includes("COMMENT") ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : rule.triggerType === "STORY_MENTION" ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-charcoal">
                        {rule.name}
                      </h3>
                      <span className="text-[11px] text-muted">
                        Trigger:{" "}
                        <strong className="text-charcoal font-medium">
                          {rule.triggerType.replace(/_/g, " ")}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      rule.isActive ? "bg-charcoal" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        rule.isActive ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Keywords Chips */}
                <div className="my-3 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                    Matching Keywords ({rule.matchType.replace(/_/g, " ")})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {rule.keywords
                      .split(",")
                      .map((k, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full glass-pill text-charcoal text-[11px] font-mono font-arabic"
                        >
                          {k.trim()}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Response Action Summary */}
                <div className="space-y-2 pt-2 border-t border-white/60 text-xs">
                  {rule.publicReply && (
                    <div className="p-3 rounded-2xl bg-white/40 backdrop-blur-md border border-white/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                      <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-0.5">
                        1. Public Comment Reply
                      </span>
                      <p className="text-body line-clamp-2 italic font-arabic">
                        &ldquo;{rule.publicReply.split("\n")[0]}&rdquo;
                      </p>
                    </div>
                  )}

                  {rule.privateReply && (
                    <div className="p-3 rounded-2xl bg-white/40 backdrop-blur-md border border-white/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                      <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-0.5">
                        2. Automated Private DM
                      </span>
                      <p className="text-body line-clamp-2 italic font-arabic">
                        &ldquo;{rule.privateReply}&rdquo;
                      </p>
                      {rule.ctaTitle && (
                        <div className="mt-1 text-[11px] text-charcoal font-semibold flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          <span>CTA: {rule.ctaTitle}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {rule.applyTag && (
                    <div className="flex items-center gap-1.5 text-[11px] text-body pt-1">
                      <Tag className="w-3 h-3 text-muted" />
                      <span>Auto-apply CRM Tag:</span>
                      <span className="font-semibold text-charcoal">
                        {rule.applyTag}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Trigger stats & Edit/Delete */}
              <div className="mt-5 pt-3 border-t border-white/60 flex items-center justify-between text-xs">
                <span className="text-muted font-mono">
                  <strong className="text-charcoal font-semibold">
                    {rule.triggerCount}
                  </strong>{" "}
                  executions
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-1.5 text-muted hover:text-charcoal rounded-xl hover:bg-white/80 transition-colors"
                    title="Edit Rule"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id, rule.name)}
                    className="p-1.5 text-muted hover:text-charcoal rounded-xl hover:bg-white/80 transition-colors"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-charcoal/25 backdrop-blur-sm z-40 transition-opacity"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-50 w-full max-w-2xl glass-panel rounded-3xl shadow-[0_25px_60px_-15px_rgba(24,26,31,0.25),inset_0_1px_2px_rgba(255,255,255,0.95)] max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/60 flex items-center justify-between bg-white/30 backdrop-blur-md">
                <h3 className="text-sm font-semibold text-charcoal">
                  {editingRule ? "Edit Automation Workflow" : "Create Automation Workflow"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted hover:text-charcoal p-1 rounded-lg hover:bg-white/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form
                onSubmit={handleSaveRule}
                className="flex-1 overflow-y-auto p-6 space-y-5 text-xs"
              >
                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Price Inquiry Auto-DM & Reply"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none"
                  />
                </div>

                {/* Trigger Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-charcoal block mb-1">
                      Trigger Event
                    </label>
                    <select
                      value={formTriggerType}
                      onChange={(e: any) => setFormTriggerType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none bg-white/70"
                    >
                      <option value="COMMENT_ANY">Comment on Any Post</option>
                      <option value="COMMENT_SPECIFIC_POST">Comment on Specific Post</option>
                      <option value="DM_KEYWORD">DM Contains Keyword</option>
                      <option value="STORY_MENTION">Story Mention / Reply</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-charcoal block mb-1">
                      Keyword Match Type
                    </label>
                    <select
                      value={formMatchType}
                      onChange={(e: any) => setFormMatchType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none bg-white/70"
                    >
                      <option value="CONTAINS_ANY">Contains Any Keyword</option>
                      <option value="EXACT">Exact Match Only</option>
                      <option value="ALL">All Messages (* wildcard)</option>
                    </select>
                  </div>
                </div>

                {/* Post ID if specific post */}
                {formTriggerType === "COMMENT_SPECIFIC_POST" && (
                  <div>
                    <label className="font-semibold text-charcoal block mb-1">
                      Instagram Post ID
                    </label>
                    <input
                      type="text"
                      value={formPostId}
                      onChange={(e) => setFormPostId(e.target.value)}
                      placeholder="e.g. ig_post_984210"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none font-mono"
                    />
                  </div>
                )}

                {/* Keywords */}
                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Trigger Keywords (Comma-separated Arabic & English)
                  </label>
                  <input
                    type="text"
                    required
                    value={formKeywords}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    placeholder="price, cost, كم السعر, سعر, بكم"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none font-arabic"
                  />
                </div>

                {/* Action 1: Public Reply */}
                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Action 1: Public Comment Reply (Optional, newline-separated for variations)
                  </label>
                  <textarea
                    rows={2}
                    value={formPublicReply}
                    onChange={(e) => setFormPublicReply(e.target.value)}
                    placeholder="Hello @{{username}}, we just sent you a private DM!&#10;مرحباً @{{username}}! تم إرسال كافة التفاصيل عبر رسالة خاصة."
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-charcoal focus:outline-none font-arabic resize-none"
                  />
                  <span className="text-[10px] text-muted block mt-1">
                    Multiple lines rotate randomly to avoid repetitive spam flags. Supports variables: <code className="bg-white/60 px-1 py-0.5 rounded">{"{{username}}"}</code>
                  </span>
                </div>

                {/* Action 2: Private DM */}
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-charcoal block mb-1">
                      Action 2: Automated Private DM Content
                    </label>
                    <textarea
                      rows={3}
                      value={formPrivateReply}
                      onChange={(e) => setFormPrivateReply(e.target.value)}
                      placeholder="Hello {{username}}, thank you for reaching out..."
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-charcoal focus:outline-none font-arabic resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-muted block mb-1 text-[11px]">CTA Button Title</label>
                      <input
                        type="text"
                        value={formCtaTitle}
                        onChange={(e) => setFormCtaTitle(e.target.value)}
                        placeholder="e.g. View Price Sheet"
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs text-charcoal focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-muted block mb-1 text-[11px]">CTA Target URL</label>
                      <input
                        type="url"
                        value={formCtaUrl}
                        onChange={(e) => setFormCtaUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs text-charcoal focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Action 3: CRM Tag */}
                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Action 3: Auto-apply CRM Tag
                  </label>
                  <input
                    type="text"
                    value={formApplyTag}
                    onChange={(e) => setFormApplyTag(e.target.value)}
                    placeholder="e.g. Inquiry, VIP, Wholesale"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-charcoal focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-white/60 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl glass-pill text-xs font-medium text-body hover:text-charcoal transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl glass-button-primary text-white text-xs font-semibold flex items-center gap-2"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingRule ? "Save Changes" : "Create Rule"}</span>
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
