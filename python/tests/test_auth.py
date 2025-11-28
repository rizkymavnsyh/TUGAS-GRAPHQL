import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import init_db, get_db_connection
from src.auth import (
    verify_password, get_password_hash,
    create_access_token, verify_token
)
from jose import jwt
from src.config import SECRET_KEY, ALGORITHM

@pytest.fixture(scope="module")
def setup_database():
    init_db()
    yield

def test_password_hashing():
    password = "testpassword123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrongpassword", hashed)

def test_create_access_token():
    data = {"sub": "testuser", "role": "user"}
    token = create_access_token(data)
    assert token is not None
    assert isinstance(token, str)
    
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "testuser"
    assert payload["role"] == "user"

def test_verify_token():
    data = {"sub": "testuser", "role": "user"}
    token = create_access_token(data)
    
    from fastapi.security import HTTPAuthorizationCredentials
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=token
    )
    
    payload = verify_token(credentials)
    assert payload["sub"] == "testuser"

