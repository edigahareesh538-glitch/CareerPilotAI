import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import engine, async_session_maker
from app.models.base import Base
from app.models.user import User, UserRole, OAuthAccount, OAuthProvider
from app.models.profile import Profile
from app.models.resume import Resume, ResumeStatus, ResumeVersion
from app.models.skill import Skill
from app.models.job import Job, JobSkill, EmploymentType, ExperienceLevel
from app.models.match import JobMatch, SavedJob
from app.models.application import Application, ApplicationStatus, ApplicationEvent, ApplicationEventType
from app.models.interview import InterviewSession, InterviewMessage, InterviewScore, InterviewType, InterviewStatus, MessageRole, InterviewScoreDimension
from app.models.learning import LearningPlan, LearningPlanStatus, LearningProgress, LearningProgressStatus
from app.models.chat import ChatSession, ChatMessage
from app.models.agent import AgentActivity, AgentName, AgentActionStatus
from app.models.notification import Notification, NotificationType, NotificationPriority

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SKILLS_DATA = [
    ("Python", "programming"), ("JavaScript", "programming"), ("TypeScript", "programming"),
    ("Java", "programming"), ("Go", "programming"), ("Rust", "programming"),
    ("SQL", "database"), ("PostgreSQL", "database"), ("MongoDB", "database"), ("Redis", "database"),
    ("FastAPI", "framework"), ("Django", "framework"), ("React", "framework"), ("Next.js", "framework"),
    ("Docker", "tool"), ("Kubernetes", "tool"), ("Terraform", "tool"), ("Git", "tool"),
    ("AWS", "cloud"), ("GCP", "cloud"), ("Azure", "cloud"),
    ("PyTorch", "ai_ml"), ("TensorFlow", "ai_ml"), ("Scikit-learn", "ai_ml"), ("Pandas", "ai_ml"),
    ("LLM", "ai_ml"), ("RAG", "ai_ml"), ("LangChain", "ai_ml"), ("Vector Database", "ai_ml"),
    ("Communication", "soft"), ("Problem Solving", "soft"), ("Teamwork", "soft"),
]

MOCK_JOBS = [
    {
        "external_id": "demo-1",
        "provider": "demo",
        "company": "TechCorp AI",
        "title": "AI Engineer",
        "description": "We are looking for an AI Engineer to build production ML systems. Required: Python, PyTorch, TensorFlow, MLOps, Docker, Kubernetes. Experience with LLMs and RAG systems preferred. You will work on deploying large language models at scale.",
        "location": "San Francisco, CA",
        "is_remote": False,
        "employment_type": EmploymentType.FULL_TIME,
        "experience_level": ExperienceLevel.MID,
        "salary_min": 150000,
        "salary_max": 220000,
        "url": "https://example.com/jobs/demo-1",
    },
    {
        "external_id": "demo-2",
        "provider": "demo",
        "company": "DataFlow Inc",
        "title": "Machine Learning Engineer",
        "description": "Build scalable ML pipelines. Required: Python, scikit-learn, Pandas, SQL, AWS, Airflow. Experience with feature stores and model monitoring. You will design and implement end-to-end ML systems.",
        "location": "New York, NY",
        "is_remote": True,
        "employment_type": EmploymentType.FULL_TIME,
        "experience_level": ExperienceLevel.SENIOR,
        "salary_min": 160000,
        "salary_max": 240000,
        "url": "https://example.com/jobs/demo-2",
    },
    {
        "external_id": "demo-3",
        "provider": "demo",
        "company": "StartupXYZ",
        "title": "AI Research Intern",
        "description": "Summer internship for AI research. Required: Python, PyTorch, research experience. Will work on LLM fine-tuning and evaluation. Great opportunity for learning and publication.",
        "location": "Remote",
        "is_remote": True,
        "employment_type": EmploymentType.INTERNSHIP,
        "experience_level": ExperienceLevel.ENTRY,
        "salary_min": 60000,
        "salary_max": 80000,
        "url": "https://example.com/jobs/demo-3",
    },
    {
        "external_id": "demo-4",
        "provider": "demo",
        "company": "CloudScale",
        "title": "MLOps Engineer",
        "description": "Deploy and monitor ML models at scale. Required: Python, Docker, Kubernetes, Terraform, Prometheus, Grafana, MLflow, Kubeflow. You will build the ML infrastructure platform.",
        "location": "Austin, TX",
        "is_remote": True,
        "employment_type": EmploymentType.FULL_TIME,
        "experience_level": ExperienceLevel.MID,
        "salary_min": 140000,
        "salary_max": 200000,
        "url": "https://example.com/jobs/demo-4",
    },
    {
        "external_id": "demo-5",
        "provider": "demo",
        "company": "FinTechAI",
        "title": "Senior AI Engineer",
        "description": "Build AI-powered financial products. Required: Python, FastAPI, PostgreSQL, Redis, AWS, LLMs, RAG, vector databases. 5+ years experience. You will lead AI initiatives for fraud detection and risk modeling.",
        "location": "Chicago, IL",
        "is_remote": False,
        "employment_type": EmploymentType.FULL_TIME,
        "experience_level": ExperienceLevel.SENIOR,
        "salary_min": 180000,
        "salary_max": 280000,
        "url": "https://example.com/jobs/demo-5",
    },
]

