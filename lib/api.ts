import { getToken } from "./auth";
import type {
  TailorResult,
  ScoreResult,
  CoverLetterResult,
  FollowUpResult,
  InterviewPrep,
  Application,
  ApplicationSummary,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Request failed");
  }
  return res.json();
}

// ── Auth ────────────────────────────────────────────

export async function signup(email: string, password: string) {
  return request<{ token: string; user: { id: string; email: string; name?: string; avatar_url?: string } }>(
    "/api/auth/signup",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: { id: string; email: string; name?: string; avatar_url?: string } }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export async function googleLogin(credential: string) {
  return request<{ token: string; user: { id: string; email: string; name?: string; avatar_url?: string } }>(
    "/api/auth/google",
    { method: "POST", body: JSON.stringify({ credential }) }
  );
}

// ── AI ──────────────────────────────────────────────

export async function extractCandidateInfo(
  resumeText: string,
): Promise<{ name: string; current_role: string; experience_years: number }> {
  return request("/api/extract-candidate-info", {
    method: "POST",
    body: JSON.stringify({ resume_text: resumeText }),
  });
}

export async function tailorResume(
  resumeText: string,
  jobDescription: string,
  experienceYears: number,
  currentRole: string,
  targetRole: string,
  isCareerChange: boolean,
): Promise<TailorResult> {
  return request("/api/tailor-resume", {
    method: "POST",
    body: JSON.stringify({
      resume_text: resumeText,
      job_description: jobDescription,
      experience_years: experienceYears,
      current_role: currentRole,
      target_role: targetRole,
      is_career_change: isCareerChange,
    }),
  });
}

export async function scoreResume(
  resumeText: string,
  jobDescription: string,
): Promise<ScoreResult> {
  return request("/api/score-resume", {
    method: "POST",
    body: JSON.stringify({
      resume_text: resumeText,
      job_description: jobDescription,
    }),
  });
}

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  companyName: string,
  candidateName: string,
  experienceYears: number,
  currentRole: string,
  targetRole: string,
  isCareerChange: boolean,
): Promise<CoverLetterResult> {
  return request("/api/generate-cover-letter", {
    method: "POST",
    body: JSON.stringify({
      resume_text: resumeText,
      job_description: jobDescription,
      company_name: companyName,
      candidate_name: candidateName,
      experience_years: experienceYears,
      current_role: currentRole,
      target_role: targetRole,
      is_career_change: isCareerChange,
    }),
  });
}

export async function generateFollowUps(
  jobTitle: string,
  company: string,
  candidateName: string,
  interviewerName?: string,
  somethingDiscussed?: string,
  interviewDate?: string,
): Promise<FollowUpResult> {
  return request("/api/generate-followups", {
    method: "POST",
    body: JSON.stringify({
      job_title: jobTitle,
      company,
      candidate_name: candidateName,
      interviewer_name: interviewerName || null,
      something_discussed: somethingDiscussed || null,
      interview_date: interviewDate || null,
    }),
  });
}

export async function getInterviewPrep(
  jobTitle: string,
  company: string,
  jobDescription: string,
  experienceYears: number = 0,
  candidateSkills?: string[],
): Promise<InterviewPrep> {
  return request("/api/interview-prep", {
    method: "POST",
    body: JSON.stringify({
      job_title: jobTitle,
      company,
      job_description: jobDescription,
      experience_years: experienceYears,
      candidate_skills: candidateSkills || null,
    }),
  });
}

// ── Applications ────────────────────────────────────

const APPLICATIONS_CACHE_TTL_MS = 60_000; // 1 minute
let applicationsListCache: { data: ApplicationSummary[]; ts: number } | null = null;

export function invalidateApplicationsCache(): void {
  applicationsListCache = null;
}

export async function getApplications(): Promise<ApplicationSummary[]> {
  const now = Date.now();
  if (applicationsListCache && now - applicationsListCache.ts < APPLICATIONS_CACHE_TTL_MS) {
    return applicationsListCache.data;
  }
  const data = await request<ApplicationSummary[]>("/api/applications");
  applicationsListCache = { data, ts: now };
  return data;
}

export async function saveApplication(
  data: Record<string, unknown>
): Promise<Application> {
  const app = await request<Application>("/api/save-application", {
    method: "POST",
    body: JSON.stringify(data),
  });
  invalidateApplicationsCache();
  return app;
}

export async function getApplication(id: string): Promise<Application> {
  return request(`/api/applications/${id}`);
}

export async function updateApplication(
  id: string,
  data: {
    status?: string;
    tailored_resume?: string;
    cover_letter?: string;
    interview_prep?: InterviewPrep;
    follow_up_emails?: Array<{ type: string; subject: string; body: string; when_to_send?: string }>;
  }
): Promise<Application> {
  const app = await request<Application>(`/api/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  invalidateApplicationsCache();
  return app;
}

export async function deleteApplication(id: string): Promise<void> {
  await request(`/api/applications/${id}`, { method: "DELETE" });
  invalidateApplicationsCache();
}

// ── Extraction ──────────────────────────────────────

export async function extractUrl(url: string): Promise<string> {
  const data = await request<{ text: string }>("/api/extract-url", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  return data.text;
}

// ── PDF ─────────────────────────────────────────────

export async function extractPdf(file: File): Promise<string> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/extract-pdf`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "PDF extraction failed");
  }

  const data = await res.json();
  return data.text;
}
