"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Repeat,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Zap,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-surface border border-borderline animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-surface border border-borderline animate-pulse" />
          <div className="h-80 rounded-2xl bg-surface border border-borderline animate-pulse" />
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
      {/* 4 Animated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Conversations */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-surface border border-borderline shadow-subtle hover:shadow-ambient transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Conversations
            </span>
            <div className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center text-charcoal">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-charcoal">
              {data.kpis.totalConversations}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal bg-subtle px-2 py-0.5 rounded-full border border-borderline">
              +14.2%
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-muted text-xs">
            <span>DMs & Post Comments across 30 days</span>
          </div>
        </motion.div>

        {/* KPI 2: Comment-to-DM Conversions */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-surface border border-borderline shadow-subtle hover:shadow-ambient transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">
              Comment-to-DM Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center text-charcoal">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-charcoal">
              {data.kpis.conversionRate}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal bg-subtle px-2 py-0.5 rounded-full border border-borderline">
              +6.8%
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-muted text-xs">
            <span>Public comments converted to private DMs</span>
          </div>
        </motion.div>

        {/* KPI 3: Avg Response Time */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-surface border border-borderline shadow-subtle hover:shadow-ambient transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">
              First Response Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center text-charcoal">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-charcoal">
              {data.kpis.avgResponseTime}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal bg-subtle px-2 py-0.5 rounded-full border border-borderline">
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
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-surface border border-borderline shadow-subtle hover:shadow-ambient transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">
              Auto-Reply Resolution
            </span>
            <div className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center text-charcoal">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-charcoal">
              {data.kpis.autoReplyResolutionRate}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal bg-subtle px-2 py-0.5 rounded-full border border-borderline">
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
          className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-borderline shadow-subtle flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-charcoal">
                Interaction Volume Breakdown
              </h2>
              <p className="text-xs text-muted">
                Direct messages vs. post comments activity
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-subtle rounded-xl border border-borderline text-xs font-medium">
              <button
                onClick={() => setTimeRange("7D")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeRange === "7D"
                    ? "bg-surface text-charcoal shadow-subtle font-semibold"
                    : "text-body hover:text-charcoal"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange("30D")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeRange === "30D"
                    ? "bg-surface text-charcoal shadow-subtle font-semibold"
                    : "text-body hover:text-charcoal"
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          {/* Monochromatic Bar / Height Visualization */}
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
                      className="w-full max-w-[14px] rounded-t-md bg-charcoal transition-all group-hover:opacity-90 relative"
                      title={`${item.comments} Post Comments`}
                    />
                    {/* Direct Messages Bar */}
                    <div
                      style={{ height: `${dmHeight}%` }}
                      className="w-full max-w-[14px] rounded-t-md bg-borderline transition-all group-hover:bg-muted relative"
                      title={`${item.dms} Direct Messages`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted group-hover:text-charcoal">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-borderline flex items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-charcoal inline-block" />
                <span className="text-body font-medium">Post Comments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-borderline inline-block" />
                <span className="text-body font-medium">Direct Messages</span>
              </div>
            </div>
            <span>Updated in real-time</span>
          </div>
        </motion.div>

        {/* Top Performing Posts Card */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl bg-surface border border-borderline shadow-subtle flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
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
            <p className="text-xs text-muted mb-4">
              Posts generating the highest comment-to-DM conversions
            </p>

            <div className="space-y-4">
              {data.topPosts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted border border-borderline rounded-xl bg-canvas/30">
                  No post comment activity recorded yet.
                </div>
              ) : (
                data.topPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-xl border border-borderline hover:border-charcoal hover:bg-subtle/40 transition-all space-y-2 group"
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

          <div className="mt-4 pt-4 border-t border-borderline">
            <Link
              href="/inbox"
              className="w-full py-2 px-3 rounded-xl bg-subtle hover:bg-borderline text-xs font-semibold text-charcoal flex items-center justify-center gap-2 transition-colors"
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
        className="p-6 rounded-2xl bg-surface border border-borderline shadow-subtle"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-charcoal text-white flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 fill-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-charcoal">
                Active Automation Flow Performance
              </h2>
              <p className="text-xs text-muted">
                Rules triggered automatically by incoming webhooks
              </p>
            </div>
          </div>
          <Link
            href="/automations"
            className="text-xs font-medium text-body hover:text-charcoal flex items-center gap-1"
          >
            <span>Manage All Rules</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-borderline">
          {data.recentTriggers.map((trigger) => (
            <div
              key={trigger.id}
              className="py-3.5 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-charcoal" />
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
                  className="px-2.5 py-1 rounded-lg border border-borderline hover:border-charcoal hover:bg-subtle text-[11px] font-medium text-charcoal transition-all"
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
