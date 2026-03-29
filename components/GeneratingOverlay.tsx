"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { label: "Analyzing your resume", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
  { label: "Tailoring for the role", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" },
  { label: "Scoring ATS compatibility", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
  { label: "Writing your cover letter", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
  { label: "Composing follow-up emails", icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" },
];

interface Props {
  completedSteps: Set<string>;
  errorSteps: Set<string>;
}

export function GeneratingOverlay({ completedSteps, errorSteps }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const stepKeys = ["resume", "score", "cover", "followup"];

  return (
    <div className="apple-panel overflow-hidden p-6 sm:p-10">
      <div className="flex flex-col items-center gap-8">
        {/* Animated logo */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#2997ff] opacity-60" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-b-[#2997ff]/40 opacity-40" style={{ animationDuration: "3s", animationDirection: "reverse" }} />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-8 w-8 text-[#2997ff] animate-pulse"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#f5f5f7]">Generating your materials</h3>
          <p className="mt-1 text-sm text-[#86868b]">
            Running 4 AI models in parallel &middot; {elapsed}s
          </p>
        </div>

        {/* Step progress */}
        <div className="w-full max-w-md space-y-3">
          {STEPS.map((step, i) => {
            const key = stepKeys[i];
            const done = completedSteps.has(key);
            const failed = errorSteps.has(key);
            const active = !done && !failed;

            return (
              <div
                key={key}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500 ${
                  done
                    ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                    : failed
                      ? "border-red-500/20 bg-red-500/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                {/* Status icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {done ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-400">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  ) : failed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-red-400">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5 text-[#2997ff] animate-pulse"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`flex-1 text-sm font-medium ${
                    done
                      ? "text-emerald-300/90"
                      : failed
                        ? "text-red-300/90"
                        : "text-[#f5f5f7]"
                  }`}
                >
                  {step.label}
                </span>

                {/* Status badge */}
                {active && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#2997ff] animate-pulse" />
                    <span className="text-xs text-[#86868b]">Running</span>
                  </div>
                )}
                {done && (
                  <span className="text-xs font-medium text-emerald-400/80">Done</span>
                )}
                {failed && (
                  <span className="text-xs font-medium text-red-400/80">Failed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
