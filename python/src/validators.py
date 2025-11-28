from pydantic import BaseModel, validator, Field
from typing import Optional

class CreatePlanetInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Planet name")
    climate: Optional[str] = Field(None, max_length=100, description="Planet climate")
    terrain: Optional[str] = Field(None, max_length=200, description="Planet terrain")
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

class UpdatePlanetInput(BaseModel):
    id: str = Field(..., description="Planet ID")
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    climate: Optional[str] = Field(None, max_length=100)
    terrain: Optional[str] = Field(None, max_length=200)
    
    @validator('name')
    def name_must_not_be_empty_if_provided(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v

class CreateCharacterInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    species: Optional[str] = Field(None, max_length=50)
    homePlanetId: Optional[int] = Field(None, gt=0, description="Home planet ID")
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

class UpdateCharacterInput(BaseModel):
    id: str = Field(..., description="Character ID")
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    species: Optional[str] = Field(None, max_length=50)
    homePlanetId: Optional[int] = Field(None, gt=0)
    
    @validator('name')
    def name_must_not_be_empty_if_provided(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v

class CreateStarshipInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    manufacturer: Optional[str] = Field(None, max_length=100)
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

class UpdateStarshipInput(BaseModel):
    id: str = Field(..., description="Starship ID")
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    manufacturer: Optional[str] = Field(None, max_length=100)
    
    @validator('name')
    def name_must_not_be_empty_if_provided(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v

class AssignStarshipInput(BaseModel):
    characterId: str = Field(..., description="Character ID")
    starshipId: str = Field(..., description="Starship ID")

class LoginInput(BaseModel):
    username: str = Field(
        ..., 
        min_length=1, 
        max_length=50,
        description="Username yang terdaftar di sistem",
        example="testuser"
    )
    password: str = Field(
        ..., 
        min_length=6, 
        max_length=72,
        description="Password user (minimal 6 karakter, maksimal 72 karakter)",
        example="testpass123"
    )

class RegisterInput(BaseModel):
    username: str = Field(
        ..., 
        min_length=3, 
        max_length=50,
        description="Username yang akan digunakan (3-50 karakter, harus unik)",
        example="testuser"
    )
    email: str = Field(
        ..., 
        pattern=r'^[^@]+@[^@]+\.[^@]+$',
        description="Email user (format email valid, harus unik)",
        example="test@example.com"
    )
    password: str = Field(
        ..., 
        min_length=6, 
        max_length=72,
        description="Password user (minimal 6 karakter, maksimal 72 karakter)",
        example="testpass123"
    )
    role: Optional[str] = Field(
        "user", 
        pattern="^(user|admin)$",
        description="Role user: 'user' (default) atau 'admin'",
        example="user"
    )

