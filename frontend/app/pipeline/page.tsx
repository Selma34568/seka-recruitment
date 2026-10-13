
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getCandidates,
  getBranches,
  type Candidate,
  type Branch,
} from "../../lib/api";

const statuses = [
  "NEW",
  "REVIEW",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  REVIEW: "bg-amber-100 text-amber-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  OFFER: "bg-cyan-100 text-cyan-700",
  HIRED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [city, setCity] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [candidateData, branchData] = await Promise.all([
          getCandidates(),
          getBranches(),
        ]);

        setCandidates(candidateData);
        setBranches(branchData);
      } catch {
        setError("Could not load recruitment data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const applications = useMemo(
    () =>
      candidates.flatMap((candidate) =>
        candidate.applications.map((application) => ({
          ...application,
          candidate,
        }))
      ),
    [candidates]
  );

  const filtered = useMemo(
    () =>
      applications.filter((application) => {
        const name =
          `${application.candidate.first_name} ${application.candidate.last_name}`
            .toLowerCase();

        const query = search.trim().toLowerCase();

        const matchesSearch =
          name.includes(query) ||
          application.position.toLowerCase().includes(query);

        const matchesCity =
          city === "ALL" || application.branch.city === city;

        return matchesSearch && matchesCity;
      }),
    [applications, city, search]
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-5 text-3xl font-bold">
              Recruitment Pipeline
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Track applications across recruitment stages.
            </p>
          </div>

          <Link
            href="/candidates/new"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Candidate
          </Link>
        </div>

        <div className="mb-7 flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Search candidates..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-64 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value="ALL">All Cities</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.city}>
                {branch.city}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-lg bg-white px-4 py-3 text-sm text-slate-600">
            {filtered.length} applications
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-10 text-center text-slate-500">
            Loading recruitment pipeline...
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {statuses.map((status) => {
              const items = filtered.filter(
                (application) => application.status === status
              );

              return (
                <section
                  key={status}
                  className="min-h-80 rounded-2xl border border-slate-200 bg-slate-100 p-4"
                >
                  <div className="mb-5 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[status]}`}
                    >
                      {status}
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map((application) => (
                      <Link
                        key={application.id}
                        href={`/candidates/${application.candidate.id}`}
                        className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                      >
                        <p className="font-semibold text-slate-900">
                          {application.candidate.first_name}{" "}
                          {application.candidate.last_name}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {application.position}
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-xs font-medium text-slate-600">
                            {application.branch.city}
                          </span>

                          <span className="text-xs text-slate-400">
                            #{application.id}
                          </span>
                        </div>
                      </Link>
                    ))}

                    {items.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-5 text-center text-xs text-slate-400">
                        No applications
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          SEKA Recruitment Management System · Demo
        </p>
      </div>
    </main>
  );
}
