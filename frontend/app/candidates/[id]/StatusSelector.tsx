
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateApplicationStatus,
  type RecruitmentStatus,
} from "../../../lib/api";

const statuses: RecruitmentStatus[] = [
  "NEW",
  "REVIEW",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

type Props = {
  applicationId: number;
  currentStatus: string;
};

export default function StatusSelector({
  applicationId,
  currentStatus,
}: Props) {
  const router = useRouter();

  const initialStatus: RecruitmentStatus =
    statuses.includes(currentStatus as RecruitmentStatus)
      ? (currentStatus as RecruitmentStatus)
      : "NEW";

  const [selectedStatus, setSelectedStatus] =
    useState<RecruitmentStatus>(initialStatus);

  const [savedStatus, setSavedStatus] =
    useState<RecruitmentStatus>(initialStatus);

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    setMessage("");
    setError("");

    startTransition(async () => {
      try {
        await updateApplicationStatus(
          applicationId,
          selectedStatus
        );

        setSavedStatus(selectedStatus);
        setMessage("Status updated successfully!");

        router.refresh();
      } catch {
        setError("Could not update status. Please try again.");
      }
    });
  }

  return (
    <div className="mt-5 rounded-xl bg-slate-50 p-4">
      <label
        htmlFor={`status-${applicationId}`}
        className="mb-2 block text-sm font-semibold"
      >
        Recruitment Status
      </label>

      <div className="flex flex-wrap gap-3">
        <select
          id={`status-${applicationId}`}
          value={selectedStatus}
          onChange={(event) =>
            setSelectedStatus(
              event.target.value as RecruitmentStatus
            )
          }
          disabled={isPending}
          className="min-w-48 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={
            isPending || selectedStatus === savedStatus
          }
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Status"}
        </button>
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
    </div>
  );
}
