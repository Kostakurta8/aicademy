"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ClientOnly from "@/components/ui/ClientOnly";
import { learningPath, quickActions, TOTAL_LESSONS } from "@/data/modules";
import {
    requestNotificationPermission,
    scheduleStreakReminder
} from "@/lib/notifications";
import { hapticTap } from "@/lib/sounds";
import {
    useAchievementStore,
    type AchievementStats,
} from "@/stores/achievement-store";
import { useLeaderboardStore } from "@/stores/leaderboard-store";
import { useProgressStore } from "@/stores/progress-store";
import { useUserStore } from "@/stores/user-store";
import {
    DAILY_REWARDS,
    DAILY_XP_GOAL,
    useXPStore,
    XP_PER_LEVEL,
} from "@/stores/xp-store";
import {
    ArrowRight,
    Bell,
    BellOff,
    ChevronRight,
    Flame,
    Gamepad2,
    Gift,
    Medal,
    PartyPopper,
    Play,
    Rocket,
    Sparkles,
    Star,
    Trophy,
    Wand2,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Row 1: Greeting + Daily Goal Ring side by side */}
      <ClientOnly fallback={<div className="h-24" />}>
        <HeroRow />
      </ClientOnly>

      {/* Comeback Bonus — shown when user returns after 3+ days */}
      <ClientOnly fallback={null}>
        <ComebackBonus />
      </ClientOnly>

      {/* Row 2: HERO Continue Card — THE primary action, big and unmissable */}
      <ClientOnly fallback={<div className="h-32" />}>
        <HeroContinueCard />
      </ClientOnly>

      {/* Row 3: Daily Reward + Stats — compact row */}
      <ClientOnly fallback={<div className="h-16" />}>
        <DailyRewardCard />
      </ClientOnly>

      {/* Row 3.5: Streak Calendar + Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ClientOnly fallback={<div className="h-28" />}>
          <StreakCalendar />
        </ClientOnly>
        <ClientOnly fallback={<div className="h-28" />}>
          <AchievementShowcase />
        </ClientOnly>
      </div>

      {/* Row 3.6: XP Boost + Leaderboard Mini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ClientOnly fallback={<div className="h-28" />}>
          <XPBoostCard />
        </ClientOnly>
        <ClientOnly fallback={<div className="h-28" />}>
          <LeaderboardMini />
        </ClientOnly>
      </div>

      {/* Notification Permission Prompt */}
      <ClientOnly fallback={null}>
        <NotificationPrompt />
      </ClientOnly>

      {/* Row 4: Quick Actions — 4 big tap targets */}
      <div className="grid grid-cols-4 gap-2 md:gap-3 animate-fade-in">
        {quickActions.map(({ label, href, gradient, emoji }) => (
          <Link key={label} href={href}>
            <div className="flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-2xl bg-surface-raised/50 border border-border-subtle hover:border-accent/30 transition-all tap-bounce cursor-pointer group">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <span className="text-lg md:text-xl">{emoji}</span>
              </div>
              <span className="text-[11px] md:text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                {label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Row 5: Learning Journey — visual linear map */}
      <ClientOnly fallback={<div className="h-40" />}>
        <LearningJourney />
      </ClientOnly>

      {/* Row 6: Daily Tip — subtle, at the bottom */}
      <ClientOnly fallback={<div className="h-12" />}>
        <DailyTip />
      </ClientOnly>

      {/* Achievement checker — runs on mount */}
      <ClientOnly fallback={null}>
        <AchievementChecker />
      </ClientOnly>
    </div>
  );
}

/* ═══════════════════════════════════════
   HeroRow — Greeting + Daily Goal Ring
   ═══════════════════════════════════════ */
function HeroRow() {
  const name = useUserStore((s) => s.name);
  const streak = useXPStore((s) => s.currentStreak);
  const totalXP = useXPStore((s) => s.totalXP);
  const level = useXPStore((s) => s.level);
  const dailyXPEarned = useXPStore((s) => s.dailyXPEarned);
  const dailyXPDate = useXPStore((s) => s.dailyXPDate);
  const today = new Date().toISOString().slice(0, 10);
  const earned = dailyXPDate === today ? dailyXPEarned : 0;
  const goal = DAILY_XP_GOAL;
  const percent = Math.min((earned / goal) * 100, 100);
  const greeting = getGreeting();

  const currentLevelXP = XP_PER_LEVEL[level - 1] ?? 0;
  const nextLevelXP = XP_PER_LEVEL[level] ?? currentLevelXP + 500;
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const levelPercent = Math.min((xpInLevel / xpNeeded) * 100, 100);

  // SVG ring math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const goalComplete = percent >= 100;

  return (
    <div className="flex items-center gap-4 animate-fade-in">
      {/* Left: Greeting + Level bar + Streak */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-text-primary truncate">
          {greeting}, {name || "Explorer"} 👋
        </h1>

        {/* Level bar */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple to-blue flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-black">{level}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="w-full h-2.5 rounded-full bg-border-subtle overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple via-accent to-blue relative animate-progress-fill"
                style={{ width: `${levelPercent}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/30 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-text-muted shrink-0">
            {xpInLevel}/{xpNeeded}
          </span>
        </div>

        {/* Streak + XP badges */}
        <div className="flex items-center gap-2 mt-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange/10 border border-orange/20 animate-streak">
              <Flame size={14} className="text-orange" />
              <span className="text-xs font-black text-orange">{streak}</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20">
            <Star size={12} className="text-gold" />
            <span className="text-[10px] font-bold text-gold">
              {totalXP.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      {/* Right: Daily Goal Ring — circular progress */}
      <div className="relative w-[90px] h-[90px] md:w-[100px] md:h-[100px] shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
          {/* Background ring */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            fill="none"
            stroke={goalComplete ? "var(--green)" : "var(--accent)"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            style={{
              filter: goalComplete
                ? "drop-shadow(0 0 6px var(--green))"
                : undefined,
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {goalComplete ? (
            <>
              <span className="text-lg animate-celebrate-pop">🎯</span>
              <span className="text-[9px] font-bold text-green">Done!</span>
            </>
          ) : (
            <>
              <Zap size={16} className="text-accent animate-glow-pulse" />
              <span className="text-xs font-black text-text-primary">
                {earned}/{goal}
              </span>
              <span className="text-[8px] text-text-muted uppercase tracking-wider">
                Today
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HeroContinueCard — THE primary action
   Big, bold, unmissable "Continue Learning"
   ═══════════════════════════════════════ */
function HeroContinueCard() {
  const moduleProgress = useProgressStore((s) => s.moduleProgress);

  const totalCompleted = Object.values(moduleProgress).reduce(
    (sum, mod) => sum + (mod.completedLessons?.length || 0),
    0,
  );
  const overallPercent = Math.round((totalCompleted / TOTAL_LESSONS) * 100);

  // Find the first incomplete module in the linear path
  const nextModule = learningPath.find((m) => {
    const done = moduleProgress[m.slug]?.completedLessons?.length || 0;
    return done < m.totalLessons;
  });

  if (!nextModule) {
    return (
      <div className="animate-slide-up">
        <Card
          padding="lg"
          glow
          className="relative overflow-hidden border-2 border-gold/30"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-green/5 to-gold/5 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-green flex items-center justify-center shrink-0 animate-celebrate-pop">
              <Trophy size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black text-text-primary">
                All Complete! 🎉🏆
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                You&apos;re an AI master!
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Link href="/games">
                  <Button size="sm" icon={<Gamepad2 size={16} />}>
                    Play Games
                  </Button>
                </Link>
                <Link href="/prompting">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Wand2 size={16} />}
                  >
                    Practice
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const done = moduleProgress[nextModule.slug]?.completedLessons?.length || 0;
  const progress = Math.round((done / nextModule.totalLessons) * 100);
  const moduleIndex = learningPath.findIndex((m) => m.slug === nextModule.slug);

  return (
    <div className="animate-slide-up">
      <Link href={`/modules/${nextModule.slug}`}>
        <Card
          padding="lg"
          glow
          className="relative overflow-hidden border-2 border-accent/20 hover:border-accent/40 transition-all cursor-pointer group animate-rainbow-border"
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 animate-shimmer opacity-20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-accent/3 via-transparent to-accent/3 pointer-events-none" />

          <div className="relative z-10">
            {/* Module badge + arrow */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1">
                  <Play size={10} className="fill-current" /> Continue Learning
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
                  Module {moduleIndex + 1}/8
                </span>
              </div>
              <ArrowRight
                size={18}
                className="text-accent group-hover:translate-x-2 transition-transform"
              />
            </div>

            {/* Big module card */}
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${nextModule.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
              >
                <span className="text-2xl md:text-3xl">{nextModule.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-black text-text-primary truncate">
                  {nextModule.title}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-2.5 rounded-full bg-border-subtle overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-blue animate-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-text-muted">
                    {done}/{nextModule.totalLessons}
                  </span>
                </div>
              </div>
            </div>

            {/* Overall journey progress at bottom */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
              <span className="text-[10px] text-text-muted">
                Overall Journey
              </span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green transition-all"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-green">
                  {overallPercent}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}

function DailyRewardCard() {
  const canClaim = useXPStore((s) => s.canClaimDailyReward());
  const rewardAmount = useXPStore((s) => s.getDailyRewardAmount());
  const rewardStreak = useXPStore((s) => s.dailyRewardStreak);
  const claimDailyReward = useXPStore((s) => s.claimDailyReward);

  if (!canClaim) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green/5 border border-green/10">
          <div className="w-9 h-9 rounded-lg bg-green/10 flex items-center justify-center shrink-0">
            <span className="text-lg">✅</span>
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-green">
              Reward Claimed!
            </span>
            <p className="text-[11px] text-text-muted">
              Come back tomorrow for day {(rewardStreak % 7) + 2} reward
            </p>
          </div>
          {/* 7-day dots */}
          <div className="flex gap-1">
            {DAILY_REWARDS.map((xp, i) => (
              <div
                key={xp + "-" + i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i <= rewardStreak % 7 ? "bg-green" : "bg-border-subtle"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Card
        padding="md"
        className="relative overflow-hidden border-l-4 border-l-gold"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold to-orange flex items-center justify-center shrink-0 animate-wiggle">
            <Gift size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">
                Daily Reward
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/10 text-gold font-bold">
                Day {(rewardStreak % 7) + 1}
              </span>
            </div>
            {/* 7-day progress dots */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {DAILY_REWARDS.map((xp, i) => {
                const isCurrent = i === rewardStreak % 7;
                const isPast = i < rewardStreak % 7;
                let dotStyle = "bg-border-subtle text-text-muted";
                if (isPast) dotStyle = "bg-green text-white";
                else if (isCurrent)
                  dotStyle = "bg-gold text-white animate-pulse-glow";
                return (
                  <div
                    key={xp + "-" + i}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold transition-all ${dotStyle}`}
                    >
                      {isPast ? "✓" : xp}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => {
              hapticTap();
              claimDailyReward();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold to-orange text-white text-sm font-bold tap-bounce hover:brightness-110 transition-all animate-pulse-glow"
          >
            +{rewardAmount} XP
          </button>
        </div>
      </Card>
    </div>
  );
}

function DailyTip() {
  const dayIndex = new Date().getDate() % tips.length;
  const tip = tips[dayIndex];

  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/10">
        <Sparkles size={16} className="text-accent mt-0.5 shrink-0" />
        <div>
          <span className="text-xs font-bold text-accent">Daily Tip</span>
          <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">
            {tip}
          </p>
        </div>
      </div>
    </div>
  );
}

function LearningJourney() {
  const moduleProgress = useProgressStore((s) => s.moduleProgress);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          🗺️ Your Journey
        </h2>
        <Link
          href="/learning-path"
          className="text-xs text-accent hover:underline flex items-center gap-1 tap-bounce"
        >
          Full Map <ChevronRight size={12} />
        </Link>
      </div>

      {/* Horizontal scrollable journey on mobile, grid on desktop */}
      <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {learningPath.map((mod, idx) => {
          const done = moduleProgress[mod.slug]?.completedLessons?.length || 0;
          const percent = Math.round((done / mod.totalLessons) * 100);
          const isComplete = done >= mod.totalLessons;
          const isLocked =
            idx > 0 &&
            (() => {
              const prev = learningPath[idx - 1];
              const prevDone =
                moduleProgress[prev.slug]?.completedLessons?.length || 0;
              return prevDone === 0;
            })();
          const isActive = !isComplete && !isLocked;

          return (
            <Link
              key={mod.slug}
              href={isLocked ? "#" : `/modules/${mod.slug}`}
              className={isLocked ? "pointer-events-none" : ""}
            >
              <div
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border min-w-[80px] transition-all tap-bounce ${
                  isComplete
                    ? "bg-green/5 border-green/20"
                    : isActive
                      ? "bg-surface-raised/50 border-accent/20 hover:border-accent/40"
                      : "bg-surface/30 border-border-subtle opacity-40"
                }`}
              >
                {/* Emoji icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isComplete
                      ? "bg-green/10"
                      : isActive
                        ? `bg-gradient-to-br ${mod.color}`
                        : "bg-surface-raised"
                  }`}
                >
                  {isComplete ? (
                    <span className="text-lg">✅</span>
                  ) : isLocked ? (
                    <span className="text-sm">🔒</span>
                  ) : (
                    <span className="text-lg">{mod.emoji}</span>
                  )}
                </div>
                {/* Title */}
                <span
                  className={`text-[10px] font-semibold text-center leading-tight ${
                    isComplete
                      ? "text-green"
                      : isActive
                        ? "text-text-primary"
                        : "text-text-muted"
                  }`}
                >
                  {mod.title}
                </span>
                {/* Progress bar for active */}
                {isActive && (
                  <div className="w-full h-1 rounded-full bg-border-subtle overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   XPBoostCard — activate 2x XP for 1 hour
   Available when daily goal is completed
   ═══════════════════════════════════════ */
function XPBoostCard() {
  const boostActive = useXPStore((s) => s.isBoostActive());
  const remaining = useXPStore((s) => s.getBoostTimeRemaining());
  const dailyGoalCompleted = useXPStore((s) => s.dailyGoalCompleted);
  const activateBoost = useXPStore((s) => s.activateXPBoost);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!boostActive) return;
    const interval = setInterval(() => {
      const ms = useXPStore.getState().getBoostTimeRemaining();
      if (ms <= 0) {
        setTimeLeft("");
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [boostActive]);

  if (boostActive) {
    return (
      <div className="animate-fade-in">
        <Card
          padding="md"
          className="border-l-4 border-l-purple relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple/5 to-blue/5 pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple to-blue flex items-center justify-center animate-pulse-glow">
              <Rocket size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-purple">
                2x XP Active!
              </span>
              <p className="text-[11px] text-text-muted">
                {timeLeft} remaining
              </p>
            </div>
            <span className="text-2xl animate-wiggle">⚡</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Card padding="md">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              dailyGoalCompleted
                ? "bg-gradient-to-br from-purple to-blue"
                : "bg-surface-raised"
            }`}
          >
            <Rocket
              size={20}
              className={dailyGoalCompleted ? "text-white" : "text-text-muted"}
            />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-text-primary">
              XP Boost
            </span>
            <p className="text-[10px] text-text-muted">
              {dailyGoalCompleted
                ? "Daily goal done! Activate 2x XP"
                : "Complete daily goal to unlock"}
            </p>
          </div>
          <button
            onClick={() => {
              hapticTap();
              activateBoost(2, 60 * 60 * 1000);
            }}
            disabled={!dailyGoalCompleted}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all tap-bounce ${
              dailyGoalCompleted
                ? "bg-gradient-to-r from-purple to-blue text-white hover:brightness-110"
                : "bg-surface-raised text-text-muted cursor-not-allowed"
            }`}
          >
            2x for 1hr
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════
   LeaderboardMini — top 5 + user rank
   ═══════════════════════════════════════ */
function LeaderboardMini() {
  const totalXP = useXPStore((s) => s.totalXP);
  const name = useUserStore((s) => s.name);
  const level = useXPStore((s) => s.level);
  const streak = useXPStore((s) => s.currentStreak);
  const getWeekly = useLeaderboardStore((s) => s.getWeeklyLeaderboard);

  const board = getWeekly(totalXP, name || "You", level, streak);
  const userRank = board.findIndex((e) => e.isCurrentUser) + 1;
  const top5 = board.slice(0, 5);

  return (
    <div className="animate-fade-in">
      <Card padding="md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Trophy size={14} className="text-gold" /> Weekly Leaderboard
          </h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
            #{userRank}
          </span>
        </div>
        <div className="space-y-1.5">
          {top5.map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-all ${
                entry.isCurrentUser
                  ? "bg-accent/10 border border-accent/20"
                  : ""
              }`}
            >
              <span
                className={`w-4 text-center font-black ${
                  i === 0
                    ? "text-gold"
                    : i === 1
                      ? "text-text-muted"
                      : i === 2
                        ? "text-orange"
                        : "text-text-muted"
                }`}
              >
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
              </span>
              <span className="text-sm">{entry.avatar}</span>
              <span
                className={`flex-1 truncate font-medium ${entry.isCurrentUser ? "text-accent" : "text-text-secondary"}`}
              >
                {entry.isCurrentUser ? "You" : entry.name}
              </span>
              <span className="font-bold text-text-muted">
                {entry.xp.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        {userRank > 5 && (
          <div className="mt-1.5 pt-1.5 border-t border-border-subtle flex items-center gap-2 px-2 text-xs">
            <span className="w-4 text-center font-black text-accent">
              #{userRank}
            </span>
            <span className="text-sm">🧑‍💻</span>
            <span className="flex-1 truncate font-medium text-accent">You</span>
            <span className="font-bold text-accent">
              {totalXP.toLocaleString()}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════
   NotificationPrompt — ask for notification
   permission (shows once, dismissible)
   ═══════════════════════════════════════ */
function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const streak = useXPStore((s) => s.currentStreak);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    // Show prompt after user has a streak going (more invested)
    if (streak >= 2) setVisible(true);
  }, [streak]);

  // Schedule streak reminder whenever dashboard loads
  useEffect(() => {
    if (streak > 0) scheduleStreakReminder(streak);
  }, [streak]);

  const handleEnable = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if (granted) scheduleStreakReminder(streak);
    setVisible(false);
  }, [streak]);

  if (!visible) return null;

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/10">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-accent" />
        </div>
        <div className="flex-1">
          <span className="text-xs font-bold text-text-primary">
            Never lose your streak!
          </span>
          <p className="text-[10px] text-text-muted">
            Get a reminder if you&apos;re about to lose your {streak}-day streak
          </p>
        </div>
        <button
          onClick={handleEnable}
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold tap-bounce hover:brightness-110 transition-all"
        >
          Enable
        </button>
        <button
          onClick={() => setVisible(false)}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <BellOff size={14} />
        </button>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ═══════════════════════════════════════
   ComebackBonus — shown when user returns after 3+ days
   ═══════════════════════════════════════ */
function ComebackBonus() {
  const comebackAvailable = useXPStore((s) => s.comebackBonusAvailable);
  const addXP = useXPStore((s) => s.addXP);
  const streak = useXPStore((s) => s.currentStreak);

  if (!comebackAvailable) return null;

  const bonusXP = 75;

  return (
    <div className="animate-slide-up">
      <Card
        padding="md"
        glow
        className="relative overflow-hidden border-2 border-green/30"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green/5 via-blue/5 to-green/5 pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green to-blue flex items-center justify-center shrink-0 animate-wiggle">
            <PartyPopper size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black text-text-primary">
              Welcome Back! 🎉
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Here&apos;s a bonus to get you going!
            </p>
          </div>
          <button
            onClick={() => {
              hapticTap();
              addXP(bonusXP);
              useXPStore.setState({ comebackBonusAvailable: false });
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-green to-blue text-white text-sm font-bold tap-bounce hover:brightness-110 transition-all animate-pulse-glow shrink-0"
          >
            +{bonusXP} XP
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════
   StreakCalendar — visual "don't break the chain"
   Shows last 28 days of activity
   ═══════════════════════════════════════ */
function StreakCalendar() {
  const streakHistory = useXPStore((s) => s.streakHistory);
  const currentStreak = useXPStore((s) => s.currentStreak);
  const longestStreak = useXPStore((s) => s.longestStreak);

  // Generate last 28 days
  const days: { date: string; active: boolean; isToday: boolean }[] = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      active: streakHistory.includes(dateStr),
      isToday: i === 0,
    });
  }

  return (
    <div className="animate-fade-in">
      <Card padding="md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Flame size={14} className="text-orange" /> Activity
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-text-muted">
              Current{" "}
              <span className="font-bold text-orange">{currentStreak}</span>
            </span>
            <span className="text-[10px] text-text-muted">
              Best <span className="font-bold text-gold">{longestStreak}</span>
            </span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <div
              key={day.date}
              className={`aspect-square rounded-sm transition-all ${
                day.active
                  ? "bg-green"
                  : day.isToday
                    ? "bg-accent/20 border border-accent/40"
                    : "bg-border-subtle/30"
              }`}
              title={`${day.date}${day.active ? " — Active" : ""}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] text-text-muted">4 weeks ago</span>
          <span className="text-[9px] text-text-muted">Today</span>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════
   AchievementShowcase — latest badges
   ═══════════════════════════════════════ */
function AchievementShowcase() {
  const getAll = useAchievementStore((s) => s.getAll);
  const getProgress = useAchievementStore((s) => s.getProgress);
  const achievements = getAll();
  const { unlocked, total, percent } = getProgress();

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedPreview = achievements.filter((a) => !a.unlocked).slice(0, 3);

  return (
    <div className="animate-fade-in">
      <Card padding="md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Medal size={14} className="text-gold" /> Achievements
          </h3>
          <span className="text-[10px] font-bold text-accent">
            {unlocked}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-orange transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Badge grid — show up to 8 badges */}
        <div className="flex flex-wrap gap-1.5">
          {unlockedAchievements.slice(-5).map((a) => (
            <div
              key={a.id}
              className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center"
              title={`${a.title}: ${a.description}`}
            >
              <span className="text-sm">{a.emoji}</span>
            </div>
          ))}
          {lockedPreview.map((a) => (
            <div
              key={a.id}
              className="w-8 h-8 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center opacity-30"
              title={`??? — ${a.description}`}
            >
              <span className="text-sm grayscale">🔒</span>
            </div>
          ))}
        </div>

        {unlocked === 0 && (
          <p className="text-[10px] text-text-muted text-center mt-1">
            Complete lessons to unlock badges!
          </p>
        )}
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════
   AchievementChecker — invisible component that
   checks and unlocks achievements on mount
   ═══════════════════════════════════════ */
function AchievementChecker() {
  const totalXP = useXPStore((s) => s.totalXP);
  const currentStreak = useXPStore((s) => s.currentStreak);
  const comebackBonusAvailable = useXPStore((s) => s.comebackBonusAvailable);
  const dailyGoalCompleted = useXPStore((s) => s.dailyGoalCompleted);
  const moduleProgress = useProgressStore((s) => s.moduleProgress);
  const completedChallenges = useProgressStore((s) => s.completedChallenges);
  const checkAchievements = useAchievementStore((s) => s.checkAchievements);
  const incrementDailyGoalCount = useAchievementStore(
    (s) => s.incrementDailyGoalCount,
  );

  // Calculate stats
  const totalLessons = Object.values(moduleProgress).reduce(
    (sum, mod) => sum + (mod.completedLessons?.length || 0),
    0,
  );
  const completedModules = learningPath.filter((m) => {
    const done = moduleProgress[m.slug]?.completedLessons?.length || 0;
    return done >= m.totalLessons;
  }).length;

  useEffect(() => {
    const stats: AchievementStats = {
      totalLessons,
      completedModules,
      currentStreak,
      totalXP,
      completedChallenges: completedChallenges.length,
      comebackBonusAvailable,
    };
    checkAchievements(stats);
  }, [
    totalLessons,
    completedModules,
    currentStreak,
    totalXP,
    completedChallenges,
    comebackBonusAvailable,
    checkAchievements,
  ]);

  // Track daily goal completions for the achievement
  useEffect(() => {
    if (dailyGoalCompleted) {
      incrementDailyGoalCount();
    }
  }, [dailyGoalCompleted, incrementDailyGoalCount]);

  return null;
}

const tips = [
  "Try chain-of-thought prompting! 🧠",
  "Revisit old lessons — it boosts memory! 📈",
  "Same question, different prompts — compare! 🧪",
  "Understanding bias = responsible AI use. ⚖️",
  "Build something fun with AI APIs! 🚀",
  "Try making images, audio & video with AI! 🎨",
  "AI agents can plan and act on their own! 🤖",
  "Add 2-3 examples before your question = better results! ⚡",
];
