from __future__ import annotations

import json
import logging
import os
import re
import time
from typing import Any

import anthropic
from openai import OpenAI

logger = logging.getLogger("applyai.llm")

# ---------------------------------------------------------------------------
# Model configuration
# ---------------------------------------------------------------------------

SONNET = "claude-sonnet-4-6"
GPT_4O_MINI = "gpt-4o-mini"

MODEL_PRICING: dict[str, dict[str, float]] = {
    SONNET:     {"input": 3.00,  "output": 15.00},
    GPT_4O_MINI: {"input": 0.15, "output":  0.60},
}

MAX_RETRIES = int(os.environ.get("LLM_MAX_RETRIES", "3"))
BASE_BACKOFF = float(os.environ.get("LLM_BASE_BACKOFF_SEC", "2.0"))

# ---------------------------------------------------------------------------
# Lazy client initialisation — only created on first use, so missing keys
# don't crash the app at import time.
# ---------------------------------------------------------------------------

_anthropic_client: anthropic.Anthropic | None = None
_openai_client: OpenAI | None = None


def _get_anthropic() -> anthropic.Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        key = os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")
        _anthropic_client = anthropic.Anthropic(api_key=key)
    return _anthropic_client


def _get_openai() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY environment variable is not set")
        _openai_client = OpenAI(api_key=key)
    return _openai_client


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _require_nonempty(**fields: Any) -> None:
    for name, val in fields.items():
        if not val or not str(val).strip():
            raise ValueError(f"{name} cannot be empty")


def _calc_cost(model: str, tokens_in: int, tokens_out: int) -> float:
    p = MODEL_PRICING.get(model, {"input": 0, "output": 0})
    return (tokens_in * p["input"] + tokens_out * p["output"]) / 1_000_000