DEMO_RESUME_PARSED = {
    "candidate": {
        "name": "Hareesh Kumar",
        "email": "hareesh@example.com",
        "phone": "+1-555-0123",
        "location": "San Francisco, CA",
        "linkedin": "https://linkedin.com/in/hareeshkumar",
        "github": "https://github.com/hareeshkumar",
        "portfolio": "https://hareeshkumar.dev",
        "summary": "Passionate AI/ML Engineer with 3 years of experience building production ML systems. Expertise in Python, PyTorch, LLMs, and MLOps. Published researcher with 2 papers at NeurIPS.",
        "education": [
            "M.S. Computer Science (AI/ML) - Stanford University, 2021",
            "B.S. Computer Science - UC Berkeley, 2019",
        ],
        "experience": [
            "AI Engineer at TechCorp (2022-Present): Built LLM-powered chatbot serving 1M+ users. Implemented RAG pipeline with 95% accuracy. Led team of 4 engineers.",
            "ML Engineer Intern at DataFlow (2021): Developed feature store reducing training time by 40%. Built automated model monitoring dashboard.",
            "Research Assistant at Stanford AI Lab (2020-2021): Published 2 papers on efficient transformer architectures. Optimized training for 10B parameter models.",
        ],
        "skills": [
            "Python", "PyTorch", "TensorFlow", "FastAPI", "Docker", "Kubernetes", "AWS",
            "PostgreSQL", "Redis", "MLflow", "LangChain", "LLM", "RAG", "Vector Database",
            "Git", "CI/CD", "Terraform", "Prometheus", "Grafana"
        ],
        "projects": [
            "OpenSource LLM Fine-tuning Framework: 2.5k stars on GitHub. Supports LoRA, QLoRA, and full fine-tuning.",
            "Real-time Fraud Detection System: Processes 100k transactions/sec with 99.9% accuracy.",
            "AI Code Review Assistant: VS Code extension using CodeLlama for automated code reviews.",
        ],
        "certifications": [
            "AWS Certified Machine Learning - Specialty (2023)",
            "Google Cloud Professional ML Engineer (2022)",
        ],
    },
    "target_roles": ["AI Engineer", "ML Engineer", "LLM Engineer"],
    "technical_skills": [
        "Python", "PyTorch", "TensorFlow", "FastAPI", "Docker", "Kubernetes", "AWS",
        "PostgreSQL", "Redis", "MLflow", "LangChain", "LLM", "RAG", "Vector Database",
        "Git", "CI/CD", "Terraform", "Prometheus", "Grafana"
    ],
    "soft_skills": ["Communication", "Problem Solving", "Teamwork", "Leadership", "Mentoring"],
    "years_experience": 3,
}

