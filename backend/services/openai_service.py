import os
import json
import time
import logging
from openai import OpenAI

logger = logging.getLogger("applyai.openai")

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

MODEL = "gpt-4o-mini"


def _generate_json(system: str, user_prompt: str) -> dict:
    start = time.time()
    prompt_chars = len(system) + len(user_prompt)
    logger.info(f"OpenAI call | model={MODEL} | prompt_chars={prompt_chars}")

    response = client.chat.completions.create(
        model=MODEL,
        temperature=0.7,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt},
        ],
    )

    duration_ms = round((time.time() - start) * 1000)
    usage = response.usage
    tokens_in = usage.prompt_tokens if usage else "?"
    tokens_out = usage.completion_tokens if usage else "?"
    logger.info(f"OpenAI done | {duration_ms}ms | tokens_in={tokens_in} | tokens_out={tokens_out}")

    return json.loads(response.choices[0].message.content)


def extract_candidate_info(resume_text: str) -> dict:
    """Extract name, current role, and experience years from resume text."""
    if not resume_text.strip():
        return {"name": "", "current_role": "", "experience_years": 0}

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
    )


def tailor_resume(
    resume_text: str,
    job_description: str,
    experience_years: int,
    current_role: str,
    target_role: str,
    is_career_change: bool = False,
) -> dict:
    if not resume_text.strip() or not job_description.strip():
        raise ValueError("Resume and job description cannot be empty")

    return _generate_json(
        """You are a senior resume writer with 15 years of experience at top \
recruiting firms. You produce ATS-optimized, professionally formatted resumes.
Always respond with valid JSON.""",
        f"""Candidate Context:
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

Return JSON:
{{"tailored_resume": "the full resume text following the format above exactly",
"changes_made": ["specific change 1", "specific change 2"],
"keywords_added": ["keyword1", "keyword2"]}}""",
    )


def score_resume(
    resume_text: str,
    job_description: str,
) -> dict:
    if not resume_text.strip() or not job_description.strip():
        raise ValueError("Resume and job description cannot be empty")

    return _generate_json(
        """You are an ATS (Applicant Tracking System) expert. You analyze resumes \
with precision and consistency. Always respond with valid JSON.""",
        f"""Resume:
{resume_text}

Job Description:
{job_description}

Analyze this resume against this job description strictly and objectively.

Scoring Criteria:
- Keyword match (40%): How many exact keywords from JD appear in resume
- Relevance (30%): How well does experience match the role requirements
- Formatting (15%): Clean structure, no tables/columns/graphics that confuse ATS
- Completeness (15%): Has all standard sections (experience, education, skills)

Return JSON in this exact format:
{{"ats_score": 85, "score_breakdown": {{"keyword_match": 38, "relevance": 25, "formatting": 12, "completeness": 10}}, "matched_keywords": ["keyword1", "keyword2"], "missing_keywords": ["missing1", "missing2"], "critical_issues": ["issue1", "issue2"], "quick_wins": ["fix this one thing to improve score significantly"]}}""",
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
) -> dict:
    if not resume_text.strip() or not job_description.strip():
        raise ValueError("Resume and job description cannot be empty")

    return _generate_json(
        """You are an expert career coach who writes cover letters that actually \
get interviews. You write like a human, not like an AI.
Always respond with valid JSON.""",
        f"""Candidate Context:
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
- Paragraph 3: Show genuine knowledge of the company. Connect their \
mission/product to why this candidate wants this role specifically.
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
{{"cover_letter": "full cover letter text", "tone_used": "formal|conversational|technical", "key_selling_points_used": ["point1", "point2"]}}""",
    )


