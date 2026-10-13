

import CVUpload from "./CVUpload";
import StatusSelector from "./StatusSelector";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Candidate, API_URL } from "../../../lib/api";


type PageProps = {
  params: Promise<{ id: string }>;
};

async function getCandidate(id: string): Promise<Candidate | null> {
  const response = await fetch(
    `${API_URL}/candidates/${encodeURIComponent(id)}`,
    { cache: "no-store" }
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error("Failed to load candidate");
  }

  return response.json();
}

export default async function CandidateDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  const candidate = await getCandidate(id);

  if (!candidate) {
    notFound();
  }

  const fullName =
    `${candidate.first_name} ${candidate.last_name}`;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              {candidate.first_name[0]}
              {candidate.last_name[0]}
            </div>

            <div>
              <h1 className="text-3xl font-bold">{fullName}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Candidate ID: {candidate.id}
              </p>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="mb-5 text-xl font-bold">
              Personal Information
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-1 font-medium">{candidate.email}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="mt-1 font-medium">
                  {candidate.phone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Registered</p>
                <p className="mt-1 font-medium">
                  {candidate.created_at.slice(0, 10)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">CV</p>
                <p className="mt-1 font-medium">
                  {candidate.cv_filename || "No CV uploaded"}
                </p>
              </div>
            </div>
          </div>

          <CVUpload
  candidateId={candidate.id}
  hasCV={Boolean(candidate.cv_filename)}
/>
          <div className="mt-10">
            <h2 className="mb-5 text-xl font-bold">
              Recruitment Applications
            </h2>

            <div className="space-y-4">
              {candidate.applications.map((application) => (
                <div
                  key={application.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">
                      {application.position}
                    </h3>

                    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
                      {application.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    
                    <p>
                      <span className="text-slate-500">Branch: </span>
                      {application.branch.name}
                    </p>
                    <p>
                      <span className="text-slate-500">City: </span>
                      {application.branch.city}
                    </p>
                    <p>
                      <span className="text-slate-500">Applied: </span>
                      {application.applied_at.slice(0, 10)}
                    </p>
                  </div>
                  <StatusSelector
                    applicationId={application.id}
                    currentStatus={application.status}
                  />
                </div>
              ))}

              {candidate.applications.length === 0 && (
                <p className="text-sm text-slate-500">
                  No applications found.
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          SEKA Recruitment Management · Demo
        </p>
      </div>
    </main>
  );
}