DEMO_LEARNING_PLAN = {
    "weeks": [
        {
            "week": 1,
            "focus": "Advanced PyTorch & Distributed Training",
            "skills": ["PyTorch DDP", "FSDP", "Gradient Accumulation", "Mixed Precision"],
            "resources": [
                {"title": "PyTorch Distributed Training Tutorial", "url": "https://pytorch.org/tutorials/intermediate/ddp_tutorial.html", "type": "tutorial"},
                {"title": "Scaling Transformers with FSDP", "url": "https://github.com/pytorch/fairscale", "type": "github"},
            ],
            "milestones": ["Train a 1B parameter model on 8 GPUs", "Implement gradient checkpointing"],
        },
        {
            "week": 2,
            "focus": "LLM Fine-tuning & RAG",
            "skills": ["LoRA", "QLoRA", "PEFT", "LangChain", "Vector Databases", "Embeddings"],
            "resources": [
                {"title": "QLoRA Paper", "url": "https://arxiv.org/abs/2305.14314", "type": "paper"},
                {"title": "LangChain RAG Tutorial", "url": "https://python.langchain.com/docs/use_cases/question_answering/", "type": "tutorial"},
            ],
            "milestones": ["Fine-tune Llama-2-7B with LoRA", "Build RAG pipeline with Pinecone"],
        },
        {
            "week": 3,
            "focus": "MLOps & Model Deployment",
            "skills": ["MLflow", "Kubeflow", "Docker", "Kubernetes", "Model Serving", "Monitoring"],
            "resources": [
                {"title": "MLflow Documentation", "url": "https://mlflow.org/docs/latest/index.html", "type": "docs"},
                {"title": "Kubeflow Pipelines Tutorial", "url": "https://www.kubeflow.org/docs/components/pipelines/", "type": "tutorial"},
            ],
            "milestones": ["Deploy model with KServe", "Set up drift detection monitoring"],
        },
        {
            "week": 4,
            "focus": "Advanced Topics & Interview Prep",
            "skills": ["System Design", "Transformers Architecture", "Attention Mechanisms", "Optimization"],
            "resources": [
                {"title": "Designing Machine Learning Systems", "url": "https://www.oreilly.com/library/view/designing-machine-learning/9781098107956/", "type": "book"},
                {"title": "ML System Design Interview", "url": "https://github.com/khuyentran1401/ML-System-Design", "type": "github"},
            ],
            "milestones": ["Complete 3 system design mock interviews", "Review transformer attention math"],
        },
    ],
}


