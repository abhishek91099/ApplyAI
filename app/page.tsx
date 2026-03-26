import Link from "next/link";
import { ApplicantHeroScene } from "@/components/ApplicantHeroScene";
import { Logo } from "@/components/Logo";

const PILLARS = [
  {
    title: "Tailored resume",
    body: "Your experience, rewritten for the exact role — not a synonym swap, a real match to the posting.",
  },
  {
    title: "ATS clarity",
    body: "See how systems read you before a human does. Gaps and wins, spelled out without the jargon.",
  },
  {
    title: "Everything else, included",
    body: "Cover letter, follow-ups, interview prep, and a place to track every application. One workflow.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-[#f5f5f7]">
      {/* Nav — narrow column like apple.com */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[48px] max-w-[1024px] items-center justify-between px-6 md:h-[52px]">
          <Logo size="default" linkTo="/" />
          <div className="flex items-center gap-8 text-[12px] md:text-[14px]">
            <Link href="/login" className="text-[#a1a1a6] hover:text-[#f5f5f7]">
              Sign in
            </Link>
            <Link
              href="/resume"
              className="rounded-full bg-[#2997ff] px-5 py-2 text-white hover:bg-[#147ce5]"
            >
              Try it free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-[1024px] px-6 pb-20 pt-14 md:pb-28 md:pt-20 lg:pt-24">
          <div className="mx-auto max-w-[820px] text-center">
            <h1 className="animate-fade-in text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[56px] lg:text-[64px]">
              Apply with
              <br />
              materials that feel
              <br />
              <span className="text-[#86868b]">meant for this job.</span>
            </h1>
            <p className="animate-fade-in delay-1 mx-auto mt-6 max-w-[540px] text-[19px] leading-[1.4] text-[#a1a1a6] md:text-[21px]">
              Upload your résumé and the role. We help you refine, score, and ship — so you spend
              less time formatting and more time getting to yes.
            </p>
            <div className="animate-fade-in delay-2 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <Link href="/resume" className="btn-primary min-w-[200px] py-3.5">
                Try it free
              </Link>
              <Link
                href="#learn-more"
                className="text-[17px] text-[#2997ff] hover:underline"
              >
                Learn more
              </Link>
            </div>
          </div>

          {/* Product moment — only retained custom animation */}
          <div className="animate-fade-in delay-3 mx-auto mt-16 max-w-[920px] md:mt-20">
            <div className="overflow-hidden rounded-3xl border border-white/[0.1] bg-[#1d1d1f] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)]">
              <div className="border-b border-white/[0.06] px-6 py-4 text-left">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#86868b]">
                  Preview
                </p>
                <p className="mt-1 text-[15px] text-[#f5f5f7]">From desk to hiring inbox.</p>
              </div>
              <div className="px-4 pb-6 pt-2 sm:px-8 sm:pb-10 sm:pt-4">
                <ApplicantHeroScene />
              </div>
            </div>
          </div>
        </section>

        {/* Statement band */}
        <section
          id="learn-more"
          className="border-t border-white/[0.08] bg-[#000000] py-24 md:py-32"
        >
          <div className="mx-auto max-w-[980px] px-6 text-center">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#86868b]">
              Why ApplyAI
            </p>
            <h2 className="mx-auto mt-4 max-w-[720px] text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#f5f5f7] md:text-[44px] lg:text-[48px]">
              One calm place for everything you send after you find a role you want.
            </h2>
          </div>
        </section>

        {/* Feature columns */}
        <section className="border-t border-white/[0.08] py-20 md:py-28">
          <div className="mx-auto grid max-w-[980px] gap-16 px-6 md:grid-cols-3 md:gap-10">
            {PILLARS.map((p, i) => (
              <div
                key={p.title}
                className={`group animate-rise-in text-left transition-transform duration-300 hover:-translate-y-0.5 ${
                  i === 0 ? "" : i === 1 ? "rise-delay-1" : "rise-delay-2"
                }`}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#1d1d1f] text-[#2997ff] transition-colors duration-300 group-hover:border-[#2997ff]/30 group-hover:bg-[#2997ff]/8">
                  <span className="text-[15px] font-semibold tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="text-[21px] font-semibold text-[#f5f5f7]">{p.title}</h3>
                <p className="mt-3 text-[17px] leading-[1.5] text-[#a1a1a6]">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-white/[0.08] py-24 md:py-32">
          <div className="mx-auto max-w-[720px] px-6 text-center">
            <h2 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[40px]">
              Ready when you are.
            </h2>
            <p className="mx-auto mt-4 max-w-[480px] text-[17px] text-[#a1a1a6]">
              No sign-up required. Try the full workflow now — create an account when you want to save.
            </p>
            <Link href="/resume" className="btn-primary mt-10 inline-flex min-w-[220px] py-3.5">
              Start for free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.08] py-10">
        <div className="mx-auto flex max-w-[1024px] flex-col items-center justify-between gap-6 px-6 text-[12px] text-[#6e6e73] sm:flex-row">
          <Logo size="small" linkTo="/" />
          <p>&copy; {new Date().getFullYear()} ApplyAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
