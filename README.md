
# SEKA Recruitment Management System

A web-based recruitment management system developed as a demo project for SEKA.

The application helps HR teams organize job applications, manage candidate profiles, and track recruitment progress across multiple company branches.

## Project Overview

SEKA operates across multiple cities and receives job applications for different positions.

This project aims to simplify the recruitment process by providing a centralized platform for HR personnel.

The initial demo focuses on supporting the HR coordinator with candidate management, application tracking, and branch-based organization.

## Features

### HR Dashboard
- Overview of total candidates
- Recruitment status statistics
- Search candidates
- Filter applications by city

### Candidate Management
- Create new candidate profiles
- View candidate information
- Track job applications
- Update recruitment status
- Search and filter candidates

### Recruitment Pipeline
- Visual overview of recruitment stages
- NEW
- REVIEW
- INTERVIEW
- OFFER
- HIRED
- REJECTED

### Branch Management
- View company branches
- Track applications by branch
- Filter candidates by city

### CV Management
- Upload candidate CVs in PDF format
- View uploaded documents
- Extract text from PDF documents

## Technology Stack

### Backend
- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- pypdf

### Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS

### Development Tools
- Visual Studio Code
- Git
- GitHub

## Project Structure

```text
seka-recruitment/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── seed.py
│   └── ...
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── candidates/
│   │   ├── branches/
│   │   └── pipeline/
│   └── lib/
│       └── api.ts
├── docs/
└── README.md
```

## Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Selma34568/seka-recruitment.git
cd seka-recruitment
```

### 2. Configure the backend

Create a Python virtual environment and install the backend dependencies.

Configure the PostgreSQL connection in `backend/.env`.

Start the FastAPI server:

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Backend API documentation:

http://127.0.0.1:8000/docs

### 3. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Open:

http://localhost:3000

## Current Project Status

The initial demonstration version includes:

- Functional HR dashboard
- Candidate registration and profile management
- Application status updates
- Recruitment pipeline
- Branch overview and city filtering
- PDF CV upload and text extraction
- Frontend production build verification

## Planned Improvements

The following integrations are planned for future development:

- Microsoft Azure / Entra ID Single Sign-On
- Automatic processing of applications received by email
- Automatic extraction of candidate information from CVs
- Role-based access for HR and branch managers
- Deployment for remote demonstration and testing

## Project Purpose

This demo was developed to support discussions with SEKA stakeholders, collect feedback, and identify requirements for the production version.

It is a proof of concept and is not intended for handling real candidate data without additional security and privacy safeguards.

## Repository

https://github.com/Selma34568/seka-recruitment
