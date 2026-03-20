"use client";

import Card from "@/components/ui/Card";
import ClientOnly from "@/components/ui/ClientOnly";
import DifficultyBadge from "@/components/ui/DifficultyBadge";
import { accentColors, difficultyMap, modules } from "@/data/modules";
import { useProgressStore } from "@/stores/progress-store";
import {
    FREE_MODULES,
    useSubscriptionStore,
} from "@/stores/subscription-store";
import { CheckCircle, Crown, Lock, Play } from "lucide-react";
import Link from "next/link";

export default function ModulesPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          📚 Modules
        </h1>
        <p className="text-text-secondary text-sm">
          Pick a module and start learning!
        </p>
      </div>

      <ClientOnly
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {modules.map((mod) => (
              <div
                key={mod.slug}
                className="h-56 rounded-xl bg-surface animate-pulse"
              />
            ))}
          </div>
        }
      >
        <ModulesGrid />
      </ClientOnly>
    </div>
  );
}

function ModulesGrid() {
  const moduleProgress = useProgressStore((s) => s.moduleProgress);
  const canAccessModule = useSubscriptionStore((s) => s.canAccessModule);
  const isPro = useSubscriptionStore((s) => s.isPro());

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {modules.map((mod, idx) => {
        const progress = moduleProgress[mod.slug];
        const completedCount = progress?.completedLessons?.length ?? 0;
        const isComplete = completedCount >= mod.lessons;
        const isStarted = completedCount > 0;
        const pct = Math.round((completedCount / mod.lessons) * 100);
        const isFree = FREE_MODULES.includes(
          mod.slug as (typeof FREE_MODULES)[number],
        );
        const locked = !canAccessModule(mod.slug);

        return (
          <div key={mod.slug}>
            {locked ? (
              <Link href="/pricing">
                <Card
                  className="h-full group relative overflow-hidden opacity-80 hover:opacity-100 transition-opacity"
                  padding="md"
                >
                  {/* Lock overlay */}
                  <div className="absolute inset-0 bg-surface/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-purple/10 flex items-center justify-center mb-2">
                      <Lock size={20} className="text-purple" />
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      Pro Module
                    </p>
                    <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                      <Crown size={12} className="text-purple" /> Unlock with
                      Pro
                    </p>
                  </div>
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentColors[mod.accent]} flex items-center justify-center`}
                      >
                        <mod.icon size={24} className="text-white" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-1">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-accent font-medium mb-2">
                      {mod.tagline}
                    </p>
                    <p className="text-sm text-text-secondary mb-4 flex-1">
                      {mod.description}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>{mod.lessons} lessons</span>
                        <span>~{mod.estimatedHours}h</span>
                      </div>
                      <DifficultyBadge
                        difficulty={difficultyMap[mod.difficulty]}
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            ) : (
              <Link href={`/modules/${mod.slug}`}>
                <Card
                  className={`h-full group ${isComplete ? "ring-2 ring-green/40" : ""}`}
                  padding="md"
                >
                  <div className="flex flex-col h-full">
                    {/* Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentColors[mod.accent]} flex items-center justify-center`}
                      >
                        <mod.icon size={24} className="text-white" />
                      </div>
                      {isComplete ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green/10 border border-green/20">
                          <CheckCircle size={14} className="text-green" />
                          <span className="text-[10px] font-bold text-green">
                            Done
                          </span>
                        </div>
                      ) : isFree && !isPro ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green/10 text-green font-medium border border-green/20">
                          FREE
                        </span>
                      ) : null}
                    </div>

                    {/* Content */}
                    <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-accent font-medium mb-2">
                      {mod.tagline}
                    </p>
                    <p className="text-sm text-text-secondary mb-4 flex-1">
                      {mod.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>
                          {completedCount}/{mod.lessons} lessons
                        </span>
                        <span>~{mod.estimatedHours}h</span>
                      </div>
                      <DifficultyBadge
                        difficulty={difficultyMap[mod.difficulty]}
                      />
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-green" : "bg-accent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* CTA hint */}
                    {!isComplete && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={12} />
                        {isStarted ? "Continue" : "Start Module"}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
