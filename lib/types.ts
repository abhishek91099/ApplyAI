export interface Application {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  job_description: string;
  candidate_name: string | null;
  experience_years: number | null;
  current_role: string | null;
  is_career_change: boolean;
  original_resume: string | null;
  tailored_resume: string | null;
  resume_meta: ResumeMeta | null;
  ats_score: number | null;
  score_details: ScoreDetails | null;
  keywords: string[];
  missing_keywords: string[];
  cover_letter: string | null;
  cover_letter_meta: CoverLetterMeta | null;
  follow_up_emails: FollowUpEmail[];
  interview_prep: InterviewPrep | null;
  status: "Applied" | "Interview" | "Rejected" | "Offer";
  created_at: string;
}

// ── Resume tailoring ────────────────────────────────

export interface TailorResult {
  tailored_resume: string;
  changes_made: string[];
  keywords_added: string[];
}

export interface ResumeMeta {
  changes_made: string[];
  keywords_added: string[];
}

// ── ATS scoring ─────────────────────────────────────

export interface ScoreBreakdown {
  keyword_match: number;
  relevance: number;
  formatting: number;
  completeness: number;
}

export interface ScoreResult {
  ats_score: number;
  score_breakdown: ScoreBreakdown;
  matched_keywords: string[];
  missing_keywords: string[];
  critical_issues: string[];
  quick_wins: string[];
}

export interface ScoreDetails {
  score_breakdown: ScoreBreakdown;
  critical_issues: string[];
  quick_wins: string[];
}

// ── Cover letter ────────────────────────────────────

export interface CoverLetterResult {
  cover_letter: string;
  tone_used: string;
  key_selling_points_used: string[];
}

export interface CoverLetterMeta {
  tone_used: string;
  key_selling_points_used: string[];
}

// ── Follow-up emails ────────────────────────────────

export interface FollowUpEmail {
  type: string;
  subject: string;
  body: string;
  when_to_send?: string;
}

export interface FollowUpResult {
  emails: FollowUpEmail[];
}

// ── Interview prep ──────────────────────────────────

export interface InterviewPrepRound {
  round: string;
  description: string;
  duration: string;
  interviewer?: string;
  how_to_prepare?: string;
  is_typical?: boolean;
}

export interface InterviewQuestion {
  question: string;
  hint: string;
  difficulty?: string;
  why_theyre_asking?: string;
  what_they_want_to_hear?: string;
}

export interface KeyTopic {
  topic: string;
  priority: "high" | "medium" | "low";
  what_to_study?: string;
  study_time?: string;
  reason?: string;
}

export interface PrepResource {
  title: string;
  url?: string;
  type: string;
  why_helpful?: string;
  specifically_for?: string;
}

export interface InterviewExperiences {
  difficulty_rating?: number;
  difficulty_description?: string;
  common_themes?: string[];
  salary_range?: string;
  levels_fyi_url?: string;
  glassdoor_url?: string;
  offer_timeline?: string;
  standout_tips?: string[];
}

export interface InterviewPrep {
  interview_process: InterviewPrepRound[];
  technical_questions: InterviewQuestion[];
  behavioral_questions: InterviewQuestion[];
  key_topics: KeyTopic[] | string[];
  resources: PrepResource[];
  interview_experiences?: InterviewExperiences;
  // Legacy fields for backward compat
  company_insights?: Array<{ insight: string; confidence: string; why_it_matters: string }> | string[];
  tips?: string[];
}