_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*\n?(.*?)\n?\s*```$", re.DOTALL)


def _strip_code_fences(text: str) -> str:
    """Remove markdown ```json ... ``` wrapping that Claude sometimes adds."""
    text = text.strip()
    m = _CODE_FENCE_RE.match(text)
    return m.group(1).strip() if m else text


def _is_fatal(error: Exception) -> bool:
    """Errors that should never be retried (auth / bad request)."""
    if isinstance(error, (ValueError, TypeError, KeyError)):
        return True
    return type(error).__name__ in {
        "AuthenticationError",
        "BadRequestError",
        "PermissionDenied",
        "InvalidArgument",
        "NotFoundError",
    }


# ---------------------------------------------------------------------------
# Provider-specific calls — each returns (text, tokens_in, tokens_out)
# ---------------------------------------------------------------------------


def _call_anthropic(
    system: str,
    user_prompt: str,
    model: str,
    temperature: float,
    max_tokens: int,
) -> tuple[str, int, int]:
    client = _get_anthropic()
    resp = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": user_prompt}],
    )
    text = resp.content[0].text if resp.content else ""
    if not text:
        raise ValueError("Empty response from Anthropic")
    return text, resp.usage.input_tokens, resp.usage.output_tokens


def _call_openai(
    system: str,
    user_prompt: str,
    model: str,
    temperature: float,
    max_tokens: int,
) -> tuple[str, int, int]:
    client = _get_openai()
    resp = client.chat.completions.create(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt},
        ],
    )
    text = resp.choices[0].message.content or ""
    if not text:
        raise ValueError("Empty response from OpenAI")
    usage = resp.usage
    tokens_in = usage.prompt_tokens if usage else 0
    tokens_out = usage.completion_tokens if usage else 0
    return text, tokens_in, tokens_out


# ---------------------------------------------------------------------------
# Retry wrapper — retries transient errors, raises fatal ones immediately
# ---------------------------------------------------------------------------


def _call_with_retries(
    system: str,
    user_prompt: str,
    model: str,
    temperature: float,
    max_tokens: int,
) -> tuple[str, int, int]:
    call_fn = _call_anthropic if model.startswith("claude-") else _call_openai

    for attempt in range(MAX_RETRIES + 1):
        try:
            return call_fn(system, user_prompt, model, temperature, max_tokens)
        except Exception as e:
            if _is_fatal(e):
                logger.error(
                    f"LLM fatal error | model={model} | {type(e).__name__}: {e}"
                )
                raise
            if attempt == MAX_RETRIES:
                logger.error(
                    f"LLM retries exhausted | model={model} "
                    f"| attempts={MAX_RETRIES + 1} | {type(e).__name__}: {e}"
                )
                raise
            wait = BASE_BACKOFF * (2 ** attempt)
            logger.warning(
                f"LLM transient error | model={model} | attempt={attempt + 1} "
                f"| retry in {wait}s | {type(e).__name__}: {e}"
            )
            time.sleep(wait)

    raise RuntimeError("Unreachable")  # pragma: no cover


# ---------------------------------------------------------------------------
# Core JSON generation
# ---------------------------------------------------------------------------


def _generate_json(
    system: str,
    user_prompt: str,
    *,
    model: str = GPT_4O_MINI,
    temperature: float = 0.3,
    max_tokens: int = 1000,
) -> dict:
    start = time.time()
    prompt_chars = len(system) + len(user_prompt)
    logger.info(f"LLM call | model={model} | prompt_chars={prompt_chars}")

    raw_text, tokens_in, tokens_out = _call_with_retries(
        system, user_prompt, model, temperature, max_tokens,
    )

    duration_ms = round((time.time() - start) * 1000)
    cost = _calc_cost(model, tokens_in, tokens_out)
    logger.info(
        f"LLM done | model={model} | {duration_ms}ms"
        f" | tokens_in={tokens_in} | tokens_out={tokens_out}"
        f" | cost=${cost:.5f}"
    )

    cleaned = _strip_code_fences(raw_text)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        snippet = raw_text[:300] if raw_text else "(empty)"
        logger.error(
            f"JSON parse failed | model={model} | raw={snippet!r} | error={e}"
        )
        raise ValueError(f"Model returned invalid JSON: {e}") from e


# ---------------------------------------------------------------------------
# Interview prep URL builder — real URLs, no hallucination
# ---------------------------------------------------------------------------


def _build_prep_urls(company: str, job_title: str) -> dict:
    c_slug = company.strip().lower().replace(" ", "-")
    r_slug = job_title.strip().lower().replace(" ", "-")

    glassdoor = (
        f"https://www.glassdoor.com/Interview/"
        f"{c_slug}-interview-questions-SRCH_KE0,{len(c_slug)}.htm"
    )
    levels = f"https://www.levels.fyi/companies/{c_slug}/salaries/{r_slug}"

    return {
        "resources": [
            {
                "title": f"{company} Interview Questions - Glassdoor",
                "url": glassdoor,
                "type": "glassdoor",
                "why_helpful": "Real interview experiences and questions from past candidates",
            },
            {
                "title": f"{company} Salaries - Levels.fyi",
                "url": levels,
                "type": "salary",
                "why_helpful": "Verified compensation data for this role at this company",
            },
            {
                "title": f"{company} {job_title} Interview Prep - YouTube",
                "url": (
                    f"https://www.youtube.com/results?search_query="
                    f"{c_slug}+{r_slug}+interview+preparation"
                ),
                "type": "youtube",
                "why_helpful": "Video walkthroughs of interview experiences and tips",
            },
            {
                "title": f"LeetCode - {company} Tagged Problems",
                "url": f"https://leetcode.com/problemset/?search={company.strip()}&page=1",
                "type": "leetcode",
                "why_helpful": "Coding problems commonly asked at this company",
            },
            {
                "title": f"{company} Engineering Blog",
                "url": f"https://www.google.com/search?q={c_slug}+engineering+blog",
                "type": "blog",
                "why_helpful": "Understand the company's tech stack and engineering culture",
            },
            {
                "title": f"{company} {job_title} - Blind",
                "url": (
                    f"https://www.teamblind.com/search/"
                    f"{company.strip()}%20{job_title.strip()}"
                ),
                "type": "community",
                "why_helpful": "Anonymous insights from current and former employees",
            },
        ],
        "glassdoor_url": glassdoor,
        "levels_fyi_url": levels,
    }


# ===================================================================
# PUBLIC API — same function signatures consumed by routers/ai.py
# ===================================================================


def extract_candidate_info(resume_text: str) -> dict:
    """Extract name, current role, and experience years from resume text."""
    if not resume_text.strip():
        return {"name": "", "current_role": "", "experience_years": 0}

    if len(resume_text) > 3000:
        logger.warning(
            f"Resume truncated for extraction | original={len(resume_text)} chars"
            " | limit=3000"
        )

    return _generate_json(
        "You extract structured info from resumes. Always respond with valid JSON.",
        f"""Resume:
{resume_text[:3000]}

Extract the following from this resume:
1. Full name of the candidate
2. Their most recent / current job title and company (e.g. "Software Engineer at Google")
3. Total years of professional experience (estimate from dates if not stated explicitly)

Return JSON:
{{"name": "Full Name", "current_role": "Job Title at Company", "experience_years": 3}}

Rules:
- If you cannot determine the name, return empty string
- For experience_years, calculate from earliest work date to now. Round to nearest integer.
- For current_role, use the MOST RECENT role listed. Include company name.
- Do NOT guess or fabricate — only use what's in the resume""",
        model=GPT_4O_MINI,
        temperature=0.0,
        max_tokens=500,
    )


def tailor_resume(
    resume_text: str,
    job_description: str,
    experience_years: int,
    current_role: str,
    target_role: str,
    is_career_change: bool = False,
) -> dict:
    _require_nonempty(resume_text=resume_text, job_description=job_description)

    return _generate_json(
        """\
You are a senior resume writer with 15 years of experience at top \
recruiting firms. You produce ATS-optimized, professionally formatted resumes.
Always respond with valid JSON.""",
        f"""\
Candidate Context:
- Experience: {experience_years} years
- Current Role: {current_role}
- Target Role: {target_role}
- Career Change: {is_career_change}

Original Resume:
{resume_text}

Job Description:
{job_description}

TASK: Rewrite this resume tailored to the job description above.

CONTENT RULES:
1. Use keywords EXACTLY as they appear in the job description — never paraphrase
2. Only add keywords where they fit the candidate's real experience — never fabricate
3. Preserve all real experience, numbers, dates, and achievements — do not invent
4. Use strong action verbs: "Led", "Built", "Reduced", "Increased", "Designed", "Implemented"
5. Every bullet must show: action + context + measurable result
6. Never use "responsible for" or "duties included"
7. If career change, lead with transferable skills
8. Add a 2-3 line SUMMARY section at the top that directly addresses the target role
9. Reorder sections to put the most relevant experience first for THIS job

FORMATTING RULES — FOLLOW EXACTLY:
The resume MUST use this exact plain-text structure. Do NOT use markdown.
Use ALL CAPS for section headings. Use "• " (bullet + space) for bullet points.
Put each company/role on its own line with " | " as separator.
Keep the structure clean and consistent:

CANDIDATE NAME
email | phone | linkedin | location

SUMMARY
2-3 lines summarizing qualifications for THIS specific role.

SKILLS
• Skill Category: skill1, skill2, skill3
• Another Category: skill4, skill5

EXPERIENCE
Company Name | Role Title | Start – End
• Achievement-focused bullet with measurable result
• Another bullet with action verb + outcome

Another Company | Role Title | Start – End
• Bullet point here
• Another bullet

PROJECTS
Project Name | Tech Stack
• What you built + result

EDUCATION
University Name | Degree | Year
• Notable achievements or GPA if strong

JSON OUTPUT RULES:
- In the JSON string values, represent newlines as \\n (escaped). Do not use literal line breaks inside JSON string values.

Return JSON:
{{"tailored_resume": "the full resume text following the format above exactly",
"changes_made": ["specific change 1", "specific change 2"],
"keywords_added": ["keyword1", "keyword2"]}}""",
        model=SONNET,
        temperature=0.4,
        max_tokens=3000,
    )


def score_resume(
    resume_text: str,
    job_description: str,
) -> dict:
    _require_nonempty(resume_text=resume_text, job_description=job_description)

    return _generate_json(
        """\
You are an ATS (Applicant Tracking System) expert. You analyze resumes \
with precision and consistency. Always respond with valid JSON.""",
        f"""\
Resume:
{resume_text}

Job Description:
{job_description}

Analyze this resume against this job description strictly and objectively.

Scoring Criteria (points earned out of the max for each category):
- keyword_match: out of 40 — how many exact keywords from the JD appear in the resume
- relevance: out of 30 — how well experience matches the role requirements
- formatting: out of 15 — clean structure, no tables/columns/graphics that confuse ATS
- completeness: out of 15 — has all standard sections (experience, education, skills)

ats_score = keyword_match + relevance + formatting + completeness (0–100).

Return JSON in this exact format:
{{"ats_score": 85, \
"score_breakdown": {{"keyword_match": 38, "relevance": 25, "formatting": 12, "completeness": 10}}, \
"matched_keywords": ["keyword1", "keyword2"], \
"missing_keywords": ["missing1", "missing2"], \
"critical_issues": ["issue1", "issue2"], \
"quick_wins": ["fix this one thing to improve score significantly"]}}""",
        model=GPT_4O_MINI,
        temperature=0.0,
        max_tokens=1000,
    )


def generate_cover_letter(
    resume_text: str,
    job_description: str,
    company_name: str,
    candidate_name: str,
    experience_years: int,
    current_role: str,
    target_role: str,
    is_career_change: bool = False,
    company_context: str | None = None,
) -> dict:
    _require_nonempty(resume_text=resume_text, job_description=job_description)

    if company_context:
        para3 = (
            f"- Paragraph 3: Show genuine knowledge of the company using this "
            f"context: {company_context}. Connect their mission/product to why "
            f"this candidate wants this role specifically."
        )
    else:
        para3 = (
            "- Paragraph 3: Based on what can be inferred from the job "
            "description, explain why this specific role at this specific "
            "company appeals to the candidate. Do NOT fabricate specific "
            "company facts, products, or mission statements that aren't in "
            "the job description."
        )

    return _generate_json(
        """\
You are an expert career coach who writes cover letters that actually \
get interviews. You write like a human, not like an AI.
Always respond with valid JSON.""",
        f"""\
Candidate Context:
- Name: {candidate_name}
- Experience: {experience_years} years
- Current Role: {current_role}
- Target Role: {target_role}
- Company: {company_name}
- Career Change: {is_career_change}

Resume:
{resume_text}

Job Description:
{job_description}

Write a cover letter following these rules strictly:

STRUCTURE:
- Paragraph 1: Open with a specific achievement or result from the resume \
that directly relates to the job. Never open with "I am applying for..."
- Paragraph 2: Connect 2-3 specific experiences from the resume to the \
top requirements in the job description. Be specific, use numbers.
{para3}
- Paragraph 4: Short, confident close. One sentence.

STRICT RULES — NEVER USE THESE:
- "I am excited/thrilled/passionate about"
- "I believe I would be a great fit"
- "I am writing to apply for"
- "Please find attached my resume"
- "I look forward to hearing from you"
- "Thank you for your consideration"
- Any sentence starting with "I am a [adjective] professional"

TONE:
- Mirror the tone of the job description (formal company = formal tone, \
startup = conversational tone)
- Confident but not arrogant
- Specific not generic — every sentence should only make sense \
for THIS candidate at THIS company

Return JSON:
{{"cover_letter": "full cover letter text", \
"tone_used": "formal|conversational|technical", \
"key_selling_points_used": ["point1", "point2"]}}""",
        model=SONNET,
        temperature=0.5,
        max_tokens=1500,
    )


def generate_interview_prep(
    job_title: str,
    company: str,
    job_description: str,
    experience_years: int = 0,
    candidate_skills: list[str] | None = None,
) -> dict:
    skills_str = ", ".join(candidate_skills) if candidate_skills else "not specified"

    data = _generate_json(
        """\
You are a senior technical recruiter and interview coach. You have \
insider knowledge of how tech companies run their hiring process. You give \
specific, actionable, and realistic advice. Always respond with valid JSON.""",
        f"""\
Job Title: {job_title}
Company: {company}
Candidate Experience: {experience_years} years
Candidate Skills: {skills_str}

Job Description:
{job_description}

Generate a deep interview preparation guide with the sections below.

SECTION 1 — INTERVIEW PROCESS:
Give the likely interview pipeline for this specific role at {company}.
For each round include: round name, what exactly happens, duration, \
who interviews (e.g. hiring manager, senior engineer, HR), and how to prepare.
Be specific to {company}'s known process if you know it. If unsure, give \
the standard process for this type of role and mark it as "typical".
Include 4-6 rounds.

SECTION 2 — INTERVIEW EXPERIENCES & COMPENSATION:
Based on what you know about {company} for {job_title}:
- What do past candidates say about the interview difficulty (1-5 scale)?
- Common themes from interview experiences
- Estimated salary range for this role at {company} in USD, or say \
"Check levels.fyi and Glassdoor for current compensation data" if uncertain
- Typical offer timeline (days from final round to offer)
- Tips on what makes candidates stand out
Never fabricate salary numbers. If unsure, say "Check levels.fyi".

SECTION 3 — KEY TOPICS TO STUDY:
List 8-12 specific, concrete technical topics this candidate MUST study. \
NOT vague categories like "System Design" or "Data Structures". \
Instead: "Design a URL shortener (consistent hashing + Redis caching)", \
"LRU Cache implementation with O(1) operations", \
"REST API pagination strategies (cursor vs offset)". \
Each topic should be specific enough to study in one sitting.
Include: topic, priority (high/medium/low), what to study, estimated study time.

SECTION 4 — QUESTIONS (technical + behavioral):
Technical: 6-8 questions calibrated to {experience_years} years experience. \
Each with difficulty, hint, and what skill it tests.
Behavioral: 4-6 questions with STAR method guidance specific to each question.

Return JSON:
{{
  "interview_process": [
    {{
      "round": "Phone Screen",
      "description": "30-minute call with recruiter",
      "duration": "30 min",
      "interviewer": "HR Recruiter",
      "how_to_prepare": "specific preparation tip",
      "is_typical": false
    }}
  ],
  "interview_experiences": {{
    "difficulty_rating": 3.5,
    "difficulty_description": "moderate to hard",
    "common_themes": ["theme1", "theme2"],
    "salary_range": "$120,000 - $180,000",
    "offer_timeline": "1-2 weeks after final round",
    "standout_tips": ["tip1", "tip2"]
  }},
  "key_topics": [
    {{
      "topic": "Specific topic name",
      "priority": "high",
      "what_to_study": "exact subtopics or problems",
      "study_time": "2-3 hours"
    }}
  ],
  "technical_questions": [
    {{
      "question": "specific question",
      "difficulty": "medium",
      "hint": "approach hint",
      "why_theyre_asking": "what skill this tests"
    }}
  ],
  "behavioral_questions": [
    {{
      "question": "behavioral question",
      "hint": "STAR method guidance",
      "what_they_want_to_hear": "what a good answer looks like"
    }}
  ]
}}""",
        model=GPT_4O_MINI,
        temperature=0.3,
        max_tokens=4000,
    )

    urls = _build_prep_urls(company, job_title)
    data["resources"] = urls["resources"]
    if "interview_experiences" in data and isinstance(
        data["interview_experiences"], dict
    ):
        data["interview_experiences"]["glassdoor_url"] = urls["glassdoor_url"]
        data["interview_experiences"]["levels_fyi_url"] = urls["levels_fyi_url"]

    return data


def generate_follow_up_emails(
    job_title: str,
    company: str,
    candidate_name: str = "",
    interviewer_name: str | None = None,
    something_discussed: str | None = None,
    interview_date: str | None = None,
) -> list[dict]:
    interviewer = interviewer_name or "the hiring team"
    discussion_line = (
        f"Something specific discussed in interview: {something_discussed}"
        if something_discussed
        else "No specific discussion point provided — keep email slightly more "
        "general but still warm"
    )
    date_line = f"Interview Date: {interview_date}" if interview_date else ""
    name_line = candidate_name or "the candidate"

    data = _generate_json(
        """\
You are an expert career coach who writes follow-up emails that \
feel human and genuine, not templated. Always respond with valid JSON.""",
        f"""\
Candidate Name: {name_line}
Interviewer Name: {interviewer}
Job Title: {job_title}
Company: {company}
{date_line}
{discussion_line}

Write 3 follow-up emails. Follow these rules for all three:

STRICT RULES:
- Never use "I wanted to reach out"
- Never use "I hope this email finds you well"
- Never use "Please let me know if you have any questions"
- Never use "I am very excited about this opportunity"
- Reference something specific about the company or role in each email
- If interviewer name is provided, address them personally
- If something_discussed is provided, reference it naturally — \
this is what makes the email feel real and not templated
- Keep emails under 150 words each
- Confident tone — not desperate, not overly formal

Email 1 — Post Application (sent same day as applying):
- Acknowledge you applied
- One sentence on why this specific role at this specific company
- Offer to answer any questions

Email 2 — Post Interview Thank You (sent within 24 hours):
- Reference something specific from the conversation
- Reinforce one key point from the interview
- Clean close, no begging

Email 3 — Follow Up (sent after 1 week of silence):
- Not needy or desperate
- Add value — share something relevant (an article, a thought, \
a small thing you built) related to what was discussed
- One clear ask

Return JSON:
{{"emails": [\
{{"type": "post-application", "subject": "...", "body": "...", "when_to_send": "same day as applying"}}, \
{{"type": "post-interview", "subject": "...", "body": "...", "when_to_send": "within 24 hours of interview"}}, \
{{"type": "follow-up", "subject": "...", "body": "...", "when_to_send": "7 days after interview if no response"}}\
]}}""",
        model=GPT_4O_MINI,
        temperature=0.5,
        max_tokens=1500,
    )
    return data["emails"]
