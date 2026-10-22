
"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../../../lib/api";

type Language = "PL" | "EN";

type Props = {
  applicationId: number;
  initialNotes?: string | null;
};

export default function HRNotes({
  applicationId,
  initialNotes,
}: Props) {
  const [language, setLanguage] = useState<Language>("PL");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [savedNotes, setSavedNotes] = useState(initialNotes ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"success" | "error" | "">("");

  useEffect(() => {
    function syncLanguage() {
      const saved = localStorage.getItem("seka-language");
      if (saved === "PL" || saved === "EN") {
        setLanguage(saved);
      }
    }

    syncLanguage();

    window.addEventListener("seka-language-change", syncLanguage);
    window.addEventListener("storage", syncLanguage);

    return () => {
      window.removeEventListener("seka-language-change", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const t = language === "PL"
    ? {
        title: "Opinie i notatki HR",
        subtitle: "Wewnętrzne notatki dotyczące zgłoszenia.",
        placeholder: "Wpisz notatkę dotyczącą kandydata...",
        save: "Zapisz notatkę",
        saving: "Zapisywanie...",
        success: "Notatka została zapisana!",
        error: "Nie udało się zapisać notatki.",
      }
    : {
        title: "HR Notes",
        subtitle: "Internal notes about this application.",
        placeholder: "Write a note about the candidate...",
        save: "Save Note",
        saving: "Saving...",
        success: "Note saved successfully!",
        error: "Could not save the note.",
      };

  async function saveNote() {
    if (loading || notes === savedNotes) return;

    setLoading(true);
    setResult("");

    try {
      const response = await fetch(
        `${API_URL}/demo/applications/${applicationId}/notes`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes }),
        }
      );

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data: { notes: string } = await response.json();

      setNotes(data.notes);
      setSavedNotes(data.notes);
      setResult("success");
    } catch {
      setResult("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-bold text-slate-900">
        {t.title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {t.subtitle}
      </p>

      <textarea
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          setResult("");
        }}
        placeholder={t.placeholder}
        maxLength={5000}
        rows={5}
        className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-blue-600"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">
          {notes.length}/5000
        </span>

        <button
          type="button"
          onClick={saveNote}
          disabled={loading || notes === savedNotes}
          className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? t.saving : t.save}
        </button>
      </div>

      {result === "success" && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {t.success}
        </p>
      )}

      {result === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {t.error}
        </p>
      )}
    </section>
  );
}
