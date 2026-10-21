
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createCandidate,
  getBranches,
  type Branch,
} from "../../../lib/api";

type Language = "PL" | "EN";

const translations = {
  PL: {
    back: "Powrót do panelu głównego",
    title: "Dodaj nowego kandydata",
    subtitle: "Utwórz nowe zgłoszenie rekrutacyjne dla SEKA.",
    firstName: "Imię",
    lastName: "Nazwisko",
    email: "Adres e-mail",
    phone: "Telefon (opcjonalnie)",
    position: "Stanowisko",
    positionPlaceholder: "np. Inżynier środowiska",
    branch: "Oddział / Miasto",
    selectBranch: "Wybierz oddział",
    loadingBranches: "Ładowanie oddziałów...",
    branchesError: "Nie można pobrać oddziałów.",
    branchRequired: "Wybierz oddział.",
    createError: "Nie udało się dodać kandydata.",
    create: "Dodaj kandydata",
    creating: "Dodawanie...",
  },
  EN: {
    back: "Back to Dashboard",
    title: "Add New Candidate",
    subtitle: "Create a new recruitment application for SEKA.",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    phone: "Phone (optional)",
    position: "Position",
    positionPlaceholder: "e.g. Environmental Engineer",
    branch: "Branch / City",
    selectBranch: "Select a branch",
    loadingBranches: "Loading branches...",
    branchesError: "Could not load branches.",
    branchRequired: "Please select a branch.",
    createError: "Could not create candidate.",
    create: "Create Candidate",
    creating: "Creating...",
  },
};

export default function NewCandidatePage() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("PL");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [error, setError] = useState("");
  const [branchesFailed, setBranchesFailed] = useState(false);

  const t = translations[language];

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    branch_id: "",
  });

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
  }

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      try {
        const data = await getBranches();

        if (!cancelled) {
          setBranches(data);
        }
      } catch {
        if (!cancelled) {
          setBranchesFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingBranches(false);
        }
      }
    }

    loadBranches();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      if (!form.branch_id) {
        throw new Error(t.branchRequired);
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
        err instanceof Error
          ? err.message
          : t.createError
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
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
              changeLanguage(
                event.target.value as Language
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <option value="PL">🇵🇱 Polski</option>
            <option value="EN">🇬🇧 English</option>
          </select>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">
            {t.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {t.subtitle}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                {t.firstName}

                <input
                  required
                  maxLength={100}
                  value={form.first_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      first_name: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>

              <label className="block text-sm font-medium">
                {t.lastName}

                <input
                  required
                  maxLength={100}
                  value={form.last_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      last_name: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <label className="block text-sm font-medium">
              {t.email}

              <input
                required
                type="email"
                maxLength={255}
                value={form.email}
                onChange={(event) =>
                  setForm({
                    ...form,
                    email: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block text-sm font-medium">
              {t.phone}

              <input
                type="tel"
                maxLength={50}
                value={form.phone}
                onChange={(event) =>
                  setForm({
                    ...form,
                    phone: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block text-sm font-medium">
              {t.position}

              <input
                required
                maxLength={150}
                placeholder={t.positionPlaceholder}
                value={form.position}
                onChange={(event) =>
                  setForm({
                    ...form,
                    position: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block text-sm font-medium">
              {t.branch}

              <select
                required
                value={form.branch_id}
                onChange={(event) =>
                  setForm({
                    ...form,
                    branch_id: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <option value="">
                  {t.selectBranch}
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name} — {branch.city}
                  </option>
                ))}
              </select>

              {loadingBranches && (
                <span className="mt-1 block text-xs text-slate-500">
                  {t.loadingBranches}
                </span>
              )}

              {branchesFailed && (
                <span className="mt-1 block text-xs text-red-600">
                  {t.branchesError}
                </span>
              )}
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                loadingBranches ||
                branches.length === 0
              }
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t.creating : t.create}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
