# SEKA Recruitment Management System

**A modern, bilingual recruitment management platform for organizing candidates, managing job applications, and monitoring recruitment activities across multiple company branches.**

**Technology Stack:** Next.js 16 · React · TypeScript · FastAPI · Python · PostgreSQL · Tailwind CSS

**Project Status:** Functional Demo / Proof of Concept

---

## 1. Project Overview

The **SEKA Recruitment Management System** is a web-based application developed to simplify and centralize recruitment operations across multiple SEKA branches.

The platform provides HR teams with a structured environment for registering candidates, organizing job applications, managing CV documents, tracking recruitment stages, recording internal HR notes, and analyzing recruitment activities.

The current implementation is a functional prototype designed for demonstration, testing, and further development based on company requirements.

### Main Objectives

- Centralize candidate and job application information.
- Organize recruitment activities by branch and city.
- Simplify application status management.
- Provide a clear overview of recruitment progress.
- Support internal HR documentation and notes.
- Present recruitment data through visual reports.
- Provide a Polish-language interface with English support.
- Establish a foundation for future company-wide integration.

---

## 2. Key Features

### 2.1 HR Dashboard

A centralized dashboard for monitoring recruitment operations.

**Features:**

- Total candidate statistics
- Application status summaries
- Overview of ongoing recruitment activities
- Candidate search functionality
- City-based filtering
- Quick access to candidate profiles
- Navigation between recruitment modules

The dashboard provides HR personnel with an overview of recruitment activity.

### 2.2 Candidate Management

The candidate management module allows HR staff to organize and review applicant information.

**Features:**

- Create candidate profiles
- Store personal and contact information
- Associate applications with specific branches
- Record applied positions
- View individual candidate profiles
- Search and filter candidates
- Update application status
- Access associated CV documents

Candidate and application records are stored in PostgreSQL.

### 2.3 Recruitment Pipeline

The Recruitment Pipeline provides a visual overview of applications across six recruitment stages.

| Stage | Description |
|---|---|
| NEW | Newly received application |
| REVIEW | Application under evaluation |
| INTERVIEW | Candidate selected for an interview |
| OFFER | Job offer stage |
| HIRED | Successfully recruited candidate |
| REJECTED | Application rejected |

**Capabilities:**

- Visual recruitment stage columns
- Candidate cards grouped by status
- Search and city filtering
- Candidate profile navigation
- Application status tracking

Recruitment status changes are managed through the candidate profile.

### 2.4 HR Notes

The HR Notes module provides an internal documentation area for recruitment applications.

**Features:**

- Write recruitment-related notes
- Edit existing notes
- Associate notes with an individual application
- Store notes through the backend in PostgreSQL
- Retrieve saved notes through candidate profiles
- Maximum note length of 5,000 characters
- Polish and English user interface

This functionality is designed to support internal HR evaluation and communication.

**Implementation scope:** The current version uses one editable notes field per application. Multi-user note histories, authorship auditing, and production access controls are future improvements.

### 2.5 Recruitment Reports

The Recruitment Reports module provides a structured overview of candidate and application statistics.

**Report Page:** `/reports`

**Available reports:**

- Total number of candidates
- Total number of applications
- Applications in the interview stage
- Applications in the offer stage
- Distribution across recruitment stages
- Recruitment application counts by city
- Visual charts and statistical summaries

Reports are calculated from application data retrieved through the backend demo API.

The module supports both Polish and English.

### 2.6 Branch Management

The branch management module organizes recruitment activity across company locations.

**Features:**

- List company branches
- Display each branch's city
- Count recruitment applications per branch
- Navigate to branch-specific candidate lists
- Filter candidates by location

The demo dataset includes branches in Warszawa, Kraków, Poznań, Wrocław, and Katowice.

### 2.7 PDF CV Management

The application provides basic document management for candidates.

**Features:**

- Upload candidate CV files
- Support PDF documents
- Validate file format
- Enforce a maximum upload size of 5 MB
- Associate uploaded CVs with candidate records
- Open and view uploaded CV documents

The prototype uses local file storage for uploaded documents.

Production deployment will require appropriately secured and persistent document storage.

### 2.8 Application Validation

