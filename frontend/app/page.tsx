
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Candidate,
  Branch,
  getCandidates,
  getBranches,
} from "../lib/api";

type DemoRole = "ADMIN" | "HR_MANAGER" | "BRANCH_MANAGER";
type Language = "PL" | "EN";

const translations = {
  PL: {
    dashboard: "Panel główny",
    candidates: "Kandydaci",
    branches: "Oddziały",
    pipeline: "Proces rekrutacji",
    system: "System zarządzania rekrutacją",
    title: "Panel rekrutacyjny",
    subtitle: "Zarządzaj kandydatami i zgłoszeniami rekrutacyjnymi.",
    demoRole: "Wybór roli demonstracyjnej",
    demoWarning:
      "Tryb demonstracyjny — bez rzeczywistego uwierzytelniania.",
    role: "Rola użytkownika",
    assignedBranch: "Przypisany oddział (demo)",
    allBranches: "Wszystkie oddziały",
    viewing: "Widok",
    total: "Łączna liczba kandydatów",
    new: "Nowe zgłoszenia",
    review: "W trakcie analizy",
    interviews: "Rozmowy kwalifikacyjne",
    browse: "Przeglądaj zgłoszenia według miasta.",
    search: "Szukaj kandydatów...",
    allCities: "Wszystkie miasta",
    assignedCity: "Przypisane miasto",
    candidate: "Kandydat",
    position: "Stanowisko",
    city: "Miasto",
    status: "Status",
    applied: "Data zgłoszenia",
    noApplications: "Nie znaleziono zgłoszeń.",
    loading: "Ładowanie kandydatów...",
    apiError: "Nie można połączyć się z API SEKA.",
    branchError: "Nie można pobrać oddziałów.",
    demoVersion: "Wersja demonstracyjna",
    admin: "Administrator",
    hrManager: "Menedżer HR",
    branchManager: "Kierownik oddziału",
    newStatus: "Nowe",
    reviewStatus: "Weryfikacja",
    interviewStatus: "Rozmowa",
    offerStatus: "Oferta",
    hiredStatus: "Zatrudniony",
    rejectedStatus: "Odrzucony",
  },
  EN: {
    dashboard: "Dashboard",
    candidates: "Candidates",
    branches: "Branches",
    pipeline: "Recruitment Pipeline",
    system: "Recruitment Management System",
    title: "HR Dashboard",
    subtitle: "Manage candidates and recruitment applications.",
    demoRole: "Demo Role Selection",
    demoWarning: "Presentation mode only — not authenticated access.",
    role: "User Role",
    assignedBranch: "Assigned Branch (Demo)",
    allBranches: "All Branches",
    viewing: "Viewing",
    total: "Total Candidates",
    new: "New Applications",
    review: "In Review",
    interviews: "Interviews",
    browse: "Browse recruitment applications by city.",
    search: "Search candidates...",
    allCities: "All Cities",
    assignedCity: "Assigned City",
    candidate: "Candidate",
    position: "Position",
    city: "City",
    status: "Status",
    applied: "Applied",
    noApplications: "No applications found.",
    loading: "Loading candidates...",
    apiError: "Could not connect to the SEKA API.",
    branchError: "Could not load branches.",
    demoVersion: "Demo Version",
    admin: "Administrator",
    hrManager: "HR Manager",
    branchManager: "Branch Manager",
    newStatus: "New",
    reviewStatus: "In Review",
    interviewStatus: "Interview",
    offerStatus: "Offer",
    hiredStatus: "Hired",
    rejectedStatus: "Rejected",
  },
};

