"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ClientOnly from "@/components/ui/ClientOnly";
import { useSubscriptionStore } from "@/stores/subscription-store";
import {
    ArrowLeft,
    Check,
    Crown,
    Lock,
    Shield,
    Sparkles,
    Star,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try AIcademy for free!",
    features: [
      "3 learning modules",
      "2 games",
      "1 sandbox tool",
      "1 flashcard deck",
      "AI tutor chat",
      "XP & streaks",
    ],
    limitations: [
      "5 modules locked",
      "11 games locked",
      "7 sandbox tools locked",
    ],
    cta: "Current Plan",
    popular: false,
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: "$4.99",
    period: "/month",
    description: "Unlock everything!",
    features: [
      "All 8 modules",
      "All 13 games",
      "All 8 sandbox tools",
      "Unlimited flashcards",
      "2x XP boosts",
      "Leaderboard ranking",
      "Pro badge",
      "New features first",
    ],
    limitations: [],
    cta: "Upgrade to Pro",
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || "",
  },
  {
    id: "pro_yearly",
    name: "Pro Yearly",
    price: "$29.99",
    period: "/year",
    description: "Save 50%!",
    features: ["Everything in Pro", "2 months free", "Annual badge"],
    limitations: [],
    cta: "Upgrade to Pro",
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || "",
  },
];

export default function PricingPage() {
  return (
    <ClientOnly>
      <PricingContent />
    </ClientOnly>
  );
}

function PricingContent() {
  const plan = useSubscriptionStore((s) => s.plan);
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string, planId: string) => {
    if (!priceId) {
      alert(
        "Stripe is not configured yet. Set NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID and NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID in your environment.",
      );
      return;
    }

    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch {
      alert("Failed to connect to payment server");
    } finally {
      setLoading(null);
    }
  };

  // Handle success/cancel URL params
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const isSuccess = params?.get("success") === "true";
  const isCanceled = params?.get("canceled") === "true";

  if (isSuccess) {
    // When Stripe redirects back with success, upgrade the local state
    const sub = useSubscriptionStore.getState();
    if (sub.plan !== "pro") {
      sub.setPlan("pro");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {isSuccess && (
        <div className="mb-8 p-4 rounded-2xl bg-green/10 border border-green/20 text-center">
          <Sparkles size={32} className="text-green mx-auto mb-2" />
          <h2 className="text-xl font-bold text-green">Welcome to Pro! 🎉</h2>
          <p className="text-sm text-text-secondary mt-1">
            Everything is unlocked. Have fun!
          </p>
        </div>
      )}

      {isCanceled && (
        <div className="mb-8 p-4 rounded-2xl bg-orange/10 border border-orange/20 text-center">
          <p className="text-sm text-text-secondary">
            Payment was canceled. No charges were made.
          </p>
        </div>
      )}

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
          <Crown size={14} /> Pricing
        </div>
        <h1 className="text-4xl font-bold text-text-primary mb-3">
          Go Pro 🚀
        </h1>
        <p className="text-sm text-text-secondary">
          Unlock all modules, games & tools!
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {PLANS.map((p) => (
          <Card
            key={p.id}
            padding="lg"
            hover={false}
            className={`relative ${p.popular ? "ring-2 ring-accent shadow-lg shadow-accent/10" : ""}`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-xs font-bold">
                ⭐ Most Popular
              </div>
            )}

            <div className="text-center mb-6">
              <div
                className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                  p.id === "free"
                    ? "bg-surface-raised"
                    : "bg-gradient-to-br from-purple to-blue"
                }`}
              >
                {p.id === "free" ? (
                  <Zap size={24} className="text-text-muted" />
                ) : (
                  <Crown size={24} className="text-white" />
                )}
              </div>
              <h3 className="text-xl font-bold text-text-primary">{p.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-text-primary">
                  {p.price}
                </span>
                <span className="text-text-muted text-sm">{p.period}</span>
              </div>
              <p className="text-sm text-text-secondary mt-2">
                {p.description}
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              {p.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="text-green shrink-0 mt-0.5" />
                  <span className="text-text-secondary">{feat}</span>
                </li>
              ))}
              {p.limitations.map((lim) => (
                <li key={lim} className="flex items-start gap-2 text-sm">
                  <Lock
                    size={16}
                    className="text-text-muted/40 shrink-0 mt-0.5"
                  />
                  <span className="text-text-muted">{lim}</span>
                </li>
              ))}
            </ul>

            {p.id === "free" ? (
              <Button
                variant="secondary"
                className="w-full"
                disabled={plan === "free"}
              >
                {plan === "free" ? "Current Plan" : "Downgrade"}
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() =>
                  handleUpgrade((p as { priceId: string }).priceId, p.id)
                }
                loading={loading === p.id}
                disabled={plan === "pro"}
                icon={
                  plan === "pro" ? <Check size={16} /> : <Crown size={16} />
                }
              >
                {plan === "pro" ? "Active" : p.cta}
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-text-muted">
        <div className="flex items-center gap-2 text-sm">
          <Shield size={16} /> Secure payments via Stripe
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Star size={16} /> Cancel anytime
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Star size={16} /> 30-day money-back guarantee
        </div>
      </div>
    </div>
  );
}
