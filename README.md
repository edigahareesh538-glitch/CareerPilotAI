# 🚀 CareerPilot AI

## Your AI Career Copilot

> CareerPilot AI is an agentic AI-powered career platform that helps students and job seekers move from **resume analysis to job discovery, skill development, assessments, company preparation, and interview readiness** through personalized AI workflows.

---

## 🌟 Overview

CareerPilot AI brings multiple career-development activities into one intelligent platform.

Instead of using separate platforms for resumes, jobs, learning resources, assessments, coding preparation, and interviews, CareerPilot AI connects these workflows and personalizes them according to the user's:

- Resume
- Skills
- Experience
- Career goals
- Target roles
- Learning progress
- Target companies

The platform uses specialized AI agents to analyze information, coordinate tasks, generate recommendations, and provide actionable career guidance.

---

# 🎯 The Problem

Students and job seekers often face a fragmented career journey.

```text
Resume
   ↓
Job Search
   ↓
Skill Gap
   ↓
Courses
   ↓
Practice
   ↓
Assessments
   ↓
Company Preparation
   ↓
Interview Preparation
   ↓
Career Planning
````

These activities are usually handled across different platforms, making it difficult to maintain a personalized and continuous career-development plan.

### CareerPilot AI solves this by connecting the entire journey into one platform.

---

# 💡 The Solution

CareerPilot AI acts as an **AI Career Copilot** that understands the user's career context and coordinates specialized agents.

```text
                    USER
                      │
                      ▼
               Resume / Profile
                      │
                      ▼
            Agent Orchestrator
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   Resume Agent   Job Agent    Career Agent
        │             │             │
        └─────────────┼─────────────┘
                      ▼
             Skill Matching Agent
                      │
                      ▼
                Skill Gap Agent
                      │
                      ▼
                 Learning Agent
                      │
           ┌──────────┼──────────┐
           ▼          ▼          ▼
        Courses    YouTube    Roadmaps
                      │
                      ▼
              Assessment Agent
                      │
                      ▼
          Company Preparation Agent
                      │
              ┌───────┼───────┐
              ▼       ▼       ▼
             DSA     SQL   Interview
                      │
                      ▼
                Interview Agent
                      │
                      ▼
                 Career Coach
```

---

# 🤖 AI Agents

## 📄 Resume Analyzer Agent

Analyzes the user's resume and extracts meaningful career information.

### Analyzes

* Skills
* Projects
* Education
* Experience
* Achievements
* Keywords
* Career interests
* Role alignment

The extracted information becomes the foundation for personalized career workflows.

---

## 💼 Job Discovery Agent

Discovers relevant job opportunities based on the user's profile.

### Considers

* Skills
* Experience
* Education
* Target role
* Location
* Career interests

---

## 🎯 Job Matching Agent

Compares the candidate's profile with job requirements.

### Provides

* Matched skills
* Missing skills
* Relevant experience
* Role alignment
* Improvement areas
* Match explanations

---

## 📊 Skill Gap Agent

Identifies the difference between the user's current capabilities and the requirements of their target role.

```text
Current Skills
      ↓
Target Role
      ↓
Required Skills
      ↓
Skill Gap
      ↓
Priority Skills
```

This information is then passed to the learning workflow.

---

## 📚 Learning Agent

Converts identified skill gaps into personalized learning paths.

### Can recommend

* Courses
* YouTube videos
* Learning resources
* Roadmaps
* Assignments
* Practice material

Example:

```text
Skill Gap
   ↓
Learning Roadmap
   ↓
Course
   ↓
Practice
   ↓
Assignment
   ↓
Assessment
```

---

## 🧪 Assessment Agent

Creates personalized assessments based on the user's:

* Skills
* Target role
* Learning progress
* Skill gaps

### Supported areas

* Programming
* DSA
* SQL
* AI/ML
* Technical fundamentals
* Role-specific knowledge

---

## 🏢 Company Preparation Agent

Helps users prepare for specific companies and roles.

### Preparation can include

* DSA
* Coding problems
* SQL
* Technical questions
* HR questions
* Behavioral questions
* Company-specific interview preparation

---

## 🎤 Interview Agent

Provides AI-powered mock interviews.

### Interview types

* HR
* Technical
* Behavioral
* Resume-based
* Job-specific
* Coding
* Mixed interviews

The agent can generate follow-up questions based on the user's previous responses.

---

## 👨‍💼 Career Coach Agent

Acts as a continuous AI career assistant.

### Helps with

* Career planning
* Skill development
* Learning goals
* Job preparation
* Interview preparation
* Daily tasks
* Weekly goals
* Career decisions

---

# 🔥 Key Features

### 📄 AI Resume Analysis

Understand resumes and generate structured candidate profiles.

### 💼 Personalized Job Discovery

Find opportunities relevant to the user's career profile.

### 🎯 Intelligent Job Matching

Understand which skills match a job and which skills are missing.

### 📊 Skill Gap Analysis

Identify the most important skills required for the user's target career.

### 📚 Personalized Learning Roadmaps

Generate learning paths based on individual skill gaps.

### 🎥 Learning Resources

Discover useful courses, YouTube channels, videos, and other learning resources.

### 🧪 AI Assessments

Generate assessments based on the user's career goals and learning progress.

### 💻 DSA & SQL Preparation

Practice important technical skills for software-development careers.

### 🏢 Company Preparation

Create preparation paths for specific companies and roles.

### 🎤 AI Mock Interviews

Practice realistic interviews with dynamic follow-up questions.

### 🏆 Daily & Weekly Challenges

Practice consistently through coding, DSA, SQL, AI/ML, and other technical challenges.

### 📈 Career Dashboard

Track:

* Career readiness
* Skills
* Skill gaps
* Learning progress
* Assessment results
* Interview performance
* Challenges
* Career goals

---

# 🧠 Agentic Workflow

CareerPilot AI uses specialized agents rather than relying on a single general-purpose chatbot.

```text
User Request
     ↓
