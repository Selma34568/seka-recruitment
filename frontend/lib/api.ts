
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type Branch = {
  id: number;
  name: string;
  city: string;
};

export type Application = {
  id: number;
  position: string;
  status: string;
  applied_at: string;
  branch: Branch;
};

export type Candidate = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  cv_filename: string | null;
  created_at: string;
  applications: Application[];
};

export async function getCandidates(
  role: "ADMIN" | "HR_MANAGER" | "BRANCH_MANAGER" = "ADMIN",
  branchId?: number | null
): Promise<Candidate[]> {
  const params = new URLSearchParams({ role });

  if (role === "BRANCH_MANAGER" && branchId != null) {
    params.set("branch_id", String(branchId));
  }

  const response = await fetch(
    `${API_URL}/demo/candidates?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch candidates");
  }

  return response.json();
}




export type RecruitmentStatus =
  | "NEW"
  | "REVIEW"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

export async function updateApplicationStatus(
  applicationId: number,
  status: RecruitmentStatus
): Promise<void> {
  const response = await fetch(
    `${API_URL}/demo/applications/${applicationId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update application status");
  }
}


export type CandidateCreate = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string;
  branch_id: number;
};

export async function createCandidate(
  data: CandidateCreate
): Promise<Candidate> {
  const response = await fetch(`${API_URL}/demo/candidates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail?.toString() || "Could not create candidate");
  }

  return response.json();
}

export async function getBranches(): Promise<Branch[]> {
  const response = await fetch(`${API_URL}/branches`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch branches");
  }

  return response.json();
}