export default function Home() {
  const [language, setLanguage] = useState<Language>("PL");

  useEffect(() => {
  const savedLanguage = window.localStorage.getItem("seka-language");

  if (savedLanguage === "PL" || savedLanguage === "EN") {
    setLanguage(savedLanguage);
  }
}, []);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [role, setRole] = useState<DemoRole>("ADMIN");
  const [branchId, setBranchId] = useState<number | null>(null);

  const [selectedCity, setSelectedCity] = useState("ALL");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"api" | "branches" | null>(null);

  const t = translations[language];
  const isBranchManager = role === "BRANCH_MANAGER";

  const roleLabels: Record<DemoRole, string> = {
    ADMIN: t.admin,
    HR_MANAGER: t.hrManager,
    BRANCH_MANAGER: t.branchManager,
  };

  // Load branches when the page opens.
  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      try {
        const branchData = await getBranches();

        if (cancelled) return;

        setBranches(branchData);

        if (branchData.length > 0) {
          setBranchId(branchData[0].id);
        }
      } catch {
        if (!cancelled) {
          setError("branches");
        }
      }
    }

    loadBranches();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load demo candidates when role or assigned branch changes.
  useEffect(() => {
    if (isBranchManager && branchId === null) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadCandidates() {
      setLoading(true);
      setError(null);

      try {
        const candidateData = await getCandidates(role, branchId);

        if (!cancelled) {
          setCandidates(candidateData);
        }
      } catch {
        if (!cancelled) {
          setCandidates([]);
          setError("api");
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
  }, [role, branchId, isBranchManager]);

  // Additional UI filtering for demonstration.
  // Real authorization must be enforced by the backend.
  const visibleApplications = useMemo(() => {
    return candidates.flatMap((candidate) =>
      candidate.applications
        .filter(
          (application) =>
            !isBranchManager ||
            (branchId !== null &&
              application.branch.id === branchId)
        )
        .map((application) => ({
          ...application,
          candidate,
        }))
    );
  }, [candidates, isBranchManager, branchId]);

  const stats = useMemo(() => {
    const candidateIds = new Set(
      visibleApplications.map((a) => a.candidate.id)
    );

    return {
      total: candidateIds.size,
      new: visibleApplications.filter(
        (a) => a.status === "NEW"
      ).length,
      review: visibleApplications.filter(
        (a) => a.status === "REVIEW"
      ).length,
      interview: visibleApplications.filter(
        (a) => a.status === "INTERVIEW"
      ).length,
    };
  }, [visibleApplications]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visibleApplications.filter((application) => {
      const candidate = application.candidate;

      const fullName =
        `${candidate.first_name} ${candidate.last_name}`.toLowerCase();

      const matchesSearch =
        fullName.includes(query) ||
        application.position.toLowerCase().includes(query) ||
        candidate.email.toLowerCase().includes(query);

      const matchesCity =
        selectedCity === "ALL" ||
        application.branch.city === selectedCity;

      return matchesSearch && matchesCity;
    });
  }, [visibleApplications, search, selectedCity]);

  const activeBranch = branches.find((b) => b.id === branchId);

  const statusLabels: Record<string, string> = {
    NEW: t.newStatus,
    REVIEW: t.reviewStatus,
    INTERVIEW: t.interviewStatus,
    OFFER: t.offerStatus,
    HIRED: t.hiredStatus,
    REJECTED: t.rejectedStatus,
  };

  const statisticCards = [
    { label: t.total, value: stats.total },
    { label: t.new, value: stats.new },
    { label: t.review, value: stats.review },
    { label: t.interviews, value: stats.interview },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 p-6 text-white md:flex">
          <div className="mb-12">
            <div className="text-2xl font-bold tracking-wide">
              SEKA
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {t.system}
            </p>
          </div>

          <nav className="space-y-3 text-sm">
            <div className="rounded-xl bg-blue-600 px-4 py-3 font-semibold">
              {t.dashboard}
            </div>

            <Link
              href="/candidates"
              className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {t.candidates}
            </Link>

            <Link
              href="/branches"
              className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {t.branches}
            </Link>

            <Link
              href="/pipeline"
              className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {t.pipeline}
            </Link>
          </nav>

          <div className="mt-auto border-t border-slate-800 pt-5">
            <p className="text-sm font-medium">HR Demo</p>

            <p className="text-xs text-slate-400">
              {roleLabels[role]}
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-5 md:p-10">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {t.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {t.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                aria-label="Language"
                value={language}
                onChange={(event) => {
  const nextLanguage = event.target.value as Language;
  setLanguage(nextLanguage);
  window.localStorage.setItem("seka-language", nextLanguage);
}}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
              >
                <option value="PL">🇵🇱 Polski</option>
                <option value="EN">🇬🇧 English</option>
              </select>

              <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm">
                SEKA · HR Demo
              </div>
            </div>
          </header>

          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold">
                {t.demoRole}
              </h2>

              <p className="mt-1 text-xs text-amber-700">
                {t.demoWarning}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t.role}
                </label>

                <select
                  value={role}
                  onChange={(event) => {
                    setRole(event.target.value as DemoRole);
                    setSelectedCity("ALL");
                    setSearch("");
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <option value="ADMIN">
                    {t.admin}
                  </option>

                  <option value="HR_MANAGER">
                    {t.hrManager}
                  </option>

                  <option value="BRANCH_MANAGER">
                    {t.branchManager}
                  </option>
                </select>
              </div>

              {isBranchManager && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {t.assignedBranch}
                  </label>

                  <select
                    value={branchId ?? ""}
                    onChange={(event) => {
                      setBranchId(Number(event.target.value));
                      setSelectedCity("ALL");
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  >
                    {branches.map((branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {t.viewing}:{" "}
                {isBranchManager
                  ? activeBranch?.city ?? t.assignedCity
                  : t.allBranches}
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
              {error === "branches"
                ? t.branchError
                : t.apiError}
            </div>
          )}

          <section className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {statisticCards.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm text-slate-500">
                  {item.label}
                </p>

                <p className="mt-3 text-4xl font-bold">
                  {loading ? "..." : item.value}
                </p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h2 className="text-xl font-bold">
                  {t.candidates}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {t.browse}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder={t.search}
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                />

                <select
                  value={selectedCity}
                  onChange={(event) =>
                    setSelectedCity(event.target.value)
                  }
                  disabled={isBranchManager}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:bg-slate-100"
                >
                  <option value="ALL">
                    {isBranchManager
                      ? activeBranch?.city ?? t.assignedCity
                      : t.allCities}
                  </option>

                  {!isBranchManager &&
                    branches.map((branch) => (
                      <option
                        key={branch.id}
                        value={branch.city}
                      >
                        {branch.city}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      {t.candidate}
                    </th>
                    <th className="px-6 py-4">
                      {t.position}
                    </th>
                    <th className="px-6 py-4">
                      {t.city}
                    </th>
                    <th className="px-6 py-4">
                      {t.status}
                    </th>
                    <th className="px-6 py-4">
                      {t.applied}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.map((application) => (
                    <tr
                      key={application.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/candidates/${application.candidate.id}`}
                          className="font-semibold hover:text-blue-600"
                        >
                          {application.candidate.first_name}{" "}
                          {application.candidate.last_name}
                        </Link>

                        <p className="text-xs text-slate-500">
                          {application.candidate.email}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {application.position}
                      </td>

                      <td className="px-6 py-4">
                        {application.branch.city}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {statusLabels[application.status] ??
                            application.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {application.applied_at.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading &&
                filteredApplications.length === 0 && (
                  <p className="p-8 text-center text-sm text-slate-500">
                    {t.noApplications}
                  </p>
                )}

              {loading && (
                <p className="p-8 text-center text-sm text-slate-500">
                  {t.loading}
                </p>
              )}
            </div>
          </section>

          <footer className="mt-8 text-center text-xs text-slate-400">
            SEKA Recruitment Management System · {t.demoVersion}
          </footer>
        </main>
      </div>
    </div>
  );
}
