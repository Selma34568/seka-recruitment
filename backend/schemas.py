
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class BranchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    city: str


class CandidateCreate(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    phone: str | None = None
    branch_id: int
    position: str = Field(min_length=1)


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position: str
    status: str
    applied_at: datetime
    branch: BranchResponse
    notes: str | None = None
    cv_filename: str | None = None


class CandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: str
    phone: str | None
    cv_filename: str | None
    created_at: datetime
    applications: list[ApplicationResponse]


class StatusUpdate(BaseModel):
    status: str