async def seed_demo_data(db: AsyncSession):
    user = User(
        id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        email="hareesh@example.com",
        password_hash=pwd_context.hash("demo123456"),
        full_name="Hareesh Kumar",
        is_verified=True,
        is_active=True,
        role=UserRole.USER,
        last_login_at=datetime.now(timezone.utc),
    )
    db.add(user)

    profile = Profile(
        user_id=user.id,
        headline="AI/ML Engineer | LLM & MLOps Specialist",
        location="San Francisco, CA",
        experience_level="mid",
        target_roles=["AI Engineer", "ML Engineer", "LLM Engineer"],
        target_locations=["San Francisco", "Remote", "New York"],
        bio="Passionate AI/ML Engineer with 3 years of experience building production ML systems. Expertise in Python, PyTorch, LLMs, and MLOps. Published researcher with 2 papers at NeurIPS.",
        linkedin_url="https://linkedin.com/in/hareeshkumar",
        github_url="https://github.com/hareeshkumar",
        portfolio_url="https://hareeshkumar.dev",
    )
    db.add(profile)

    skills = {}
    for name, category in SKILLS_DATA:
        skill = Skill(name=name, category=category)
        db.add(skill)
        await db.flush()
        skills[name.lower()] = skill

    resume = Resume(
        id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
        user_id=user.id,
        storage_key="demo/resume_hareesh.pdf",
        original_filename="Hareesh_Kumar_Resume.pdf",
        mime_type="application/pdf",
        size_bytes=245760,
        status=ResumeStatus.PARSED,
    )
    db.add(resume)

    resume_version = ResumeVersion(
        id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
        resume_id=resume.id,
        parsed_json=DEMO_RESUME_PARSED,
        version=1,
        is_active=True,
    )
    db.add(resume_version)

    jobs = []
    for job_data in MOCK_JOBS:
        job = Job(
            id=uuid.uuid4(),
            provider=job_data["provider"],
            external_id=job_data["external_id"],
            company=job_data["company"],
            title=job_data["title"],
            description=job_data["description"],
            location=job_data["location"],
            is_remote=job_data["is_remote"],
            employment_type=job_data["employment_type"],
            experience_level=job_data["experience_level"],
            salary_min=job_data["salary_min"],
            salary_max=job_data["salary_max"],
            salary_currency="USD",
            url=job_data["url"],
            posted_at=datetime.now(timezone.utc) - timedelta(days=7),
            raw_data={"source": "demo"},
        )
        db.add(job)
        await db.flush()
        jobs.append(job)

        job_skills_text = job_data["description"].lower()
        for skill_name, skill_obj in skills.items():
            if skill_name.lower() in job_skills_text:
                job_skill = JobSkill(job_id=job.id, skill_id=skill_obj.id, weight=1.0)
                db.add(job_skill)

    for job in jobs:
        match = JobMatch(
            id=uuid.uuid4(),
            user_id=user.id,
            job_id=job.id,
            score=94.0 if job.title == "AI Engineer" else 87.0 if job.title == "Machine Learning Engineer" else 72.0,
            explanation={
                "skill_match": {"score": 90.0, "matched": ["Python", "PyTorch", "Docker", "Kubernetes"], "missing": ["RAG", "Vector Database"]},
                "experience_match": {"score": 100.0, "user_years": 3, "required_level": "mid"},
                "embedding_match": {"score": 88.0},
                "weights": {"skill": 0.5, "experience": 0.2, "embedding": 0.3},
            },
        )
        db.add(match)

    saved_job = SavedJob(user_id=user.id, job_id=jobs[0].id)
    db.add(saved_job)

    app = Application(
        id=uuid.uuid4(),
        user_id=user.id,
        job_id=jobs[0].id,
        resume_version_id=resume_version.id,
        status=ApplicationStatus.APPLIED,
        cover_letter="I am excited to apply for the AI Engineer position at TechCorp AI...",
        application_answers={"years_experience": "3", "notice_period": "2 weeks"},
        submitted_at=datetime.now(timezone.utc) - timedelta(days=2),
        external_application_id="TC-2024-001",
    )
    db.add(app)

    app_event = ApplicationEvent(
        application_id=app.id,
        type=ApplicationEventType.SUBMITTED,
        payload={"job_title": jobs[0].title, "company": jobs[0].company},
    )
    db.add(app_event)

    interview = InterviewSession(
        id=uuid.uuid4(),
        user_id=user.id,
        job_id=jobs[0].id,
        type=InterviewType.TECHNICAL,
        status=InterviewStatus.COMPLETED,
        started_at=datetime.now(timezone.utc) - timedelta(days=1, hours=2),
        ended_at=datetime.now(timezone.utc) - timedelta(days=1, hours=1),
        duration_seconds=3600,
        config={"difficulty": "medium", "focus": ["Python", "PyTorch", "System Design"]},
        overall_score=82.5,
    )
    db.add(interview)
    await db.flush()

    interview_messages = [
        InterviewMessage(session_id=interview.id, role=MessageRole.SYSTEM, content="Starting technical interview for AI Engineer position.", timestamp=interview.started_at),
        InterviewMessage(session_id=interview.id, role=MessageRole.INTERVIEWER, content="Tell me about your experience with PyTorch and distributed training.", timestamp=interview.started_at + timedelta(minutes=1)),
        InterviewMessage(session_id=interview.id, role=MessageRole.USER, content="I've used PyTorch DDP and FSDP for training models up to 1B parameters on 8 GPUs...", timestamp=interview.started_at + timedelta(minutes=3)),
        InterviewMessage(session_id=interview.id, role=MessageRole.INTERVIEWER, content="Great! Can you explain the difference between DDP and FSDP?", timestamp=interview.started_at + timedelta(minutes=5)),
    ]
    for msg in interview_messages:
        db.add(msg)

    interview_scores = [
        InterviewScore(session_id=interview.id, dimension=InterviewScoreDimension.TECHNICAL_KNOWLEDGE, score=85.0, evidence={"matched_keywords": ["PyTorch", "DDP", "FSDP", "distributed"]}),
        InterviewScore(session_id=interview.id, dimension=InterviewScoreDimension.COMMUNICATION, score=80.0, evidence={"clarity": "good", "structure": "clear"}),
        InterviewScore(session_id=interview.id, dimension=InterviewScoreDimension.PROBLEM_SOLVING, score=82.0, evidence={"approach": "systematic"}),
    ]
    for score in interview_scores:
        db.add(score)

    learning_plan = LearningPlan(
        id=uuid.uuid4(),
        user_id=user.id,
        target_role="AI Engineer",
        status=LearningPlanStatus.ACTIVE,
        plan_json=DEMO_LEARNING_PLAN,
        generated_at=datetime.now(timezone.utc) - timedelta(days=5),
    )
    db.add(learning_plan)
    await db.flush()

    for week in DEMO_LEARNING_PLAN["weeks"]:
        for skill_name in week["skills"]:
            result = await db.execute(select(Skill).where(Skill.name.ilike(skill_name)))
            skill = result.scalar_one_or_none()
            if skill:
                progress = LearningProgress(
                    plan_id=learning_plan.id,
                    skill_id=skill.id,
                    status=LearningProgressStatus.NOT_STARTED if week["week"] > 2 else LearningProgressStatus.IN_PROGRESS,
                )
                db.add(progress)

    chat_session = ChatSession(
        id=uuid.uuid4(),
        user_id=user.id,
        title="Career guidance for AI Engineer role",
    )
    db.add(chat_session)
    await db.flush()

    chat_messages = [
        ChatMessage(session_id=chat_session.id, role="user", content="What skills should I focus on for an AI Engineer role?", citations=[], metadata={}),
        ChatMessage(session_id=chat_session.id, role="assistant", content="Based on your profile and target roles, I recommend focusing on: 1) Advanced PyTorch (distributed training), 2) LLM fine-tuning with LoRA/QLoRA, 3) RAG systems with vector databases, 4) MLOps with MLflow/Kubeflow. Your current skills in Python, PyTorch, and Docker are a great foundation.", citations=[], metadata={}),
    ]
    for msg in chat_messages:
        db.add(msg)

    agent_activities = [
        AgentActivity(user_id=user.id, agent_name=AgentName.RESUME_ANALYZER, action="parse_resume", status=AgentActionStatus.COMPLETED, input_ref="resume_22222222", output_ref="version_33333333", metadata={"file_size": 245760}),
        AgentActivity(user_id=user.id, agent_name=AgentName.JOB_DISCOVERY, action="fetch_jobs", status=AgentActionStatus.COMPLETED, input_ref="provider:demo", output_ref="5 jobs", metadata={"provider": "demo", "count": 5}),
        AgentActivity(user_id=user.id, agent_name=AgentName.SKILL_MATCHING, action="match_skills", status=AgentActionStatus.COMPLETED, input_ref="user_skills:17, job_skills:45", output_ref="5 matches", metadata={"matches_found": 5}),
        AgentActivity(user_id=user.id, agent_name=AgentName.JOB_RANKING, action="rank_jobs", status=AgentActionStatus.COMPLETED, input_ref="5 candidates", output_ref="ranked list", metadata={"top_score": 94}),
        AgentActivity(user_id=user.id, agent_name=AgentName.APPLICATION_PREPARATION, action="prepare_application", status=AgentActionStatus.COMPLETED, input_ref="job_demo-1, resume_v1", output_ref="application_tc-001", metadata={"cover_letter": True, "answers": 5}),
        AgentActivity(user_id=user.id, agent_name=AgentName.INTERVIEWER, action="conduct_interview", status=AgentActionStatus.COMPLETED, input_ref="session_technical", output_ref="score_82.5", metadata={"type": "technical", "duration": 3600}),
        AgentActivity(user_id=user.id, agent_name=AgentName.CAREER_COACH, action="generate_learning_plan", status=AgentActionStatus.COMPLETED, input_ref="target:AI Engineer", output_ref="plan_4_weeks", metadata={"weeks": 4, "skills": 16}),
    ]
    for activity in agent_activities:
        db.add(activity)

    notifications = [
        Notification(user_id=user.id, type=NotificationType.JOB_MATCH, priority=NotificationPriority.HIGH, title="New High Match!", message="AI Engineer at TechCorp AI - 94% match", payload={"job_id": str(jobs[0].id), "score": 94}, action_url=f"/jobs/{jobs[0].id}"),
        Notification(user_id=user.id, type=NotificationType.APPLICATION_UPDATE, priority=NotificationPriority.NORMAL, title="Application Submitted", message="Your application to TechCorp AI has been submitted", payload={"application_id": str(app.id)}, action_url=f"/applications/{app.id}"),
        Notification(user_id=user.id, type=NotificationType.INTERVIEW_COMPLETED, priority=NotificationPriority.HIGH, title="Interview Completed", message="Technical interview completed with score 82.5%", payload={"session_id": str(interview.id), "score": 82.5}, action_url=f"/interviews/{interview.id}"),
        Notification(user_id=user.id, type=NotificationType.LEARNING_MILESTONE, priority=NotificationPriority.NORMAL, title="Week 1 Complete!", message="You've completed Advanced PyTorch & Distributed Training", payload={"plan_id": str(learning_plan.id), "week": 1}),
    ]
    for notif in notifications:
        db.add(notif)

    await db.commit()
    print("Demo data seeded successfully!")


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        await seed_demo_data(db)


if __name__ == "__main__":
    asyncio.run(main())