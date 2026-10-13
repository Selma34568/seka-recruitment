
"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  getCandidates,
  type Candidate,
} from "../../lib/api";

function CandidatesContent() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
const cityFromUrl = searchParams.get("city");

const [city, setCity] = useState(cityFromUrl || "ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCandidates()
      .then(setCandidates)
      .catch(() => setError("Failed to load candidates."))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    return candidates.flatMap((candidate) =>
      candidate.applications.map((application) => ({
        candidate,
        application,
      }))
    );
  }, [candidates]);

  const cities = [...new Set(rows.map(
    ({ application }) => application.branch.city
  ))].sort();

  const filtered = rows.filter(({ candidate, application }) => {
    const name =
      `${candidate.first_name} ${candidate.last_name}`.toLowerCase();

    const query = search.toLowerCase();

    const matchesSearch =
      name.includes(query) ||
      candidate.email.toLowerCase().includes(query) ||
      application.position.toLowerCase().includes(query);

    return matchesSearch &&
      (city === "ALL" || application.branch.city === city);
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="font-medium text-blue-600">
          ← Back to Dashboard
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Candidates
            </h1>
            <p className="mt-2 text-slate-500">
              Manage recruitment applications across SEKA branches.
            </p>
          </div>

          <Link
            href="/candidates/new"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            + Add Candidate
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="min-w-60 flex-1 rounded-lg border border-slate-200 px-4 py-3"
            />

            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-slate-200 px-4 py-3"
            >
              <option value="ALL">All Cities</option>
              {cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="mt-6">Loading candidates...</p>
          ) : error ? (
            <p className="mt-6 text-red-600">{error}</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Position</th>
                    <th className="p-4">City</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ candidate, application }) => (
                    <tr
                      key={application.id}
                      className="border-t border-slate-100"
                    >
                      <td className="p-4">
                        <div className="font-semibold">
                          {candidate.first_name} {candidate.last_name}
                        </div>
                        <div className="text-slate-500">
                          {candidate.email}
                        </div>
                      </td>
                      <td className="p-4">{application.position}</td>
                      <td className="p-4">{application.branch.city}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                          {application.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/candidates/${candidate.id}`}
                          className="font-medium text-blue-600"
                        >
                          View Profile →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <p className="p-6 text-center text-slate-500">
                  No candidates found.
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
          Loading candidates...
        </main>
      }
    >
      <CandidatesContent />
    </Suspense>
  );
}

