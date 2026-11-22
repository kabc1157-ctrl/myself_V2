"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PersonalityAssessmentForm } from "@/app/onboarding/personality-assessment-form";

export function MyPagePersonalityAssessment({ initialAnswers }: {
  initialAnswers: Record<string, string>;
}) {
  const [answers, setAnswers] = useState(initialAnswers);
  const router = useRouter();
  return <PersonalityAssessmentForm
    answers={answers}
    setAnswers={setAnswers}
    pending={false}
    onComplete={() => { router.replace("/mypage/personality/report"); router.refresh(); }}
  />;
}