The backend contains an application intake validation workflow.

**Capabilities:**

- Check required application information
- Detect missing city information
- Detect missing position information
- Validate CV attachments
- Generate email previews requesting missing information
- Support validated application submission

The preview messages are generated in Polish.

**Important:** The current implementation supports email preview generation, but automatic email delivery and live mailbox integration are not yet completed.

### 2.9 Bilingual User Interface

The application supports:

- **Polish (PL)** — Primary business language
- **English (EN)** — Additional interface language

Language switching is implemented across the main recruitment modules, including the dashboard, candidate management, candidate profiles, branch management, reports, and recruitment pipeline.

The selected language is stored locally in the browser.

### 2.10 Demonstration Roles

The dashboard provides a demonstration role selector:

- Administrator
- HR Manager
- Branch Manager

The demonstration includes simulated branch-based visibility to illustrate intended role workflows.

**The role selector is part of the prototype and does not represent authenticated production access control.**

---

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend Framework | Next.js 16 |
| Frontend Language | TypeScript |
| UI Library | React |
| Styling | Tailwind CSS |
| Backend Framework | FastAPI |
| Backend Language | Python |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Data Validation | Pydantic |
| API Architecture | REST API |
| Version Control | Git |
| Repository Hosting | GitHub |

### Architecture Overview

The project follows a frontend–backend architecture.

```text
HR User
   |
   v
Next.js Frontend
   |
   | HTTP / REST API
   v
FastAPI Backend
   |
   +---- PostgreSQL Database
   |
   +---- Candidate CV Storage
   |
   +---- Application Validation
   |
   +---- HR Notes
```

The frontend handles user interaction, while the FastAPI backend manages business logic, application data, and database operations.

---

## 4. Project Structure

```text
seka-recruitment/
|
|-- backend/
|   |-- main.py
|   |-- database.py
|   |-- models.py
|   |-- schemas.py
|   |-- auth.py
|   |-- permissions.py
|   |-- application_validator.py
|   |-- intake.py
|   |-- email_templates.py
|   |-- seed.py
|   `-- ...
|
|-- frontend/
|   |-- app/
|   |   |-- page.tsx
|   |   |-- candidates/
|   |   |   |-- page.tsx
|   |   |   |-- new/
|   |   |   `-- [id]/
|   |   |       |-- page.tsx
|   |   |       |-- CandidateDetailClient.tsx
|   |   |       |-- CVUpload.tsx
|   |   |       |-- StatusSelector.tsx
|   |   |       `-- HRNotes.tsx
|   |   |
|   |   |-- branches/
|   |   |-- pipeline/
|   |   |-- reports/
|   |   `-- globals.css
|   |
|   `-- lib/
|       `-- api.ts
|
|-- docs/
|-- .gitignore
`-- README.md
```

*Note: The HR Notes and Reports additions are part of the latest local development changes and should be committed and pushed to the repository.*

---

## 5. Local Installation

### Prerequisites

Before running the project, install:

- Python
- Node.js and npm
- Git
- Access to a PostgreSQL database

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Selma34568/seka-recruitment.git
cd seka-recruitment
```

### Step 2 — Backend Setup

Open the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate the environment on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install the backend's required Python dependencies according to the project's dependency configuration.

Create a local `backend/.env` file containing your PostgreSQL connection:

```env
DATABASE_URL=your_postgresql_connection_string
SEKA_DEMO_MODE=true
```

**Security:** Enable demo mode only for local testing with fictional candidate records.

Start the backend:

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

Backend address:

`http://127.0.0.1:8001`

FastAPI documentation:

`http://127.0.0.1:8001/docs`

### Step 3 — Frontend Setup

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

Create a local `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001
```

Start the frontend development server:

```bash
npm run dev
```

Open the application:

`http://localhost:3000`

### Step 4 — Verify the Frontend Build

```bash
npm run build
```

The existing frontend demo has previously passed a production build check. Newly added functionality should be checked again before release.

---

## 6. Main Application Pages

| Route | Purpose |
|---|---|
| `/` | HR Dashboard |
| `/candidates` | Candidate Management |
| `/candidates/new` | New Candidate Registration |
| `/candidates/[id]` | Candidate Profile, CV, Status, HR Notes |
| `/branches` | Branch Management |
| `/pipeline` | Recruitment Pipeline |
| `/reports` | Recruitment Reports |

