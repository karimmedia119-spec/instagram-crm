"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Repeat,
  Clock,
  Sparkles,
  Zap,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  kpis: {
    totalConversations: number;
    conversionRate: string;
    avgResponseTime: string;
    autoReplyResolutionRate: string;
    sparklines: {
      conversations: number[];
      conversions: number[];
      responseTime: number[];
      resolution: number[];
    };
  };
  activityChart: Array<{
    day: string;
    dms: number;
    comments: number;
  }>;
  recentTriggers: Array<{
    id: string;
    ruleName: string;
    triggerType: string;
    triggerCount: number;
    lastTriggered: string;
  }>;
  topPosts: Array<{
    id: string;
    caption: string;
    mediaUrl: string;
    commentsCount: number;
    convertedLeads: number;
    conversionRate: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7D" | "30D">("7D");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard load failed:", err);
        setIsLoading(false);
      });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 rounded-3xl glass-card animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-3xl glass-panel animate-pulse" />
          <div className="h-80 rounded-3xl glass-panel animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* 4 Animated 3D Glass KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Conversations */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-3xl glass-card relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-muted mb-3.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-body">
              Total Conversations
            </span>
            <div className="w-9 h-9 rounded-2xl bg-white/70 backdrop-blur-md flex items-center justify-center text-charcoal shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.95)] border border-white/80 transition-transform group-hover:scale-105">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-charcoal font-sans">
              {data.kpis.totalConversations}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal glass-pill px-2.5 py-0.5 rounded-full">
              +14.2%
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-muted text-xs">
            <span>DMs & Comments across 30 days</span>
          </div>
        </motion.div>

        {/* KPI 2: Comment-to-DM Conversions */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-3xl glass-card relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-muted mb-3.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-body">
              Comment-to-DM Rate
            </span>
            <div className="w-9 h-9 rounded-2xl bg-white/70 backdrop-blur-md flex items-center justify-center text-charcoal shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.95)] border border-white/80 transition-transform group-hover:scale-105">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-charcoal font-sans">
              {data.kpis.conversionRate}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal glass-pill px-2.5 py-0.5 rounded-full">
              +6.8%
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-muted text-xs">
            <span>Public comments converted to direct DMs</span>
          </div>
        </motion.div>

        {/* KPI 3: Avg Response Time */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-3xl glass-card relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-muted mb-3.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-body">
              First Response Time
            </span>
            <div className="w-9 h-9 rounded-2xl bg-white/70 backdrop-blur-md flex items-center justify-center text-charcoal shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.95)] border border-white/80 transition-transform group-hover:scale-105">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-charcoal font-sans">
              {data.kpis.avgResponseTime}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal glass-pill px-2.5 py-0.5 rounded-full">
              -42s faster
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-muted text-xs">
            <span>Automated & human agent average</span>
          </div>
        </motion.div>

        {/* KPI 4: Auto-Reply Resolution Rate */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-3xl glass-card relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-muted mb-3.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-body">
              Auto-Reply Resolution
            </span>
            <div className="w-9 h-9 rounded-2xl bg-white/70 backdrop-blur-md flex items-center justify-center text-charcoal shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.95)] border border-white/80 transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-charcoal font-sans">
              {data.kpis.autoReplyResolutionRate}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal glass-pill px-2.5 py-0.5 rounded-full">
              High
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-muted text-xs">
            <span>Inquiries resolved without escalation</span>
          </div>
        </motion.div>
      </div>

      {/* Main Charts & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Volume Chart */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 p-7 rounded-3xl glass-panel flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-charcoal">
                Interaction Volume Breakdown
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Direct messages vs. post comments activity
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-white/40 backdrop-blur-md rounded-2xl border border-white/70 text-xs font-medium">
              <button
                onClick={() => setTimeRange("7D")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeRange === "7D"
                    ? "bg-white/95 text-charcoal shadow-sm font-semibold border border-white"
                    : "text-body hover:text-charcoal"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange("30D")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeRange === "30D"
                    ? "bg-white/95 text-charcoal shadow-sm font-semibold border border-white"
                    : "text-body hover:text-charcoal"
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          {/* 3D Glass Bar Visualization */}
          <div className="h-56 flex items-end justify-between gap-4 pt-6 px-2">
            {data.activityChart.map((item, idx) => {
              const maxVal = 70;
              const commentHeight = Math.min(100, (item.comments / maxVal) * 100);
              const dmHeight = Math.min(100, (item.dms / maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-44">
                    {/* Post Comments Bar */}
                    <div
                      style={{ height: `${commentHeight}%` }}
                      className="w-full max-w-[14px] rounded-t-lg bg-gradient-to-t from-[#14161A] to-[#2B2F3A] transition-all group-hover:opacity-90 relative shadow-sm"
                      title={`${item.comments} Post Comments`}
                    />
                    {/* Direct Messages Bar */}
                    <div
                      style={{ height: `${dmHeight}%` }}
                      className="w-full max-w-[14px] rounded-t-lg bg-gradient-to-t from-slate-200 to-gray-300 transition-all group-hover:bg-slate-300 relative border-t border-white shadow-sm"
                      title={`${item.dms} Direct Messages`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted group-hover:text-charcoal transition-colors">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-white/60 flex items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-gradient-to-t from-[#14161A] to-[#2B2F3A] inline-block shadow-sm" />
                <span className="text-body font-medium">Post Comments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-300 inline-block border border-white" />
                <span className="text-body font-medium">Direct Messages</span>
              </div>
            </div>
            <span className="text-[11px]">Updated live from Meta Webhook</span>
          </div>
        </motion.div>

        {/* Top Performing Posts Card */}
        <motion.div
          variants={itemVariants}
          className="p-7 rounded-3xl glass-panel flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-charcoal">
                High-Conversion Posts
              </h2>
              <Link
                href="/inbox?filter=COMMENT"
                className="text-xs text-muted hover:text-charcoal font-medium transition-colors"
              >
                View all
              </Link>
            </div>
            <p className="text-xs text-muted mb-5">
              Posts generating the highest comment-to-DM conversions
            </p>

            <div className="space-y-3.5">
              {data.topPosts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted border border-white/70 rounded-2xl bg-white/30">
                  No post comment activity recorded yet.
                </div>
              ) : (
                data.topPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl glass-card space-y-2 group"
                  >
                    <p className="text-xs text-charcoal font-medium line-clamp-2">
                      {post.caption}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>{post.commentsCount} comments</span>
                      <span className="font-semibold text-charcoal">
                        {post.convertedLeads} converted leads ({post.conversionRate})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/60">
            <Link
              href="/inbox"
              className="w-full py-2.5 px-4 rounded-xl glass-pill text-xs font-semibold text-charcoal flex items-center justify-center gap-2 transition-all hover:bg-white"
            >
              <span>Manage Comment Threads</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Automation Activity */}
      <motion.div
        variants={itemVariants}
        className="p-7 rounded-3xl glass-panel"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#242730] to-[#14161A] text-white flex items-center justify-center shadow-sm border border-white/20">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-charcoal">
                Active Automation Flow Performance
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Rules triggered automatically by incoming webhooks
              </p>
            </div>
          </div>
          <Link
            href="/automations"
            className="text-xs font-medium text-body hover:text-charcoal flex items-center gap-1 transition-colors"
          >
            <span>Manage All Rules</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-white/60">
          {data.recentTriggers.map((trigger) => (
            <div
              key={trigger.id}
              className="py-3.5 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-charcoal shadow-sm" />
                <div>
                  <span className="font-semibold text-charcoal block">
                    {trigger.ruleName}
                  </span>
                  <span className="text-muted text-[11px]">
                    Trigger: {trigger.triggerType}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="font-mono font-semibold text-charcoal">
                    {trigger.triggerCount} executions
                  </span>
                  <span className="text-[11px] text-muted block">
                    Auto-replied & tagged
                  </span>
                </div>
                <Link
                  href="/inbox"
                  className="px-3 py-1.5 rounded-xl glass-pill text-[11px] font-medium text-charcoal transition-all hover:bg-white"
                >
                  View Threads
                </Link>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
