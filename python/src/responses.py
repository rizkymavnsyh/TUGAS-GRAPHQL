from pydantic import BaseModel, Field
from typing import Optional, List

class HealthResponse(BaseModel):
    status: str = Field(..., description="Health status (healthy/unhealthy)")
    database: str = Field(..., description="Database connection status")
    version: str = Field(..., description="API version")

class RootResponse(BaseModel):
    message: str = Field(..., description="Welcome message")
    version: str = Field(..., description="API version")
    features: List[str] = Field(..., description="List of implemented features")
    endpoints: dict = Field(..., description="Available endpoints")

class UserInfo(BaseModel):
    id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="User email")
    role: str = Field(..., description="User role (user/admin)")

class LoginResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserInfo = Field(..., description="User information")

class RegisterResponse(BaseModel):
    message: str = Field(..., description="Success message")
    username: str = Field(..., description="Registered username")

class MeResponse(BaseModel):
    id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    role: str = Field(..., description="User role")

class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Error message")

