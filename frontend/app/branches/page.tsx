
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getBranches,
  getCandidates,
  type Branch,
  type Candidate,
} from "../../lib/api";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getBranches(), getCandidates()])
      .then(([branchData, candidateData]) => {
        setBranches(branchData);
        setCandidates(candidateData);
      })
      .catch(() => setError("Failed to load branches."))
      .finally(() => setLoading(false));
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
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="font-medium text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-8">
          <h1 className="text-3xl font-bold">
            SEKA Branches
          </h1>
          <p className="mt-2 text-slate-600">
            Overview of recruitment activity across company locations.
          </p>
        </div>

        {loading ? (
          <p className="mt-8">Loading branches...</p>
        ) : error ? (
          <p className="mt-8 text-red-600">{error}</p>
        ) : (
          <>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="text-sm font-semibold text-blue-600">
                    SEKA Branch
                  </span>

                  <h2 className="mt-4 text-xl font-bold">
                    {branch.name}
                  </h2>

                  <p className="mt-1 text-slate-600">
                    {branch.city}
                  </p>

                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <p className="text-sm text-slate-500">
                      Recruitment Applications
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {counts[branch.id] || 0}
                    </p>
                  </div>

                  <Link
                    href={`/candidates?city=${encodeURIComponent(branch.city)}`}
                    className="mt-5 inline-block font-semibold text-blue-600 hover:underline"
                  >
                    View Candidates →
                  </Link>
                </div>
              ))}
            </div>

            {branches.length === 0 && (
              <p className="mt-8 text-slate-500">
                No branches found.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