def generate_interview_prep(
    job_title: str,
    company: str,
    job_description: str,
    experience_years: int = 0,
    candidate_skills: list[str] | None = None,
) -> dict:
    skills_str = ", ".join(candidate_skills) if candidate_skills else "not specified"

    return _generate_json(
        """You are a senior technical recruiter and interview coach. You have \
insider knowledge of how tech companies run their hiring process. You give \
specific, actionable, and realistic advice. Always respond with valid JSON.""",
        f"""Job Title: {job_title}
Company: {company}
Candidate Experience: {experience_years} years
Candidate Skills: {skills_str}

Job Description:
{job_description}

Generate a deep interview preparation guide with 3 main sections plus questions.

SECTION 1 — INTERVIEW PROCESS:
Give the likely interview pipeline for this specific role at {company}.
For each round include: round name, what exactly happens, duration, \
who interviews (e.g. hiring manager, senior engineer, HR), and how to prepare.
Be specific to {company}'s known process if you know it. If unsure, give \
the standard process for this type of role and mark it as "typical".
Include 4-6 rounds.

SECTION 2 — RESOURCES WITH LINKS:
Provide real, useful resources with actual URLs. Include:
- Glassdoor interview page for {company}: https://www.glassdoor.com/Interview/{{company-slug}}-interview-questions-SRCH_KE0,{{len}}.htm
- LeetCode/coding practice links if technical role
- YouTube channels or specific videos for interview prep
- Relevant books or courses
- Company engineering blog or tech talks if they exist
- Any other genuinely useful resource
For each: title, url (real, working URL — not made up), type, and why it helps.
Give at least 6 resources.

SECTION 3 — INTERVIEW EXPERIENCES & COMPENSATION:
Based on what you know about {company} for {job_title}:
- What do past candidates say about the interview difficulty (1-5 scale)?
- Common themes from interview experiences (what surprised people, what was easy/hard)
- Estimated salary range for this role at {company} (give range in USD or say "research on levels.fyi")
- Provide the levels.fyi URL: https://www.levels.fyi/companies/{{company-slug}}/salaries/{{role-slug}}
- Typical offer timeline (days from final round to offer)
- Acceptance rate tips (what makes candidates stand out)
If you are not confident about salary/compensation data, say exactly: \
"Check levels.fyi and Glassdoor for current compensation data" — never fabricate numbers.

SECTION 4 — KEY TOPICS TO STUDY:
List 8-12 specific, concrete technical topics this candidate MUST study. \
NOT vague categories like "System Design" or "Data Structures". \
Instead: "Design a URL shortener (consistent hashing + Redis caching)", \
"LRU Cache implementation with O(1) operations", \
"REST API pagination strategies (cursor vs offset)". \
Each topic should be specific enough that the candidate can Google it and study it in one sitting.
Include: topic (specific and detailed), priority (high/medium/low), \
what to study (specific subtopics or problems), and estimated study time.

SECTION 5 — QUESTIONS (technical + behavioral):
Technical: 6-8 questions calibrated to {experience_years} years experience. \
Each with difficulty, hint, and what skill it tests.
Behavioral: 4-6 questions with STAR method guidance specific to each question.

Return JSON in this exact format:
{{
  "interview_process": [
    {{
      "round": "Phone Screen",
      "description": "30-minute call with recruiter covering background, motivation, and role fit",
      "duration": "30 min",
      "interviewer": "HR Recruiter",
      "how_to_prepare": "specific preparation tip",
      "is_typical": false
    }}
  ],
  "resources": [
    {{
      "title": "resource name",
      "url": "https://actual-url.com/path",
      "type": "glassdoor|leetcode|youtube|blog|book|course|tool",
      "why_helpful": "what this helps with specifically"
    }}
  ],
  "interview_experiences": {{
    "difficulty_rating": 3.5,
    "difficulty_description": "moderate to hard, heavy on system design",
    "common_themes": ["theme 1 from past candidates", "theme 2"],
    "salary_range": "$120,000 - $180,000 (or 'check levels.fyi')",
    "levels_fyi_url": "https://www.levels.fyi/companies/company/salaries/role",
    "glassdoor_url": "https://www.glassdoor.com/Salary/company-salaries-...",
    "offer_timeline": "1-2 weeks after final round",
    "standout_tips": ["what makes candidates stand out"]
  }},
  "key_topics": [
    {{
      "topic": "Specific topic name with detail",
      "priority": "high|medium|low",
      "what_to_study": "exact subtopics, problems, or concepts to cover",
      "study_time": "2-3 hours"
    }}
  ],
  "technical_questions": [
    {{
      "question": "specific technical question",
      "difficulty": "easy|medium|hard",
      "hint": "how to approach the answer",
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
    )


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
        else "No specific discussion point provided — keep email slightly more general but still warm"
    )
    date_line = f"Interview Date: {interview_date}" if interview_date else ""
    name_line = candidate_name or "the candidate"

    data = _generate_json(
        """You are an expert career coach who writes follow-up emails that \
feel human and genuine, not templated. Always respond with valid JSON.""",
        f"""Candidate Name: {name_line}
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
{{"emails": [{{"type": "post-application", "subject": "...", "body": "...", "when_to_send": "same day as applying"}}, {{"type": "post-interview", "subject": "...", "body": "...", "when_to_send": "within 24 hours of interview"}}, {{"type": "follow-up", "subject": "...", "body": "...", "when_to_send": "7 days after interview if no response"}}]}}""",
    )
    return data["emails"]
