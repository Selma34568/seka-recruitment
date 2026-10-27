
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateApplicationStatus,
  type RecruitmentStatus,
} from "../../../lib/api";

type Language = "PL" | "EN";

const DEFAULT_STATUSES = [
  "NEW",
  "REVIEW",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8001";

type Props = {
  applicationId: number;
  currentStatus: string;
};

const translations = {
  PL: {
    title: "Status rekrutacji",
    save: "Zapisz status",
    saving: "Zapisywanie...",
    success: "Status został pomyślnie zaktualizowany!",
    error: "Nie udało się zmienić statusu. Spróbuj ponownie.",
    statuses: {
      NEW: "Nowe",
      REVIEW: "Weryfikacja",
      INTERVIEW: "Rozmowa kwalifikacyjna",
      OFFER: "Oferta",
      HIRED: "Zatrudniony",
      REJECTED: "Odrzucony",
    } as Record<string, string>,
  },
  EN: {
    title: "Recruitment Status",
    save: "Save Status",
    saving: "Saving...",
    success: "Status updated successfully!",
    error: "Could not update status. Please try again.",
    statuses: {
      NEW: "New",
      REVIEW: "In Review",
      INTERVIEW: "Interview",
      OFFER: "Offer",
      HIRED: "Hired",
      REJECTED: "Rejected",
    } as Record<string, string>,
  },
};

export default function StatusSelector({
  applicationId,
  currentStatus,
}: Props) {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("PL");

  const [statuses, setStatuses] = useState<string[]>(
    DEFAULT_STATUSES
  );

  const [selectedStatus, setSelectedStatus] =
    useState(currentStatus);

  const [savedStatus, setSavedStatus] =
    useState(currentStatus);

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const t = translations[language];

  useEffect(() => {
    function syncLanguage() {
      const saved = window.localStorage.getItem(
        "seka-language"
      );

      if (saved === "PL" || saved === "EN") {
        setLanguage(saved);
      }
    }

    syncLanguage();

    function handleStorage(event: StorageEvent) {
      if (
        event.key === "seka-language" &&
        (event.newValue === "PL" ||
          event.newValue === "EN")
      ) {
        setLanguage(event.newValue);
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      "seka-language-change",
      syncLanguage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
      window.removeEventListener(
        "seka-language-change",
        syncLanguage
      );
    };
  }, []);

  useEffect(() => {
    setSelectedStatus(currentStatus);
    setSavedStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    let cancelled = false;

    async function loadStatuses() {
      try {
        const response = await fetch(
          `${API_URL}/demo/statuses`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Failed to load statuses");
        }

        const data: unknown = await response.json();

        if (
          !Array.isArray(data) ||
          !data.every(
            (item) => typeof item === "string"
          )
        ) {
          throw new Error("Invalid status response");
        }

        if (!cancelled) {
          setStatuses(
            Array.from(
              new Set([
                ...DEFAULT_STATUSES,
                ...data,
                currentStatus,
              ])
            )
          );
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not load custom statuses."
          );
        }
      }
    }

    loadStatuses();

    return () => {
      cancelled = true;
    };
  }, [currentStatus]);

  function handleSave() {
    setMessage("");
    setError("");

    startTransition(async () => {
      try {
        await updateApplicationStatus(
          applicationId,
          selectedStatus as RecruitmentStatus
        );

        setSavedStatus(selectedStatus);
        setMessage(t.success);

        router.refresh();
      } catch {
        setError(t.error);
      }
    });
  }

  return (
    <div className="mt-5 rounded-xl bg-slate-50 p-4">
      <label
        htmlFor={`status-${applicationId}`}
        className="mb-2 block text-sm font-semibold"
      >
        {t.title}
      </label>

      <div className="flex flex-wrap gap-3">
        <select
          id={`status-${applicationId}`}
          value={selectedStatus}
          onChange={(event) =>
            setSelectedStatus(event.target.value)
          }
          disabled={isPending}
          className="min-w-48 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
        >
          {Array.from(
            new Set([
              ...statuses,
              selectedStatus,
            ])
          ).map((status) => (
            <option key={status} value={status}>
              {t.statuses[status] ??
                status.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={
            isPending ||
            selectedStatus === savedStatus
          }
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? t.saving : t.save}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className="mt-3 text-sm text-green-700"
        >
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