---

## 7. Demonstration Workflow

The following workflow illustrates the main functionality of the application.

1. Open the HR Dashboard.
2. Review candidate and application statistics.
3. Select a demonstration role and branch.
4. Navigate to the Candidates module.
5. Search or filter candidates by city.
6. Register a fictional candidate.
7. Open the candidate profile.
8. Upload a test PDF CV.
9. Change the recruitment status.
10. Add an internal HR note.
11. Open the Recruitment Pipeline.
12. Review statistics in the Reports module.
13. Switch between Polish and English.

The demonstration uses fictional test data.

---

## 8. Authentication and Security

The backend includes initial components for Microsoft Entra ID integration and role-based access control.

However, complete production authentication and authorization are not yet configured.

The local demo includes separate demonstration API endpoints and simulated role selection to illustrate the intended system behavior.

### Important Security Considerations

- Demo mode must not be publicly exposed.
- Real candidate records must not be processed using unauthenticated demo endpoints.
- Microsoft Entra ID authentication must be completed before production use.
- Access to candidate records, HR notes, and CV files must be restricted according to authenticated user roles.
- Branch-level permissions must be enforced server-side.
- CV storage must be protected against unauthorized access.
- Secrets, passwords, local environment files, and uploaded documents must not be committed to the repository.
- Data processing and retention must comply with applicable privacy and GDPR requirements.

**This prototype is intended for local demonstration and development, not unrestricted production use.**

---

## 9. Implementation Status

| Feature | Status |
|---|---|
| HR Dashboard | Implemented |
| Candidate Registration | Implemented |
| Candidate Profiles | Implemented |
| Branch and City Filtering | Implemented |
| PDF CV Management | Implemented in demo |
| Recruitment Status Management | Implemented |
| Recruitment Pipeline | Implemented |
| HR Notes Interface | Implemented locally |
| HR Notes Persistence | Requires final end-to-end verification |
| Recruitment Reports | Implemented locally |
| Polish / English Interface | Implemented |
| Application Intake Validation | Implemented |
| Missing-Information Email Preview | Implemented |
| Demo Role Simulation | Implemented |
| Microsoft Entra ID Production Login | Pending |
| Live Mailbox Integration | Pending |
| Automatic Email Delivery | Pending |
| Full Production Authorization | Pending |
| Production Deployment | Pending |

---

## 10. Future Development

The next phase will focus on preparing the prototype for a production environment.

### Authentication and Permissions

- Complete Microsoft Entra ID Single Sign-On.
- Apply authenticated Administrator, HR Manager, and Branch Manager permissions.
- Enforce branch-specific record access.
- Secure all candidate, application, document, and HR notes endpoints.

### Email Integration

- Connect the company's authorized recruitment mailbox.
- Import incoming applications.
- Extract relevant candidate information.
- Validate missing information.
- Send automatic requests for missing documents or details.
- Maintain application correspondence history.

### HR Workflow Improvements

- Interview scheduling
- Recruitment history and audit trails
- Multi-user HR notes and author attribution
- Improved reporting and analytics
- Candidate duplicate detection
- Configurable recruitment workflows

### Production Infrastructure

- Secure database configuration
- Persistent document storage
- Monitoring and logging
- Automated testing
- Backup and recovery strategy
- Privacy and data retention controls
- Deployment configuration aligned with SEKA's final technical requirements

---

## 11. Project Scope

This repository documents the current Next.js, FastAPI, and PostgreSQL demonstration implementation.

The prototype provides a functional foundation for validating recruitment workflows and collecting feedback.

Any future production implementation may require changes to the architecture, infrastructure, authentication, and integration strategy based on SEKA's final requirements.

---

## 12. Repository

**GitHub:** https://github.com/Selma34568/seka-recruitment

**Project:** SEKA Recruitment Management System

**Current Version:** Functional Local Demonstration

**Last Documentation Update:** October 2026

---

*Developed as a recruitment management proof of concept to support digitalization and improvement of SEKA's HR workflows.*
