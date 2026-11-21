"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Tag,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface TemplateItem {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  category: string;
  createdAt: string;
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formShortcut, setFormShortcut] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("GENERAL");
  const [isSaving, setIsSaving] = useState(false);

  const categories = ["ALL", "GREETING", "PRICING", "SHIPPING", "SUPPORT", "GENERAL"];

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (Array.isArray(data)) setTemplates(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Fetch templates error:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormTitle("");
    setFormShortcut("/welcome");
    setFormContent(
      "Hello {{username}}, thank you for reaching out to our atelier! How can our specialists assist your vision today?"
    );
    setFormCategory("GREETING");
    setIsModalOpen(true);
  };

  const openEditModal = (tpl: TemplateItem) => {
    setEditingTemplate(tpl);
    setFormTitle(tpl.title);
    setFormShortcut(tpl.shortcut);
    setFormContent(tpl.content);
    setFormCategory(tpl.category);
    setIsModalOpen(true);
  };

  const handleInsertVariable = (variable: string) => {
    setFormContent((prev) => `${prev} ${variable}`);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete template "${title}"?`)) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast({ title: `Template "${title}" deleted`, type: "info" });
      }
    } catch {
      toast({ title: "Failed to delete template", type: "error" });
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Template copied to clipboard", type: "success" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formShortcut.trim() || !formContent.trim()) return;

    setIsSaving(true);
    const payload = {
      title: formTitle.trim(),
      shortcut: formShortcut.trim(),
      content: formContent.trim(),
      category: formCategory,
    };

    try {
      if (editingTemplate) {
        const res = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setTemplates((prev) =>
            prev.map((t) => (t.id === editingTemplate.id ? updated : t))
          );
          toast({ title: "Template Updated", type: "success" });
          setIsModalOpen(false);
        }
      } else {
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setTemplates((prev) => [...prev, created]);
          toast({ title: "Template Created", type: "success" });
          setIsModalOpen(false);
        }
      }
      setIsSaving(false);
    } catch {
      setIsSaving(false);
      toast({ title: "Failed to save template", type: "error" });
    }
  };

  const filteredTemplates = templates.filter((tpl) => {
    const matchesCategory =
      selectedCategory === "ALL" || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-charcoal">
            Quick Replies & Template Manager
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Pre-approved response templates triggered via &ldquo;/&rdquo; in the chat composer
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-charcoal text-white hover:bg-charcoal/90 text-xs font-medium flex items-center gap-2 shadow-subtle transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Quick Reply</span>
        </button>
      </div>

      {/* Search & Categories */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search templates by title, shortcut, text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-borderline bg-surface text-xs text-charcoal focus:outline-none focus:border-charcoal transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl transition-all font-medium ${
                selectedCategory === cat
                  ? "bg-charcoal text-white shadow-subtle"
                  : "bg-surface text-body border border-borderline hover:text-charcoal"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-surface border border-borderline animate-pulse"
            />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-borderline rounded-2xl">
          <MessageSquareText className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-charcoal">No templates found</p>
          <p className="text-xs text-muted mt-1">
            Try adjusting your search query or create a new template.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => (
            <motion.div
              key={tpl.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-2xl bg-surface border border-borderline shadow-subtle hover:shadow-ambient flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-charcoal text-xs">
                    {tpl.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-subtle border border-borderline font-mono text-[10px] text-charcoal font-semibold shrink-0">
                    {tpl.shortcut}
                  </span>
                </div>

                <p className="text-body text-xs line-clamp-3 leading-relaxed font-arabic">
                  {tpl.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-borderline flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted">
                  {tpl.category}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyContent(tpl.content)}
                    className="p-1.5 text-muted hover:text-charcoal rounded-lg hover:bg-subtle transition-colors"
                    title="Copy Text"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(tpl)}
                    className="p-1.5 text-muted hover:text-charcoal rounded-lg hover:bg-subtle transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id, tpl.title)}
                    className="p-1.5 text-muted hover:text-charcoal rounded-lg hover:bg-subtle transition-colors"
                    title="Delete"
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
              className="fixed inset-0 bg-charcoal/30 backdrop-blur-[2px] z-40 transition-opacity"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-50 w-full max-w-lg bg-surface border border-borderline rounded-2xl shadow-lift overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-borderline flex items-center justify-between bg-canvas/40">
                <h3 className="text-sm font-semibold text-charcoal">
                  {editingTemplate ? "Edit Quick Reply" : "New Quick Reply Template"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted hover:text-charcoal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">
                    Template Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Standard Greeting (Bilingual)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-borderline text-xs text-charcoal focus:outline-none focus:border-charcoal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-charcoal block mb-1">
                      Composer Shortcut (starts with /)
                    </label>
                    <input
                      type="text"
                      required
                      value={formShortcut}
                      onChange={(e) => setFormShortcut(e.target.value)}
                      placeholder="/welcome"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-borderline text-xs text-charcoal focus:outline-none focus:border-charcoal font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-charcoal block mb-1">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-borderline text-xs text-charcoal focus:outline-none focus:border-charcoal bg-surface"
                    >
                      <option value="GREETING">GREETING</option>
                      <option value="PRICING">PRICING</option>
                      <option value="SHIPPING">SHIPPING</option>
                      <option value="SUPPORT">SUPPORT</option>
                      <option value="GENERAL">GENERAL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-charcoal block">
                      Message Content
                    </label>
                    <div className="flex items-center gap-1 text-[11px] text-muted">
                      <span>Insert:</span>
                      {["{{username}}", "{{full_name}}", "{{order_link}}"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleInsertVariable(v)}
                          className="px-1.5 py-0.5 rounded bg-subtle hover:bg-borderline text-charcoal font-mono text-[10px]"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Type template message..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-borderline text-xs text-charcoal focus:outline-none focus:border-charcoal font-arabic"
                  />
                </div>

                <div className="pt-4 border-t border-borderline flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-borderline text-xs font-medium text-body hover:bg-subtle transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal/90 transition-all shadow-subtle flex items-center gap-2"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingTemplate ? "Save Changes" : "Create Template"}</span>
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
