
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getCandidates,
  type Candidate,
} from "../../lib/api";

type Language = "PL" | "EN";

const labels = {
  PL: {
    back: "Powrót do panelu głównego",
    title: "Raporty rekrutacyjne",
    subtitle: "Analiza kandydatów i zgłoszeń w oddziałach SEKA.",
    candidates: "Kandydaci",
    applications: "Zgłoszenia",
    interviews: "Rozmowy",
    offers: "Oferty",
    stages: "Zgłoszenia według etapu",
    cities: "Zgłoszenia według miasta",
    loading: "Ładowanie raportów...",
    error: "Nie udało się pobrać danych.",
    empty: "Brak danych.",
    statuses: {
      NEW: "Nowe",
      REVIEW: "Weryfikacja",
      INTERVIEW: "Rozmowa",
      OFFER: "Oferta",
      HIRED: "Zatrudnieni",
      REJECTED: "Odrzuceni",
    },
  },
  EN: {
    back: "Back to Dashboard",
    title: "Recruitment Reports",
    subtitle: "Candidate and application analytics across SEKA branches.",
    candidates: "Candidates",
    applications: "Applications",
    interviews: "Interviews",
    offers: "Offers",
    stages: "Applications by Recruitment Stage",
    cities: "Applications by City",
    loading: "Loading reports...",
    error: "Could not load report data.",
    empty: "No data available.",
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

const stages = [
  "NEW",
  "REVIEW",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;

export default function ReportsPage() {
  const [language, setLanguage] = useState<Language>("PL");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("seka-language");
    if (stored === "PL" || stored === "EN") {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getCandidates()
      .then((data) => {
        if (active) setCandidates(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const t = labels[language];

  const applications = useMemo(
    () => candidates.flatMap((c) => c.applications),
    [candidates]
  );

  const stageCounts = useMemo(
    () =>
      stages.map((status) => ({
        status,
        count: applications.filter((a) => a.status === status).length,
      })),
    [applications]
  );

  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const application of applications) {
      const city = application.branch.city;
      counts[city] = (counts[city] ?? 0) + 1;
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [applications]);

  const maxStage = Math.max(1, ...stageCounts.map((s) => s.count));
  const maxCity = Math.max(1, ...cityCounts.map(([, count]) => count));

  function changeLanguage(value: Language) {
    setLanguage(value);
    localStorage.setItem("seka-language", value);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="font-semibold text-blue-700">
            ← {t.back}
          </Link>

          <select
            aria-label="Language"
            value={language}
            onChange={(e) => changeLanguage(e.target.value as Language)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <option value="PL">Polski</option>
            <option value="EN">English</option>
          </select>
        </div>

        <h1 className="mt-8 text-3xl font-bold">{t.title}</h1>
        <p className="mt-2 text-slate-600">{t.subtitle}</p>

        {loading ? (
          <p className="mt-8">{t.loading}</p>
        ) : error ? (
          <p role="alert" className="mt-8 text-red-600">
            {t.error}
          </p>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t.candidates, value: candidates.length },
                { label: t.applications, value: applications.length },
                {
                  label: t.interviews,
                  value: stageCounts.find((s) => s.status === "INTERVIEW")?.count ?? 0,
                },
                {
                  label: t.offers,
                  value: stageCounts.find((s) => s.status === "OFFER")?.count ?? 0,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-bold">{t.stages}</h2>

                <div className="space-y-5">
                  {stageCounts.map(({ status, count }) => (
                    <div key={status}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{t.statuses[status]}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${(count / maxStage) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-bold">{t.cities}</h2>

                {cityCounts.length === 0 ? (
                  <p className="text-slate-500">{t.empty}</p>
                ) : (
                  <div className="space-y-5">
                    {cityCounts.map(([city, count]) => (
                      <div key={city}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>{city}</span>
                          <strong>{count}</strong>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${(count / maxCity) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
