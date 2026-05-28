"use client";

import dynamic from "next/dynamic";

const OnboardingPrompt = dynamic(
  () => import("@/components/OnboardingPrompt").then((m) => m.OnboardingPrompt),
  { ssr: false },
);

export function HomeOnboardingSlot() {
  return <OnboardingPrompt />;
}
