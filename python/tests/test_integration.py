import pytest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from httpx import AsyncClient
from src.main import app
from src.database import init_db
from src.seed import seed_data

@pytest.fixture(scope="module")
def setup_database():
    init_db()
    seed_data()
    yield

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data

@pytest.mark.asyncio
async def test_register_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "testpass123",
                "role": "user"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["username"] == "testuser"

@pytest.mark.asyncio
async def test_login_endpoint(setup_database):
    async with AsyncClient(app=app, base_url="http://test") as client:
        await client.post(
            "/auth/register",
            json={
                "username": "logintest",
                "email": "login@example.com",
                "password": "testpass123"
            }
        )
        
        response = await client.post(
            "/auth/login",
            json={
                "username": "logintest",
                "password": "testpass123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_graphql_query():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/graphql",
            json={
                "query": "{ allCharacters { id name } }"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "allCharacters" in data["data"]

