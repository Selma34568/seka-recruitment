
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getBranches,
  getCandidates,
  type Branch,
  type Candidate,
} from "../../lib/api";

type Language = "PL" | "EN";

const translations = {
  PL: {
    back: "Powrót do panelu głównego",
    title: "Oddziały SEKA",
    description:
      "Przegląd działalności rekrutacyjnej we wszystkich oddziałach firmy.",
    branch: "Oddział SEKA",
    applications: "Zgłoszenia rekrutacyjne",
    view: "Zobacz kandydatów",
    loading: "Ładowanie oddziałów...",
    error: "Nie udało się pobrać danych oddziałów.",
    empty: "Nie znaleziono oddziałów.",
  },
  EN: {
    back: "Back to Dashboard",
    title: "SEKA Branches",
    description:
      "Overview of recruitment activity across company locations.",
    branch: "SEKA Branch",
    applications: "Recruitment Applications",
    view: "View Candidates",
    loading: "Loading branches...",
    error: "Failed to load branches.",
    empty: "No branches found.",
  },
};

export default function BranchesPage() {
  const [language, setLanguage] = useState<Language>("PL");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem("seka-language");

    if (savedLanguage === "PL" || savedLanguage === "EN") {
      setLanguage(savedLanguage);
    }
  }, []);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(
      "seka-language",
      nextLanguage
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [branchData, candidateData] = await Promise.all([
          getBranches(),
          getCandidates(),
        ]);

        if (!cancelled) {
          setBranches(branchData);
          setCandidates(candidateData);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const result: Record<number, number> = {};

    for (const candidate of candidates) {
      for (const application of candidate.applications) {
        const id = application.branch.id;
        result[id] = (result[id] || 0) + 1;
      }
    }

    return result;
  }, [candidates]);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="font-medium text-blue-600 hover:underline"
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

        <div className="mt-8">
          <h1 className="text-3xl font-bold">
            {t.title}
          </h1>

          <p className="mt-2 text-slate-600">
            {t.description}
          </p>
        </div>

        {loading ? (
          <p className="mt-8">{t.loading}</p>
        ) : error ? (
          <p
            role="alert"
            className="mt-8 text-red-600"
          >
            {t.error}
          </p>
        ) : (
          <>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="text-sm font-semibold text-blue-600">
                    {t.branch}
                  </span>

                  <h2 className="mt-4 text-xl font-bold">
                    {branch.name}
                  </h2>

                  <p className="mt-1 text-slate-600">
                    {branch.city}
                  </p>

                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <p className="text-sm text-slate-500">
                      {t.applications}
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {counts[branch.id] || 0}
                    </p>
                  </div>

                  <Link
                    href={`/candidates?city=${encodeURIComponent(
                      branch.city
                    )}`}
                    className="mt-5 inline-block font-semibold text-blue-600 hover:underline"
                  >
                    {t.view} →
                  </Link>
                </div>
              ))}
            </div>

            {branches.length === 0 && (
              <p className="mt-8 text-slate-500">
                {t.empty}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
