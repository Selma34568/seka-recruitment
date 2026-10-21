# SEKA Recruitment Management System

**A web-based recruitment management platform for SEKA, built with FastAPI, Next.js, TypeScript, and PostgreSQL.**

**Project Status:** Functional Local Demo / Proof of Concept

## Project Overview

SEKA Recruitment Management System is designed to help HR teams manage job applications across multiple company branches through a centralized interface.

The current prototype demonstrates candidate registration, recruitment tracking, branch organization, PDF CV management, and a bilingual Polish/English user interface.

The project was developed to demonstrate core functionality, validate business requirements, and support further discussions with SEKA stakeholders.

## Implemented Features

### HR Dashboard

- Overview of candidates and recruitment applications
- Statistics for recruitment stages
- Candidate search and city filtering
- Branch-based recruitment overview
- Demo role selection for Administrator, HR Manager, and Branch Manager

### Candidate Management

- Register new candidates
- Create recruitment applications linked to branches
- View candidate profiles and contact information
- Search and filter candidates
- Update recruitment application statuses
- Store and retrieve candidate information using PostgreSQL

### Recruitment Pipeline

A visual recruitment workflow with six stages:

- **NEW** — New application
- **REVIEW** — Application under review
- **INTERVIEW** — Interview stage
- **OFFER** — Job offer
- **HIRED** — Candidate hired
- **REJECTED** — Application rejected

Applications are displayed as cards, with search and city filtering.

### Branch Management

- Overview of company branches
- Application counts by branch
- City-based candidate filtering
- Direct navigation to relevant candidate profiles

### PDF CV Management

- Upload PDF CV documents
- Validate file type and maximum file size (5 MB)
- Associate CV documents with candidate profiles
- View uploaded CV documents

### Application Validation

- Validate required application information
- Detect missing city, position, or CV information
- Generate Polish-language email previews requesting missing information
- Support validated application submission through the backend

**Note:** Email preview generation is implemented. Automatic email sending and mailbox integration are not yet complete.

### Bilingual User Interface

The application supports:

- 🇵🇱 **Polish (Polski)**
- 🇬🇧 **English**

Language selection is available across the main recruitment screens and is remembered locally in the browser.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| Version Control | Git and GitHub |

## Project Structure

```text
seka-recruitment/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── permissions.py
│   ├── intake.py
│   └── email_templates.py
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── candidates/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── branches/
│   │   └── pipeline/
│   └── lib/
│       └── api.ts
└── README.md
```

## Running the Project Locally

### Prerequisites

- Python
- Node.js and npm
- PostgreSQL database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Selma34568/seka-recruitment.git
cd seka-recruitment
```

### 2. Configure the backend

Create a Python virtual environment and install the Python dependencies used by the project.

Configure the PostgreSQL connection using `DATABASE_URL` in the local backend environment.

Enable local demo mode only when using fictional test records:

```env
DATABASE_URL=your_postgresql_connection_string
SEKA_DEMO_MODE=true
```

Start the FastAPI backend using the local development configuration:

```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

Backend API documentation:

`http://127.0.0.1:8001/docs`

### 3. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001
```

Start the frontend:

```bash
npm run dev
```

Open:

`http://localhost:3000`

### 4. Verify the frontend build

```bash
npm run build
```

The final frontend build has been successfully tested in the local development environment.

## Demonstration Workflow

The prototype can be demonstrated using the following steps:

1. Open the HR Dashboard to view recruitment statistics.
2. Choose a demonstration role and branch.
3. Browse the candidate list and filter by city.
4. Register a fictional candidate.
5. Open the newly created candidate profile.
6. Upload a test PDF CV.
7. Change the recruitment status.
8. Review the updated recruitment pipeline.
9. Switch between Polish and English.

## Authentication and Security

The backend contains groundwork for Microsoft Entra ID authentication and role-based access control.

However, the currently demonstrated role selector is a simulation and is **not a substitute for real authentication or authorization**.

The demo-specific API endpoints are intended only for local development and fictional test records.

**Do not expose demo mode publicly or process real candidate information using the demo endpoints.**

Credentials, database passwords, uploaded CVs, and local environment files must not be committed to GitHub.

## Current Development Status

| Component | Status |
|---|---|
| HR Dashboard | Implemented |
| Candidate Registration | Implemented |
| Candidate Profiles | Implemented |
| PDF CV Upload | Implemented |
| Recruitment Status Updates | Implemented |
| Branch and City Filtering | Implemented |
| Recruitment Pipeline | Implemented |
| Polish/English Interface | Implemented |
| Application Validation | Implemented |
| Missing-Information Email Preview | Implemented |
| Frontend Production Build Test | Passed |
| Microsoft Entra ID Production Login | Pending integration |
| Automatic Email Sending | Not completed |
| Production Deployment | Not completed |

## Future Development

Before production deployment, the project requires:

- Complete Microsoft Entra ID integration
- Enforce authenticated, server-side role and branch permissions for all production workflows
- Automatic mailbox integration and email notifications
- Secure file storage and personal-data protection
- Additional end-to-end and security testing
- Production configuration and deployment
- Alignment with SEKA's final infrastructure and technology requirements

## Project Purpose

This repository presents a functional proof of concept for SEKA's recruitment management workflow.

It demonstrates the application's main features and provides a foundation for further development based on stakeholder feedback.

The system is currently intended for **local demonstration and testing**, not production use.

## Repository

https://github.com/Selma34568/seka-recruitment
