
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../../../lib/api";

type Props = {
  candidateId: number;
  hasCV: boolean;
};

export default function CVUpload({ candidateId, hasCV }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(hasCV);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!selectedFile || loading) return;

    setError("");
    setMessage("");

    if (
      selectedFile.type !== "application/pdf" ||
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Maximum file size is 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/candidates/${candidateId}/cv`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("CV upload failed.");
      }

      setUploaded(true);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";

      setMessage("CV uploaded successfully!");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-slate-200 p-5">
      <h2 className="text-lg font-bold">Candidate CV</h2>

      <p className="mt-1 text-sm text-slate-500">
        Upload or view the candidate's PDF CV.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) =>
            setSelectedFile(event.target.files?.[0] ?? null)
          }
          className="max-w-full text-sm"
        />

        <button
          type="button"
          disabled={!selectedFile || loading}
          onClick={handleUpload}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload CV"}
        </button>

        {uploaded && (
          <a
            href={`${API_URL}/candidates/${candidateId}/cv`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-slate-50"
          >
            View CV ↗
          </a>
        )}
      </div>

      {message && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
