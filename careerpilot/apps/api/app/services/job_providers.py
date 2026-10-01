from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
from uuid import UUID


@dataclass
class RawJob:
    external_id: str
    company: str
    title: str
    description: str
    location: str | None = None
    is_remote: bool = False
    employment_type: str | None = None
    experience_level: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str = "USD"
    url: str = ""
    posted_at: Any | None = None
    expires_at: Any | None = None
    raw_data: dict[str, Any] | None = None


class JobProvider(ABC):
    name: str

    @abstractmethod
    async def fetch_jobs(self, query: str, location: str | None, limit: int) -> list[RawJob]:
        pass

    @abstractmethod
    async def get_job_details(self, external_id: str) -> RawJob | None:
        pass


class MockJobProvider(JobProvider):
    name = "mock"

    async def fetch_jobs(self, query: str, location: str | None, limit: int) -> list[RawJob]:
        mock_jobs = [
            RawJob(
                external_id="mock-1",
                company="TechCorp AI",
                title="AI Engineer",
                description="We are looking for an AI Engineer to build production ML systems. Required: Python, PyTorch, TensorFlow, MLOps, Docker, Kubernetes. Experience with LLMs and RAG systems preferred.",
                location="San Francisco, CA",
                is_remote=False,
                employment_type="full_time",
                experience_level="mid",
                salary_min=150000,
                salary_max=220000,
                url="https://example.com/jobs/mock-1",
                raw_data={"source": "mock"},
            ),
            RawJob(
                external_id="mock-2",
                company="DataFlow Inc",
                title="Machine Learning Engineer",
                description="Build scalable ML pipelines. Required: Python, scikit-learn, Pandas, SQL, AWS, Airflow. Experience with feature stores and model monitoring.",
                location="New York, NY",
                is_remote=True,
                employment_type="full_time",
                experience_level="senior",
                salary_min=160000,
                salary_max=240000,
                url="https://example.com/jobs/mock-2",
                raw_data={"source": "mock"},
            ),
            RawJob(
                external_id="mock-3",
                company="StartupXYZ",
                title="AI Research Intern",
                description="Summer internship for AI research. Required: Python, PyTorch, research experience. Will work on LLM fine-tuning and evaluation.",
                location="Remote",
                is_remote=True,
                employment_type="internship",
                experience_level="entry",
                salary_min=60000,
                salary_max=80000,
                url="https://example.com/jobs/mock-3",
                raw_data={"source": "mock"},
            ),
            RawJob(
                external_id="mock-4",
                company="CloudScale",
                title="MLOps Engineer",
                description="Deploy and monitor ML models at scale. Required: Python, Docker, Kubernetes, Terraform, Prometheus, Grafana, MLflow, Kubeflow.",
                location="Austin, TX",
                is_remote=True,
                employment_type="full_time",
                experience_level="mid",
                salary_min=140000,
                salary_max=200000,
                url="https://example.com/jobs/mock-4",
                raw_data={"source": "mock"},
            ),
            RawJob(
                external_id="mock-5",
                company="FinTechAI",
                title="Senior AI Engineer",
                description="Build AI-powered financial products. Required: Python, FastAPI, PostgreSQL, Redis, AWS, LLMs, RAG, vector databases. 5+ years experience.",
                location="Chicago, IL",
                is_remote=False,
                employment_type="full_time",
                experience_level="senior",
                salary_min=180000,
                salary_max=280000,
                url="https://example.com/jobs/mock-5",
                raw_data={"source": "mock"},
            ),
        ]
        return mock_jobs[:limit]

    async def get_job_details(self, external_id: str) -> RawJob | None:
        jobs = await self.fetch_jobs("", None, 10)
        for job in jobs:
            if job.external_id == external_id:
                return job
        return None


PROVIDER_REGISTRY: dict[str, JobProvider] = {
    "mock": MockJobProvider(),
}


def get_provider(name: str) -> JobProvider | None:
    return PROVIDER_REGISTRY.get(name)


def register_provider(provider: JobProvider) -> None:
    PROVIDER_REGISTRY[provider.name] = provider