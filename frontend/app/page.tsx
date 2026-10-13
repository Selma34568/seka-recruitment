
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Candidate,
  Branch,
  getCandidates,
  getBranches,
} from "../lib/api";

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCity, setSelectedCity] = useState("ALL");
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
        setError("Could not connect to the SEKA API.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const applications = candidates.flatMap((candidate) =>
    candidate.applications.map((application) => ({
      ...application,
      candidate,
    }))
  );

  const stats = {
    total: candidates.length,
    new: applications.filter((a) => a.status === "NEW").length,
    review: applications.filter((a) => a.status === "REVIEW").length,
    interview: applications.filter((a) => a.status === "INTERVIEW")
      .length,
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const candidate = application.candidate;

      const fullName =
        `${candidate.first_name} ${candidate.last_name}`.toLowerCase();

      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        application.position.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase());

      const matchesCity =
        selectedCity === "ALL" ||
        application.branch.city === selectedCity;

      return matchesSearch && matchesCity;
    });
  }, [applications, search, selectedCity]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col bg-slate-950 p-6 text-white md:flex">
          <div className="mb-12">
            <div className="text-2xl font-bold tracking-wide">SEKA</div>
            <p className="mt-1 text-xs text-slate-400">
              Recruitment Management
            </p>
          </div>

          <nav className="space-y-3 text-sm">
            <div className="rounded-xl bg-blue-600 px-4 py-3 font-semibold">
              Dashboard
            </div>
            
<Link
  href="/candidates"
  className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
>
  Candidates
</Link>

            
<Link
  href="/branches"
  className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
>
  Branches
</Link>

            
          <Link
            href="/pipeline"
            className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Recruitment Pipeline
          </Link>

          </nav>

          <div className="mt-auto border-t border-slate-800 pt-5">
            <p className="text-sm font-medium">HR Demo</p>
            <p className="text-xs text-slate-400">Agnieszka · Administrator</p>
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-10">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">HR Dashboard</h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage candidates and recruitment applications.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm">
              SEKA · HR Demo
            </div>
          </header>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <section className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Candidates", value: stats.total },
              { label: "New Applications", value: stats.new },
              { label: "In Review", value: stats.review },
              { label: "Interviews", value: stats.interview },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-3 text-4xl font-bold">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h2 className="text-xl font-bold">Candidates</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Browse recruitment applications by city.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                />

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                >
                  <option value="ALL">All Cities</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.city}>
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
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Position</th>
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Applied</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.map((application) => (
                    <tr
                      key={application.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold">
                          {application.candidate.first_name}{" "}
                          {application.candidate.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {application.candidate.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">{application.position}</td>
                      <td className="px-6 py-4">
                        {application.branch.city}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {application.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {application.applied_at.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredApplications.length === 0 && (
                <p className="p-8 text-center text-sm text-slate-500">
                  No applications found.
                </p>
              )}

              {loading && (
                <p className="p-8 text-center text-sm text-slate-500">
                  Loading candidates...
                </p>
              )}
            </div>
          </section>

          <footer className="mt-8 text-center text-xs text-slate-400">
            SEKA Recruitment Management System · Demo Version
          </footer>
        </main>
      </div>
    </div>
  );
}
