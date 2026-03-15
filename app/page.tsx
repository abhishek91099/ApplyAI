import Link from "next/link";
import { Logo, LogoIcon } from "@/components/Logo";

const FEATURES = [
  {
    title: "Resume Tailoring",
    description:
      "AI rewrites your resume to match any job description — right keywords, right tone, right format.",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  },
  {
    title: "ATS Scoring",
    description:
      "See exactly how your resume scores against the job. Get a breakdown of what's working and what's missing.",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  },
  {
    title: "Cover Letters",
    description:
      "Professional cover letters that actually sound like you wrote them. Tailored to each role.",
    icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  },
  {
    title: "Follow-up Emails",
    description:
      "Ready-to-send follow-ups for every stage — post-apply, post-interview, and check-ins.",
    icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
  },
  {
    title: "Interview Prep",
    description:
      "Deep preparation with likely questions, company insights, and study resources — all AI-generated.",
    icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
  },
  {
    title: "Application Tracker",
    description:
      "One dashboard for every application — status, scores, materials, all in one place.",
    icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-base">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-base/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
          <Logo size="default" />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white transition-all"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute top-10 left-[15%] w-[500px] h-[500px] bg-indigo-600/[0.07] rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute top-40 right-[10%] w-[400px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[100px] animate-pulse-glow delay-500" />

        <div className="relative flex flex-col items-center justify-center px-4 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="max-w-3xl text-center space-y-8">
            {/* Heading */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl animate-fade-up">
              <span className="text-white">Stop applying.</span>
              <br />
              <span className="text-gradient">Start landing.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base leading-7 text-zinc-400 max-w-xl mx-auto sm:text-lg sm:leading-8 animate-fade-up delay-200">
              Upload your resume and a job description. AI handles the rest
              — tailored resume, ATS score, cover letter, follow-ups, and
              interview prep.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2 animate-fade-up delay-300">
              <Link
                href="/signup"
                className="group relative rounded-xl bg-gradient-accent px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all"
              >
                Get Started — It&apos;s Free
              </Link>
              <Link
                href="#features"
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-8 py-4 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all"
              >
                See How It Works
              </Link>
            </div>
          </div>

          {/* Floating UI mockup hint */}
          <div className="relative mt-12 w-full max-w-3xl animate-fade-up delay-500 sm:mt-20">
            <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-xl border border-white/[0.06] bg-surface p-1 shadow-2xl shadow-black/40 sm:rounded-2xl">
              <div className="rounded-lg bg-elevated p-4 sm:rounded-xl sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  <div className="ml-4 h-5 flex-1 rounded bg-white/[0.04]" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-3 sm:col-span-2">
                    <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
                    <div className="h-3 w-full rounded bg-white/[0.04]" />
                    <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
                    <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
                    <div className="mt-4 h-3 w-1/2 rounded bg-indigo-500/20" />
                    <div className="h-3 w-full rounded bg-white/[0.04]" />
                    <div className="h-3 w-4/5 rounded bg-white/[0.04]" />
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-400">87</div>
                      <div className="text-xs text-emerald-500/60 mt-1">ATS Score</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2.5 w-full rounded-full bg-white/[0.04]">
                        <div className="h-2.5 w-4/5 rounded-full bg-indigo-500/40" />
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-white/[0.04]">
                        <div className="h-2.5 w-3/5 rounded-full bg-violet-500/40" />
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-white/[0.04]">
                        <div className="h-2.5 w-[90%] rounded-full bg-emerald-500/40" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-400">React</span>
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-400">TypeScript</span>
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-400">Node.js</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative border-t border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              One tool for your entire
              <span className="text-gradient"> application workflow</span>
            </h2>
            <p className="mt-4 text-zinc-500">
              No more juggling tabs, templates, and tools. Everything you need
              to apply smarter, in one place.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/[0.06] bg-surface p-6 hover:border-indigo-500/20 hover:bg-elevated transition-all duration-300"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/15 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5 text-indigo-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={f.icon}
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Three steps. That&apos;s it.
            </h2>
          </div>
          <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
            {[
              {
                step: "01",
                title: "Upload & Paste",
                desc: "Drop your resume (PDF or text) and paste the job description or URL.",
              },
              {
                step: "02",
                title: "AI Does the Work",
                desc: "Your resume is tailored, scored, and paired with a cover letter and follow-up emails.",
              },
              {
                step: "03",
                title: "Apply & Track",
                desc: "Download everything and track all your applications from one dashboard.",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center group">
                {i < 2 && (
                  <div className="hidden sm:block absolute top-7 left-[60%] w-[80%] h-px bg-gradient-to-r from-white/[0.08] to-transparent" />
                )}
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-surface text-indigo-400 font-mono text-lg font-bold group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-all">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        <div className="relative mx-auto max-w-2xl text-center px-4 py-16 sm:py-24">
          <LogoIcon className="h-12 w-12 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Your next job is one
            <br />
            <span className="text-gradient">application away</span>
          </h2>
          <p className="mt-4 text-zinc-500">
            Stop sending the same resume everywhere. Start sending the right one.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-gradient-accent px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
          >
            Get Started — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 sm:py-10">
        <div className="mx-auto max-w-6xl min-w-0 px-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo size="small" />
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} ApplyAI
          </p>
        </div>
      </footer>
    </main>
  );
}
