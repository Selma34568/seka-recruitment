# SEKA Recruitment Management System

A bilingual recruitment management platform designed to organize spontaneous job applications, manage candidates across multiple branches, and track recruitment activities.

**GitHub:** https://github.com/Selma34568/seka-recruitment

## Technology Stack

- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** PostgreSQL (Neon)
- **Authentication:** Microsoft Entra ID integration infrastructure
- **Email:** Demo mailbox and Microsoft Graph integration preparation

## Main Features

### 1. Administrator Roles and Permissions

- System Administrator and Administrator role structures.
- Custom recruitment roles and permissions.
- Branch-based access restrictions.
- Microsoft Entra ID authentication infrastructure.

### 2. Centralized Email Communication

- Shared mailbox concept using `kariera@seka.pl`.
- Candidate email conversation interface.
- Simulated outgoing and incoming messages for local demonstrations.
- Email history associated with candidate profiles.
- Microsoft Graph email sending endpoint.
- Authentication protection for the email sending endpoint.

**Current limitation:** Real Microsoft 365 mailbox access has not yet been authorized or tested. Demo messages do not send actual emails. Automatic mailbox synchronization is not implemented.

### 3. Multiple Applications per Candidate

- Candidate identification and matching by normalized email address.
- Multiple job applications linked to a single candidate profile.
- Independent positions, branches, statuses, and application records.
- Application-level CV reference support.

Existing duplicate candidate records are not automatically merged.

### 4. Custom Recruitment Roles

- Configurable recruitment roles.
- Permission-management backend infrastructure.
- Support for branch-specific access scopes.

### 5. Custom Application Statuses

- Configurable recruitment statuses.
- Application status updates.
- Recruitment pipeline management.

### 6. Detailed Application History

- Application creation events.
- Recruitment status changes.
- HR notes and associated history.
- CV upload event tracking.
- Demo email activity records.
- History display and event filtering.

Historical actions recorded before the audit feature was introduced cannot be reconstructed automatically.

## Additional Features

- HR dashboard with recruitment statistics.
- Candidate search and city filtering.
- Candidate profile and application management.
- PDF CV upload and viewing.
- Branch management.
- Polish and English interface support.
- Application intake validation.
- Missing-information email preview.
- Local demonstration mode.

## Project Structure

```text
seka-recruitment/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── auth.py
│   ├── intake.py
│   ├── seka_features.py
│   ├── graph_mail.py
│   ├── admin_routes.py
│   ├── migrations/
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── lib/
│   └── package.json
├── docs/
├── .gitignore
└── README.md
```

## Local Installation

### Backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```cmd
.venv\Scripts\activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Configure `backend/.env` with the appropriate database connection and local settings.

For local demonstration only:

```env
SEKA_DEMO_MODE=true
SEKA_REAL_EMAIL_ENABLED=false
```

Start the backend:

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001 --env-file .env
```

API documentation:

http://127.0.0.1:8001/docs

**Database setup:** The PostgreSQL schema must be initialized and the required migrations applied before using new features. Back up the database and review migration scripts before applying changes.

### Frontend

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

http://localhost:3000

## Testing and Verification

The following checks have been performed during development:

- Python syntax compilation passed.
- Standalone backend feature checks passed.
- Database migration statements executed successfully in Neon.
- Multiple applications per candidate were demonstrated.
- Application history and simulated email messages were displayed.
- FastAPI registered the Microsoft Graph email sending endpoint.
- An unauthenticated email sending request returned HTTP 401.

Additional production integration and security testing are required.

## Security and Deployment Notes

- Demo endpoints are intended for local testing only.
- Demo role selection is not real authentication.
- Never expose local demo endpoints publicly.
- Do not commit `.env`, `.env.local`, credentials, or candidate CV files.
- Real email sending requires Microsoft 365 authorization and appropriate Microsoft Graph permissions.
- Microsoft Entra ID authentication requires live integration testing.
- Production deployment and end-to-end security verification are not yet complete.

## Current Project Status

**Local demonstration:** Main recruitment functionality implemented and key workflows tested.

**Pending external integration:** Real Microsoft 365 email sending/receiving, automatic incoming-mail processing, live Microsoft Entra ID authorization, and final deployment/security verification.

The project is suitable for demonstrating its implemented recruitment workflows, but it should not yet be considered production-ready.

## Repository

https://github.com/Selma34568/seka-recruitment
