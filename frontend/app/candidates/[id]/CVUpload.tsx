
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../../../lib/api";

type Language = "PL" | "EN";

type Props = {
  candidateId: number;
  hasCV: boolean;
};

const translations = {
  PL: {
    title: "CV kandydata",
    description: "Prześlij lub wyświetl CV kandydata w formacie PDF.",
    upload: "Prześlij CV",
    uploading: "Przesyłanie...",
    view: "Wyświetl CV",
    selectPdf: "Wybierz plik PDF.",
    maxSize: "Maksymalny rozmiar pliku wynosi 5 MB.",
    uploadFailed: "Nie udało się przesłać CV.",
    success: "CV zostało pomyślnie przesłane!",
  },
  EN: {
    title: "Candidate CV",
    description: "Upload or view the candidate's PDF CV.",
    upload: "Upload CV",
    uploading: "Uploading...",
    view: "View CV",
    selectPdf: "Please select a PDF file.",
    maxSize: "Maximum file size is 5 MB.",
    uploadFailed: "CV upload failed.",
    success: "CV uploaded successfully!",
  },
};

export default function CVUpload({
  candidateId,
  hasCV,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [language, setLanguage] = useState<Language>("PL");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(hasCV);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const t = translations[language];

  useEffect(() => {

  function syncLanguage() {
    const saved = window.localStorage.getItem("seka-language");

    if (saved === "PL" || saved === "EN") {
      setLanguage(saved);
    }
  }

  syncLanguage();

  function handleStorage(event: StorageEvent) {
    if (
      event.key === "seka-language" &&
      (event.newValue === "PL" || event.newValue === "EN")
    ) {
      setLanguage(event.newValue);
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener("seka-language-change", syncLanguage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("seka-language-change", syncLanguage);
  };
}, []);


  async function handleUpload() {
    if (!selectedFile || loading) return;

    setError("");
    setMessage("");

    if (
      selectedFile.type !== "application/pdf" ||
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError(t.selectPdf);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError(t.maxSize);
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/demo/candidates/${candidateId}/cv`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(t.uploadFailed);
      }

      setUploaded(true);
      setSelectedFile(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      setMessage(t.success);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.uploadFailed
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-slate-200 p-5">
      <h2 className="text-lg font-bold">
        {t.title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {t.description}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) =>
            setSelectedFile(
              event.target.files?.[0] ?? null
            )
          }
          className="max-w-full text-sm"
        />

        <button
          type="button"
          disabled={!selectedFile || loading}
          onClick={handleUpload}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? t.uploading : t.upload}
        </button>

        {uploaded && (
          <a
            href={`${API_URL}/demo/candidates/${candidateId}/cv`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-slate-50"
          >
            {t.view} ↗
          </a>
        )}
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
    </section>
  );
}
