
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getCandidates, type Candidate } from "../../lib/api";

type Language = "PL" | "EN";

const translations = {
  PL: {
    back: "Powrót do panelu głównego",
    title: "Kandydaci",
    description: "Zarządzaj zgłoszeniami rekrutacyjnymi we wszystkich oddziałach SEKA.",
    add: "+ Dodaj kandydata",
    search: "Szukaj kandydatów...",
    allCities: "Wszystkie miasta",
    candidate: "Kandydat",
    position: "Stanowisko",
    city: "Miasto",
    status: "Status",
    action: "Akcja",
    profile: "Zobacz profil",
    loading: "Ładowanie kandydatów...",
    error: "Nie udało się pobrać kandydatów.",
    empty: "Nie znaleziono kandydatów.",
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
    title: "Candidates",
    description: "Manage recruitment applications across SEKA branches.",
    add: "+ Add Candidate",
    search: "Search candidates...",
    allCities: "All Cities",
    candidate: "Candidate",
    position: "Position",
    city: "City",
    status: "Status",
    action: "Action",
    profile: "View Profile",
    loading: "Loading candidates...",
    error: "Failed to load candidates.",
    empty: "No candidates found.",
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

function CandidatesContent() {
  const searchParams = useSearchParams();
  const cityFromUrl = searchParams.get("city");

  const [language, setLanguage] = useState<Language>("PL");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState(cityFromUrl || "ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("seka-language");
    if (savedLanguage === "PL" || savedLanguage === "EN") {
      setLanguage(savedLanguage);
    }
  }, []);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("seka-language", nextLanguage);
  }

  useEffect(() => {
    setCity(cityFromUrl || "ALL");
  }, [cityFromUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadCandidates() {
      try {
        const data = await getCandidates();
        if (!cancelled) {
          setCandidates(data);
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

    loadCandidates();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    return candidates.flatMap((candidate) =>
      candidate.applications.map((application) => ({
        candidate,
        application,
      }))
    );
  }, [candidates]);

  const cities = useMemo(() => {
    return [
      ...new Set(
        rows.map(({ application }) => application.branch.city)
      ),
    ].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter(({ candidate, application }) => {
      const name =
        `${candidate.first_name} ${candidate.last_name}`.toLowerCase();

      const matchesSearch =
        name.includes(query) ||
        candidate.email.toLowerCase().includes(query) ||
        application.position.toLowerCase().includes(query);

      const matchesCity =
        city === "ALL" || application.branch.city === city;

      return matchesSearch && matchesCity;
    });
  }, [rows, search, city]);

  function translateStatus(status: string) {
    const statuses: Record<string, string> = t.statuses;
    return statuses[status] ?? status;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="font-medium text-blue-600 hover:underline">
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

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {t.title}
            </h1>
            <p className="mt-2 text-slate-500">
              {t.description}
            </p>
          </div>

          <Link
            href="/candidates/new"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {t.add}
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.search}
              className="min-w-60 flex-1 rounded-lg border border-slate-200 px-4 py-3"
            />

            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="rounded-lg border border-slate-200 px-4 py-3"
            >
              <option value="ALL">{t.allCities}</option>
              {cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="mt-6">{t.loading}</p>
          ) : error ? (
            <p className="mt-6 text-red-600">{t.error}</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4">{t.candidate}</th>
                    <th className="p-4">{t.position}</th>
                    <th className="p-4">{t.city}</th>
                    <th className="p-4">{t.status}</th>
                    <th className="p-4">{t.action}</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map(({ candidate, application }) => (
                    <tr
                      key={application.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <div className="font-semibold">
                          {candidate.first_name} {candidate.last_name}
                        </div>
                        <div className="text-slate-500">
                          {candidate.email}
                        </div>
                      </td>

                      <td className="p-4">
                        {application.position}
                      </td>

                      <td className="p-4">
                        {application.branch.city}
                      </td>

                      <td className="p-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                          {translateStatus(application.status)}
                        </span>
                      </td>

                      <td className="p-4">
                        <Link
                          href={`/candidates/${candidate.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {t.profile} →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <p className="p-6 text-center text-slate-500">
                  {t.empty}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-10 text-slate-900">
          Ładowanie kandydatów...
        </main>
      }
    >
      <CandidatesContent />
    </Suspense>
  );
}
