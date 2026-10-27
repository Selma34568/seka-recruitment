
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CVUpload from "./CVUpload";
import StatusSelector from "./StatusSelector";
import HRNotes from "./HRNotes";
import ApplicationHistory from "./ApplicationHistory";
import EmailThread from "./EmailThread";
import type { Candidate } from "../../../lib/api";

type Language = "PL" | "EN";

type Props = {
  candidate: Candidate;
};

const translations = {
  PL: {
    back: "Powrót do panelu głównego",
    candidateId: "ID kandydata",
    personal: "Dane osobowe",
    email: "Adres e-mail",
    phone: "Telefon",
    registered: "Data rejestracji",
    noPhone: "Nie podano",
    noCV: "Nie przesłano CV",
    applications: "Zgłoszenia rekrutacyjne",
    branch: "Oddział",
    city: "Miasto",
    applied: "Data zgłoszenia",
    noApplications: "Nie znaleziono zgłoszeń.",
    demo: "Wersja demonstracyjna",
    statuses: {
      NEW: "Nowe",
      REVIEW: "Weryfikacja",
      INTERVIEW: "Rozmowa",
      OFFER: "Oferta",
      HIRED: "Zatrudniony",
      REJECTED: "Odrzucony",
    },
  },
  EN: {
    back: "Back to Dashboard",
    candidateId: "Candidate ID",
    personal: "Personal Information",
    email: "Email",
    phone: "Phone",
    registered: "Registered",
    noPhone: "Not provided",
    noCV: "No CV uploaded",
    applications: "Recruitment Applications",
    branch: "Branch",
    city: "City",
    applied: "Applied",
    noApplications: "No applications found.",
    demo: "Demo Version",
    statuses: {
      NEW: "New",
      REVIEW: "In Review",
      INTERVIEW: "Interview",
      OFFER: "Offer",
      HIRED: "Hired",
      REJECTED: "Rejected",
    },
  },
};

export default function CandidateDetailClient({
  candidate,
}: Props) {
  const [language, setLanguage] = useState<Language>("PL");

  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem("seka-language");

    if (savedLanguage === "PL" || savedLanguage === "EN") {
      setLanguage(savedLanguage);
    }
  }, []);

  function changeLanguage(nextLanguage: Language) {
  setLanguage(nextLanguage);
  window.localStorage.setItem("seka-language", nextLanguage);
  window.dispatchEvent(new Event("seka-language-change"));
}

  const t = translations[language];

  const fullName =
    `${candidate.first_name} ${candidate.last_name}`;

  function translateStatus(status: string) {
    const labels: Record<string, string> = t.statuses;
    return labels[status] ?? status;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← {t.back}
          </Link>

          <select
            aria-label="Language"
            value={language}
            onChange={(event) =>
              changeLanguage(event.target.value as Language)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <option value="PL">🇵🇱 Polski</option>
            <option value="EN">🇬🇧 English</option>
          </select>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              {candidate.first_name[0]}
              {candidate.last_name[0]}
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                {fullName}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {t.candidateId}: {candidate.id}
              </p>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="mb-5 text-xl font-bold">
              {t.personal}
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">
                  {t.email}
                </p>
                <p className="mt-1 font-medium">
                  {candidate.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  {t.phone}
                </p>
                <p className="mt-1 font-medium">
                  {candidate.phone || t.noPhone}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  {t.registered}
                </p>
                <p className="mt-1 font-medium">
                  {candidate.created_at.slice(0, 10)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  CV
                </p>
                <p className="mt-1 break-all font-medium">
                  {candidate.cv_filename || t.noCV}
                </p>
              </div>
            </div>
          </section>

          <CVUpload
            candidateId={candidate.id}
            hasCV={Boolean(candidate.cv_filename)}
          />

          <section className="mt-10">
            <h2 className="mb-5 text-xl font-bold">
              {t.applications}
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
                      {translateStatus(application.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-slate-500">
                        {t.branch}:{" "}
                      </span>
                      {application.branch.name}
                    </p>

                    <p>
                      <span className="text-slate-500">
                        {t.city}:{" "}
                      </span>
                      {application.branch.city}
                    </p>

                    <p>
                      <span className="text-slate-500">
                        {t.applied}:{" "}
                      </span>
                      {application.applied_at.slice(0, 10)}
                    </p>
                  </div>

                  <StatusSelector
                    applicationId={application.id}
                    currentStatus={application.status}
                  />
                  <HRNotes
  applicationId={application.id}
  initialNotes={application.notes}
/>
                  <ApplicationHistory candidateId={candidate.id} applicationId={application.id}/>
                  <EmailThread candidateId={candidate.id} applicationId={application.id}/>
                </div>
              ))}

              {candidate.applications.length === 0 && (
                <p className="text-sm text-slate-500">
                  {t.noApplications}
                </p>
              )}
            </div>
          </section>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          SEKA Recruitment Management · {t.demo}
        </p>
      </div>
    </main>
  );
}