Agent Orchestrator
     ↓
Select Appropriate Agent
     ↓
Retrieve Relevant Context
     ↓
Execute Agent Task
     ↓
Generate Result
     ↓
Pass Context to Next Agent
     ↓
Actionable Career Guidance
```

This allows different agents to specialize in different career tasks while maintaining the user's overall career context.

---

# 🔄 Complete User Journey

```text
📄 Upload Resume
       ↓
🤖 Resume Analysis
       ↓
👤 Career Profile
       ↓
💼 Job Discovery
       ↓
🎯 Job Matching
       ↓
📊 Skill Gap Analysis
       ↓
📚 Learning Roadmap
       ↓
🎥 Courses & YouTube Resources
       ↓
📝 Assignments
       ↓
🧪 Assessments
       ↓
🏆 Challenges
       ↓
🏢 Company Preparation
       ↓
🎤 Mock Interview
       ↓
📈 Performance Analysis
       ↓
👨‍💼 Career Coaching
```

---

# 🏗️ System Architecture

```text
┌─────────────────────────────────────┐
│          Next.js Frontend            │
│      React + TypeScript + Tailwind   │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│           FastAPI Backend            │
│                Python                │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│        Agent Orchestration Layer     │
├─────────────────────────────────────┤
│ Resume │ Jobs │ Matching │ Skills    │
│ Learn  │ Assessment │ Interview      │
│ Coach  │ Career Intelligence         │
└──────────────────┬──────────────────┘
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
       Gemini  PostgreSQL  Redis
```

---

# 🛠️ Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* TanStack Query
* Radix UI
* Three.js

## Backend

* Python
* FastAPI
* Pydantic
* SQLAlchemy
* Async APIs

## AI

* Google Gemini
* LLM Provider Abstraction
* Embedding Provider Abstraction
* Agent Orchestration
* Context-Aware AI Workflows

## Database & Infrastructure

* PostgreSQL
* pgvector
* Redis
* Docker
* Docker Compose

---

# 🐳 Docker

CareerPilot AI supports containerized development and deployment.

## Build and Start

```bash
docker compose up --build
```

## Run in Background

```bash
docker compose up -d --build
```

## Stop

```bash
docker compose down
```

## View Logs

```bash
docker compose logs -f
```

Docker provides a consistent environment for running the application's services and dependencies.

---

# 💻 Local Development

## Requirements

* Node.js 22+
* Python 3.12+
* pnpm
* Docker

## Install Dependencies

```bash
pnpm install
```

## Start Frontend

```bash
cd apps/web
pnpm dev
```

## Start Backend

```bash
cd apps/api
uvicorn app.main:app --reload --port 8000
```

## Application

```text
http://localhost:3000
```

## Backend API

```text
http://localhost:8000
```

## API Documentation

```text
http://localhost:8000/docs
```

---

# 📁 Project Structure

```text
careerpilot/
│
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # FastAPI backend
│
├── packages/                # Shared packages
│
├── infra/                   # Infrastructure
│
├── docs/                    # Documentation
│
├── .env.example
├── docker-compose.yml
├── Makefile
├── package.json
└── README.md
```

---

# 🔐 Responsible AI

CareerPilot AI follows responsible AI principles.

* No fabricated qualifications
* No fake experience
* No unauthorized applications
* No CAPTCHA bypass
* No anti-bot bypass
* Explicit tool permissions
* Secure data handling
* Transparent recommendations
* Human-in-the-loop decisions

The system is designed to assist users with career decisions while keeping the user in control.

---

# 🚀 Vision

CareerPilot AI aims to become a unified **AI career operating system** where users can continuously:

```text
Discover
   ↓
Learn
   ↓
Practice
   ↓
Assess
   ↓
Prepare
   ↓
Interview
   ↓
Improve
   ↓
Grow
```

All powered by personalized AI agents and a continuously evolving understanding of the user's career journey.

---

# 👤 Creator

**Hareesh Ediga**

B.Tech — CSE / AI
MVR College of Engineering and Technology
Vijayawada, Andhra Pradesh

---

## 🚀 CareerPilot AI

### From Resume to Career — Powered by AI Agents.

```

This version is **only about the CareerPilot AI project**—no hackathon name, track, team, submission information, prizes, or competition details.
```
