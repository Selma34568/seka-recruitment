
import { notFound } from "next/navigation";
import { Candidate, API_URL } from "../../../lib/api";
import CandidateDetailClient from "./CandidateDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getCandidate(
  id: string
): Promise<Candidate | null> {
  const response = await fetch(
    `${API_URL}/demo/candidates/${id}`,
    { cache: "no-store" }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load candidate");
  }

  return response.json();
}

export default async function CandidateDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  const candidate = await getCandidate(id);

  if (!candidate) {
    notFound();
  }

  return <CandidateDetailClient candidate={candidate} />;
}
