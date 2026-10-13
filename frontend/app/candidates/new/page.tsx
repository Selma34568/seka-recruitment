
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createCandidate,
  getBranches,
  type Branch,
} from "../../../lib/api";

export default function NewCandidatePage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    branch_id: "",
  });

  useEffect(() => {
    getBranches()
      .then(setBranches)
      .catch(() => setError("Could not load branches."))
      .finally(() => setLoadingBranches(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      if (!form.branch_id) {
        throw new Error("Please select a branch.");
      }

      const candidate = await createCandidate({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        position: form.position.trim(),
        branch_id: Number(form.branch_id),
      });

      router.push(`/candidates/${candidate.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create candidate."
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">Add New Candidate</h1>
          <p className="mt-2 text-sm text-slate-500">
            Create a new recruitment application for SEKA.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { name: "first_name", label: "First Name" },
                { name: "last_name", label: "Last Name" },
              ].map((field) => (
                <label key={field.name} className="block text-sm font-medium">
                  {field.label}
                  <input
                    required
                    maxLength={100}
                    value={form[field.name as "first_name" | "last_name"]}
                    onChange={(e) =>
                      setForm({ ...form, [field.name]: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </label>
              ))}
            </div>

            <label className="block text-sm font-medium">
              Email Address
              <input
                required
                type="email"
                maxLength={255}
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block text-sm font-medium">
              Phone (optional)
              <input
                type="tel"
                maxLength={50}
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block text-sm font-medium">
              Position
              <input
                required
                maxLength={150}
                placeholder="e.g. Environmental Engineer"
                value={form.position}
                onChange={(e) =>
                  setForm({ ...form, position: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block text-sm font-medium">
              Branch / City
              <select
                required
                value={form.branch_id}
                onChange={(e) =>
                  setForm({ ...form, branch_id: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} — {branch.city}
                  </option>
                ))}
              </select>
              {loadingBranches && (
                <span className="mt-1 block text-xs text-slate-500">
                  Loading branches...
                </span>
              )}
            </label>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || loadingBranches || branches.length === 0}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Candidate"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
