"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Send,
  Heart,
  EyeOff,
  Eye,
  CheckCircle2,
  Clock,
  Tag,
  User,
  Phone,
  Mail,
  ChevronDown,
  Edit2,
  Plus,
  X,
  FileText,
  AlertCircle,
  Command,
  HelpCircle,
  Repeat,
  RefreshCw,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { formatTimeAgo, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ConversationItem {
  id: string;
  type: "DM" | "POST_COMMENT";
  status: "OPEN" | "RESOLVED" | "NEEDS_ATTENTION";
  postId?: string | null;
  postCaption?: string | null;
  unreadCount: number;
  lastMessageAt: string;
  lastMessage: string;
  contact: {
    id: string;
    username: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    pipelineStage: string;
    tags: string[];
    isOnline: boolean;
  };
}

interface MessageDetail {
  id: string;
  senderType: "CUSTOMER" | "AGENT" | "AUTOMATION";
  content: string;
  mediaUrl?: string | null;
  storyReplyContext?: string | null;
  isPublicComment: boolean;
  commentId?: string | null;
  parentCommentId?: string | null;
  isLiked: boolean;
  isHidden: boolean;
  createdAt: string;
}

interface ContactNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface TemplateItem {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  category: string;
}

const PIPELINE_STAGES = [
  { id: "NEW_LEAD", label: "New Lead" },
  { id: "INTERESTED", label: "Interested" },
  { id: "NEGOTIATING", label: "Negotiating" },
  { id: "CONVERTED", label: "Converted" },
  { id: "CLOSED", label: "Closed" },
];

function InboxContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "ALL";

  // State
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  // Composer State
  const [composerText, setComposerText] = useState("");
  const [isPublicReply, setIsPublicReply] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);

  // Right Column CRM Edit State
  const [editableEmail, setEditableEmail] = useState("");
  const [editablePhone, setEditablePhone] = useState("");
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Templates
  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
  }, []);

  // Fetch Conversation Queue
  const fetchQueue = async (selectedIdToKeep?: string) => {
    try {
      const res = await fetch(
        `/api/conversations?filter=${filter}&search=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
        if (!selectedIdToKeep && data.length > 0 && !activeConversationId) {
          setActiveConversationId(data[0].id);
        }
      }
      setIsLoadingQueue(false);
    } catch (err) {
      console.error("Queue load failed:", err);
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filter, searchQuery]);

  // Fetch Active Thread Detail
  const fetchActiveThread = async (id: string) => {
    setIsLoadingThread(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (res.ok) {
        setActiveConversation(data);
        setEditableEmail(data.contact?.email || "");
        setEditablePhone(data.contact?.phone || "");
        setIsPublicReply(data.type === "POST_COMMENT");
      }
      setIsLoadingThread(false);
    } catch (err) {
      console.error("Thread load failed:", err);
      setIsLoadingThread(false);
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      fetchActiveThread(activeConversationId);
    }
  }, [activeConversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  // Send Reply
  const handleSendMessage = async () => {
    if (!composerText.trim() || !activeConversation) return;

    setIsSending(true);
    try {
      const parentComment = activeConversation.messages?.find(
        (m: MessageDetail) => m.isPublicComment && m.commentId
      );

      const res = await fetch(`/api/conversations/${activeConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: composerText,
          isPublicComment: activeConversation.type === "POST_COMMENT" && isPublicReply,
          parentCommentId: parentComment?.commentId || null,
        }),
      });

      const newMsg = await res.json();
      if (res.ok) {
        setActiveConversation((prev: any) => ({
          ...prev,
          messages: [...(prev.messages || []), newMsg],
        }));
        setComposerText("");
        setShowTemplatesMenu(false);
        toast({
          title: isPublicReply ? "Public Comment Reply Sent" : "Private DM Delivered",
          description: `@${activeConversation.contact.username} will receive your response`,
          type: "success",
        });
        fetchQueue(activeConversation.id);
      } else {
        toast({ title: "Failed to send message", type: "error" });
      }
      setIsSending(false);
    } catch (err) {
      setIsSending(false);
      toast({ title: "Error sending message", type: "error" });
    }
  };

  // Like or Hide Comment Toggle
  const handleToggleCommentAction = async (
    messageId: string,
    action: "TOGGLE_LIKE" | "TOGGLE_HIDE"
  ) => {
    try {
      const res = await fetch(
        `/api/conversations/${activeConversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, action }),
        }
      );
      const updated = await res.json();
      if (res.ok) {
        setActiveConversation((prev: any) => ({
          ...prev,
          messages: prev.messages.map((m: MessageDetail) =>
            m.id === messageId ? updated : m
          ),
        }));
        toast({
          title:
            action === "TOGGLE_LIKE"
              ? updated.isLiked
                ? "Comment Liked on Instagram"
                : "Comment Unliked"
              : updated.isHidden
              ? "Comment Hidden from Public View"
              : "Comment Restored to Public View",
          type: "info",
        });
      }
    } catch (err) {
      toast({ title: "Action failed", type: "error" });
    }
  };

  // AI Smart Suggestion
  const handleAiSuggest = async () => {
    if (!activeConversation) return;
    setIsAiLoading(true);

    try {
      const res = await fetch(
        `/api/conversations/${activeConversation.id}/ai-suggest`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok && data.suggestion) {
        setComposerText(data.suggestion);
        toast({
          title: "AI Response Suggested",
          description: `Language detected: ${data.detectedLanguage === "ar" ? "Arabic" : "English"}`,
          type: "success",
        });
      }
      setIsAiLoading(false);
    } catch {
      setIsAiLoading(false);
      toast({ title: "Failed to generate AI suggestion", type: "error" });
    }
  };

  // Quick Template Selection
  const applyTemplate = (template: TemplateItem) => {
    const contact = activeConversation?.contact;
    const replaced = template.content
      .replace(/\{\{username\}\}/g, contact?.username || "")
      .replace(/\{\{full_name\}\}/g, contact?.fullName || contact?.username || "")
      .replace(/\{\{order_link\}\}/g, "https://atelier-collection.luxury/order");

    setComposerText(replaced);
    setShowTemplatesMenu(false);
  };

  // Update Pipeline Stage
  const handleUpdatePipeline = async (newStage: string) => {
    if (!activeConversation?.contact) return;
    try {
      const res = await fetch(`/api/contacts/${activeConversation.contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStage: newStage }),
      });
      if (res.ok) {
        setActiveConversation((prev: any) => ({
          ...prev,
          contact: { ...prev.contact, pipelineStage: newStage },
        }));
        toast({
          title: "Pipeline Stage Updated",
          description: `Lead moved to ${newStage.replace(/_/g, " ")}`,
          type: "success",
        });
      }
    } catch {
      toast({ title: "Failed to update pipeline stage", type: "error" });
    }
  };

  // Update Contact Info (Email / Phone)
  const handleSaveContactInfo = async () => {
    if (!activeConversation?.contact) return;
    try {
      const res = await fetch(`/api/contacts/${activeConversation.contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editableEmail, phone: editablePhone }),
      });
      if (res.ok) {
        setActiveConversation((prev: any) => ({
          ...prev,
          contact: { ...prev.contact, email: editableEmail, phone: editablePhone },
        }));
        setIsEditingContact(false);
        toast({ title: "Contact info saved", type: "success" });
      }
    } catch {
      toast({ title: "Failed to save contact info", type: "error" });
    }
  };

  // Add Tag
  const handleAddTag = async () => {
    if (!newTagInput.trim() || !activeConversation?.contact) return;
    const currentTags = activeConversation.contact.tags || [];
    if (currentTags.includes(newTagInput.trim())) {
      setNewTagInput("");
      setShowTagInput(false);
      return;
    }

    const updatedTags = [...currentTags, newTagInput.trim()];
    try {
      const res = await fetch(`/api/contacts/${activeConversation.contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
      if (res.ok) {
        setActiveConversation((prev: any) => ({
          ...prev,
          contact: { ...prev.contact, tags: updatedTags },
        }));
        setNewTagInput("");
        setShowTagInput(false);
        toast({ title: `Tag "${newTagInput}" added`, type: "success" });
      }
    } catch {
      toast({ title: "Failed to add tag", type: "error" });
    }
  };

  // Remove Tag
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeConversation?.contact) return;
    const updatedTags = (activeConversation.contact.tags || []).filter(
      (t: string) => t !== tagToRemove
    );
    try {
      const res = await fetch(`/api/contacts/${activeConversation.contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
      if (res.ok) {
        setActiveConversation((prev: any) => ({
          ...prev,
          contact: { ...prev.contact, tags: updatedTags },
        }));
      }
    } catch {
      toast({ title: "Failed to remove tag", type: "error" });
    }
  };

  // Add Note
  const handleAddNote = async () => {
    if (!newNoteText.trim() || !activeConversation?.contact) return;
    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/contacts/${activeConversation.contact.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteText, author: "Senior Sales Partner" }),
      });
      const note = await res.json();
      if (res.ok) {
        setActiveConversation((prev: any) => ({
          ...prev,
          contact: {
            ...prev.contact,
            notes: [note, ...(prev.contact.notes || [])],
          },
        }));
        setNewNoteText("");
        toast({ title: "Team note added", type: "success" });
      }
      setIsAddingNote(false);
    } catch {
      setIsAddingNote(false);
      toast({ title: "Failed to add note", type: "error" });
    }
  };

  // Toggle Conversation Status (Resolve / Reopen)
  const handleToggleStatus = async (newStatus: "OPEN" | "RESOLVED" | "NEEDS_ATTENTION") => {
    if (!activeConversation) return;
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActiveConversation((prev: any) => ({ ...prev, status: newStatus }));
        fetchQueue(activeConversation.id);
        toast({
          title: `Conversation marked as ${newStatus.replace(/_/g, " ")}`,
          type: "info",
        });
      }
    } catch {
      toast({ title: "Failed to update status", type: "error" });
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] -m-8 flex bg-surface overflow-hidden border-t border-borderline">
      {/* =========================================================================
          COLUMN 1: CONVERSATION QUEUE (LEFT)
         ========================================================================= */}
      <div className="w-80 border-r border-borderline flex flex-col bg-surface shrink-0">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-borderline space-y-3 bg-canvas/30">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search conversations, handles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-borderline bg-surface text-xs text-charcoal focus:outline-none focus:border-charcoal transition-colors"
            />
          </div>

          {/* Filter Tabs with layoutId pill */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-medium text-body">
            {[
              { id: "ALL", label: "All" },
              { id: "DM", label: "DMs" },
              { id: "COMMENT", label: "Comments" },
              { id: "UNREAD", label: "Unread" },
              { id: "NEEDS_ATTENTION", label: "Attention" },
            ].map((tab) => {
              const isSelected = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`relative px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                    isSelected ? "text-charcoal font-semibold" : "hover:text-charcoal"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="queue-filter-pill"
                      className="absolute inset-0 bg-subtle rounded-lg border border-borderline"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-borderline">
          {isLoadingQueue ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-subtle/50 animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted text-xs">
              No conversations found for current filter.
            </div>
          ) : (
            conversations.map((item) => {
              const isSelected = item.id === activeConversationId;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveConversationId(item.id)}
                  className={`w-full text-left p-3.5 transition-all flex items-start gap-3 relative ${
                    isSelected
                      ? "bg-subtle/70"
                      : "hover:bg-subtle/30 bg-surface"
                  }`}
                >
                  {/* Left selection indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-charcoal" />
                  )}

                  {/* Avatar + Badge */}
                  <div className="relative shrink-0">
                    <img
                      src={
                        item.contact.avatarUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      }
                      alt={item.contact.username}
                      className="w-10 h-10 rounded-full object-cover border border-borderline"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface border border-borderline flex items-center justify-center text-charcoal">
                      {item.type === "DM" ? (
                        <MessageCircle className="w-2.5 h-2.5" />
                      ) : (
                        <MessageSquare className="w-2.5 h-2.5" />
                      )}
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-charcoal truncate">
                        @{item.contact.username}
                      </span>
                      <span className="text-[10px] text-muted shrink-0">
                        {formatTimeAgo(item.lastMessageAt)}
                      </span>
                    </div>

                    <p className="text-xs text-body truncate line-clamp-1">
                      {item.lastMessage || "No messages yet"}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 overflow-hidden">
                        {item.contact.tags?.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-surface border border-borderline text-[9px] font-medium text-muted truncate"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {item.unreadCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-charcoal shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          COLUMN 2: ACTIVE THREAD & COMPOSER (MIDDLE)
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface border-r border-borderline">
        {isLoadingThread || !activeConversation ? (
          <div className="flex-1 flex items-center justify-center text-muted text-xs">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Loading conversation details...
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="h-16 px-6 border-b border-borderline flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={
                      activeConversation.contact.avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    }
                    alt={activeConversation.contact.username}
                    className="w-9 h-9 rounded-full object-cover border border-borderline"
                  />
                  {activeConversation.contact.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-charcoal border-2 border-surface" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-charcoal">
                      @{activeConversation.contact.username}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-subtle text-body border border-borderline">
                      {activeConversation.type === "DM" ? "Direct Message" : "Post Comment"}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {activeConversation.contact.fullName || "Instagram Customer"}
                  </span>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-subtle rounded-xl border border-borderline text-xs font-medium">
                  {(["OPEN", "NEEDS_ATTENTION", "RESOLVED"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleToggleStatus(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                        activeConversation.status === st
                          ? "bg-surface text-charcoal shadow-subtle font-semibold"
                          : "text-muted hover:text-charcoal"
                      }`}
                    >
                      {st === "NEEDS_ATTENTION" ? "Attention" : st.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Context Card for Post Comments */}
            {activeConversation.type === "POST_COMMENT" && (
              <div className="px-6 py-3 border-b border-borderline bg-canvas/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {activeConversation.postMediaUrl && (
                    <img
                      src={activeConversation.postMediaUrl}
                      alt="Post Thumbnail"
                      className="w-11 h-11 rounded-lg object-cover border border-borderline shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                      Instagram Post Context
                    </span>
                    <p className="text-xs text-charcoal font-medium truncate">
                      {activeConversation.postCaption || "Instagram Feed Post"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted font-medium">Reply Target:</span>
                  <div className="flex items-center gap-1 p-0.5 bg-subtle rounded-lg border border-borderline text-[11px] font-medium">
                    <button
                      onClick={() => setIsPublicReply(true)}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        isPublicReply
                          ? "bg-surface text-charcoal shadow-subtle font-semibold"
                          : "text-muted hover:text-charcoal"
                      }`}
                    >
                      Public Comment
                    </button>
                    <button
                      onClick={() => setIsPublicReply(false)}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        !isPublicReply
                          ? "bg-surface text-charcoal shadow-subtle font-semibold"
                          : "text-muted hover:text-charcoal"
                      }`}
                    >
                      Private DM
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message Thread History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-canvas/20">
              {activeConversation.messages?.map((msg: MessageDetail) => {
                const isCustomer = msg.senderType === "CUSTOMER";
                const isAuto = msg.senderType === "AUTOMATION";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isCustomer ? "items-start" : "items-end"
                    }`}
                  >
                    {/* Story Mention Context Banner */}
                    {msg.storyReplyContext && (
                      <div className="mb-1 text-[11px] text-muted flex items-center gap-1 px-3 py-1 rounded-full bg-subtle border border-borderline">
                        <Sparkles className="w-3 h-3 text-muted" />
                        <span>{msg.storyReplyContext}</span>
                      </div>
                    )}

                    <div
                      className={`max-w-lg rounded-2xl px-4 py-3 text-sm relative group shadow-subtle ${
                        isCustomer
                          ? "bg-surface text-charcoal border border-borderline rounded-bl-sm"
                          : isAuto
                          ? "bg-subtle text-charcoal border border-borderline rounded-br-sm"
                          : "bg-charcoal text-white rounded-br-sm"
                      }`}
                    >
                      {/* Sender label for Automation */}
                      {isAuto && (
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Automation Rule Trigger</span>
                        </div>
                      )}

                      {/* Public vs Private Badge for comments */}
                      {activeConversation.type === "POST_COMMENT" && (
                        <div
                          className={`text-[10px] font-medium tracking-wide mb-1 ${
                            isCustomer
                              ? "text-muted"
                              : isAuto
                              ? "text-muted"
                              : "text-white/60"
                          }`}
                        >
                          {msg.isPublicComment
                            ? "Public Comment Reply"
                            : "Private Direct Message"}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap leading-relaxed font-sans font-arabic">
                        {msg.content}
                      </p>

                      <div
                        className={`mt-1.5 text-[10px] flex items-center justify-end gap-2 ${
                          isCustomer
                            ? "text-muted"
                            : isAuto
                            ? "text-muted"
                            : "text-white/60"
                        }`}
                      >
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </div>

                      {/* Comment controls (Like / Hide) for customer comments */}
                      {isCustomer && msg.isPublicComment && (
                        <div className="mt-2 pt-2 border-t border-borderline flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleToggleCommentAction(msg.id, "TOGGLE_LIKE")
                            }
                            className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                              msg.isLiked
                                ? "text-charcoal font-semibold"
                                : "text-muted hover:text-charcoal"
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                msg.isLiked ? "fill-charcoal" : ""
                              }`}
                            />
                            <span>{msg.isLiked ? "Liked" : "Like"}</span>
                          </button>

                          <button
                            onClick={() =>
                              handleToggleCommentAction(msg.id, "TOGGLE_HIDE")
                            }
                            className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                              msg.isHidden
                                ? "text-charcoal font-semibold"
                                : "text-muted hover:text-charcoal"
                            }`}
                          >
                            {msg.isHidden ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Unhide</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hide Comment</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Smart Reply Composer */}
            <div className="p-4 border-t border-borderline bg-surface space-y-3 relative">
              {/* Quick Replies Menu Popover */}
              <AnimatePresence>
                {showTemplatesMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-4 right-4 mb-2 p-3 bg-surface border border-borderline rounded-2xl shadow-lift max-h-60 overflow-y-auto space-y-2 z-30"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-borderline text-xs font-semibold text-charcoal">
                      <span>Quick Reply Saved Templates</span>
                      <button
                        onClick={() => setShowTemplatesMenu(false)}
                        className="text-muted hover:text-charcoal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => applyTemplate(tpl)}
                          className="text-left p-2 rounded-xl border border-borderline hover:border-charcoal hover:bg-subtle transition-all text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-charcoal">
                              {tpl.title}
                            </span>
                            <span className="font-mono text-[10px] text-muted">
                              {tpl.shortcut}
                            </span>
                          </div>
                          <p className="text-muted text-[11px] line-clamp-2">
                            {tpl.content}
                          </p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Composer Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
                    className="px-2.5 py-1 rounded-lg border border-borderline bg-surface hover:bg-subtle text-xs font-medium text-body flex items-center gap-1.5 transition-colors"
                  >
                    <Command className="w-3.5 h-3.5 text-muted" />
                    <span>Quick Replies (/)</span>
                  </button>

                  <button
                    onClick={handleAiSuggest}
                    disabled={isAiLoading}
                    className="px-2.5 py-1 rounded-lg border border-borderline bg-surface hover:bg-subtle text-xs font-medium text-charcoal flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-charcoal" />
                    )}
                    <span>AI Smart Reply</span>
                  </button>
                </div>

                {activeConversation.type === "POST_COMMENT" && (
                  <span className="text-[11px] text-muted">
                    Sending as:{" "}
                    <strong className="text-charcoal">
                      {isPublicReply ? "Public Comment" : "Private DM"}
                    </strong>
                  </span>
                )}
              </div>

              {/* Textarea & Send Button */}
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={composerText}
                  onChange={(e) => {
                    setComposerText(e.target.value);
                    if (e.target.value === "/") {
                      setShowTemplatesMenu(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message or press '/' for templates... (⌘+Enter to send)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-borderline bg-canvas/30 text-xs text-charcoal focus:outline-none focus:border-charcoal transition-colors resize-none font-arabic"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !composerText.trim()}
                  className="px-4 py-3 rounded-xl bg-charcoal text-white hover:bg-charcoal/90 transition-all flex items-center justify-center disabled:opacity-50 shadow-subtle shrink-0"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* =========================================================================
          COLUMN 3: CRM CUSTOMER PROFILE & LEAD CARD (RIGHT)
         ========================================================================= */}
      <div className="w-80 border-l border-borderline flex flex-col bg-surface shrink-0 overflow-y-auto">
        {!activeConversation?.contact ? (
          <div className="p-6 text-center text-muted text-xs">
            No contact selected
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Profile Card Header */}
            <div className="text-center pb-5 border-b border-borderline">
              <div className="relative inline-block mb-3">
                <img
                  src={
                    activeConversation.contact.avatarUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  }
                  alt={activeConversation.contact.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-borderline mx-auto"
                />
                <span
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-charcoal border-2 border-surface"
                  title="Online"
                />
              </div>

              <h3 className="text-sm font-semibold text-charcoal">
                {activeConversation.contact.fullName || activeConversation.contact.username}
              </h3>
              <p className="text-xs text-muted font-mono mt-0.5">
                @{activeConversation.contact.username}
              </p>

              {activeConversation.contact.bio && (
                <p className="text-xs text-body mt-2 italic px-2">
                  &ldquo;{activeConversation.contact.bio}&rdquo;
                </p>
              )}

              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted">
                <div>
                  <span className="font-semibold text-charcoal block">
                    {activeConversation.contact.followerCount?.toLocaleString() || "12.4k"}
                  </span>
                  <span className="text-[10px]">Followers</span>
                </div>
                <div className="w-px h-6 bg-borderline" />
                <div>
                  <span className="font-semibold text-charcoal block">Verified</span>
                  <span className="text-[10px]">Account</span>
                </div>
              </div>
            </div>

            {/* Pipeline Stage Selector */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-2">
                Sales Pipeline Stage
              </label>
              <div className="space-y-1">
                {PIPELINE_STAGES.map((stage) => {
                  const isCurrent =
                    activeConversation.contact.pipelineStage === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => handleUpdatePipeline(stage.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all ${
                        isCurrent
                          ? "bg-charcoal text-white font-medium shadow-subtle"
                          : "text-body hover:bg-subtle"
                      }`}
                    >
                      <span>{stage.label}</span>
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Details (Editable Phone/Email) */}
            <div className="space-y-3 pt-4 border-t border-borderline">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Client Information
                </span>
                <button
                  onClick={() => setIsEditingContact(!isEditingContact)}
                  className="text-xs text-muted hover:text-charcoal"
                >
                  {isEditingContact ? "Cancel" : <Edit2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {isEditingContact ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-muted block mb-1">Email</label>
                    <input
                      type="email"
                      value={editableEmail}
                      onChange={(e) => setEditableEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-borderline text-xs text-charcoal focus:outline-none focus:border-charcoal"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted block mb-1">Phone</label>
                    <input
                      type="text"
                      value={editablePhone}
                      onChange={(e) => setEditablePhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-borderline text-xs text-charcoal focus:outline-none focus:border-charcoal"
                    />
                  </div>
                  <button
                    onClick={handleSaveContactInfo}
                    className="w-full py-1.5 bg-charcoal text-white text-xs font-semibold rounded-lg hover:bg-charcoal/90 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2.5 text-body">
                    <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="truncate">
                      {activeConversation.contact.email || "No email added"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-body">
                    <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{activeConversation.contact.phone || "No phone added"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Custom CRM Tags */}
            <div className="space-y-2 pt-4 border-t border-borderline">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Tags & Attributes
                </span>
                <button
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="text-xs text-muted hover:text-charcoal"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {activeConversation.contact.tags?.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-subtle text-charcoal text-[11px] font-medium border border-borderline"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-charcoal text-muted"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              {showTagInput && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="New tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    className="flex-1 px-2.5 py-1 rounded-lg border border-borderline text-xs text-charcoal focus:outline-none focus:border-charcoal"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-2.5 py-1 bg-charcoal text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Internal Team Notes */}
            <div className="space-y-3 pt-4 border-t border-borderline">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                Internal Team Notes
              </span>

              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Add private note for advisors..."
                  className="w-full px-2.5 py-2 rounded-xl border border-borderline text-xs text-charcoal focus:outline-none focus:border-charcoal resize-none bg-canvas/30"
                />
                <button
                  onClick={handleAddNote}
                  disabled={isAddingNote || !newNoteText.trim()}
                  className="w-full py-1.5 rounded-xl bg-subtle hover:bg-borderline text-charcoal text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isAddingNote ? "Adding Note..." : "Add Internal Note"}
                </button>
              </div>

              <div className="space-y-2 mt-3">
                {activeConversation.contact.notes?.map((note: ContactNote) => (
                  <div
                    key={note.id}
                    className="p-2.5 rounded-xl border border-borderline bg-canvas/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <span className="font-semibold text-charcoal">
                        {note.author}
                      </span>
                      <span>{formatTimeAgo(note.createdAt)}</span>
                    </div>
                    <p className="text-body leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center text-muted text-xs">
          Loading inbox...
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
