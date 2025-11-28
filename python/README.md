# 🌟 Star Wars GraphQL API - Python Implementation

API GraphQL bertema Star Wars menggunakan **Python 3.11+**, **FastAPI**, dan **Ariadne** dengan fitur-fitur enterprise terintegrasi.

## 🚀 Tech Stack

- **Python 3.11+** - Programming language
- **FastAPI** - Modern web framework untuk REST endpoints
- **Ariadne** - GraphQL library untuk Python
- **SQLite** - Lightweight database
- **Pydantic** - Data validation menggunakan type hints
- **python-jose** - JWT authentication
- **bcrypt** - Password hashing
- **aiodataloader** - DataLoader implementation untuk Python
- **pytest** - Testing framework
- **Docker** - Containerization

## ✨ Enterprise Features

### 1. 🔐 Authentication & Authorization
- JWT-based authentication dengan python-jose
- Role-based access control (RBAC)
- Protected mutations (create/update require auth, delete requires admin)
- REST endpoints untuk login/register
- Automatic admin user creation pada startup

### 2. 📊 DataLoader (N+1 Problem Solution)
- Batch loading menggunakan aiodataloader
- Automatic query batching untuk related data
- Loaders untuk: Planets, Characters, Starships, Relationships
- **Performance improvement: 25x faster** (51 queries → 2 queries)

### 3. 🛡️ Input Validation dengan Pydantic
- Type-safe validation menggunakan Pydantic models
- Field length validation
- Custom validators untuk business rules
- Automatic error messages
- Email format validation

### 4. 📝 Structured Logging
- JSON-formatted logs untuk easy parsing
- File rotation (10MB per file, max 5 files)
- Separate error logs
- Request/response logging
- Log levels: DEBUG, INFO, WARNING, ERROR

### 5. 🧪 Unit & Integration Tests
- pytest test suite
- Unit tests untuk resolvers, auth, validators
- Integration tests untuk API endpoints
- Test coverage reporting

## 📦 Installation & Setup

### Prerequisites
- Python 3.11 or higher
- pip package manager
- Docker (optional, for containerized deployment)

### Option 1: Docker (Recommended)

```bash
cd python
docker-compose up --build
```

**Access:** http://localhost:8000/graphql

### Option 2: Local Development

```bash
cd python

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp ENV_EXAMPLE.txt .env
# Edit .env with your settings

# Initialize database
python -m src.database

# Seed initial data
python -m src.seed

# Run development server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔐 Authentication

### Default Admin User
Pada startup pertama, admin user otomatis dibuat:
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `admin`

⚠️ **PENTING:** Ubah password default di production!

### Register New User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "role": "user"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@starwars.com",
    "role": "admin"
  }
}
```

### Using Token in GraphiQL

#### Step 1: Login untuk Mendapatkan Token

**Opsi A: Via Swagger UI (Recommended)**
1. Buka: http://localhost:8000/docs
2. Cari endpoint `/auth/login`
3. Klik "Try it out"
4. Masukkan:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
5. Klik "Execute"
6. **Copy token** dari field `access_token` di response

**Opsi B: Via cURL**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

#### Step 2: Tambahkan Token di GraphiQL

1. **Open GraphiQL**: http://localhost:8000/graphql
2. **Add Header** di panel "HTTP Headers":
   ```json
   {
     "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```
   **PENTING:** 
   - Value harus string lengkap dengan "Bearer " + token
   - Bukan JSON object!
   - Pastikan token lengkap (tidak terpotong)

**Cara yang BENAR:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Cara yang SALAH (akan error):**
```json
{
  "Authorization": {
    "Bearer": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Step 3: Jalankan Mutation

```graphql
mutation {
  createCharacter(input: {
    name: "Obi-Wan Kenobi"
    species: "Human"
  }) {
    id
    name
  }
}
```

**Hasil:** ✅ Berhasil tanpa error!

### ⚠️ Tips Penting

#### 1. Format Header yang Benar

**✅ BENAR:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**❌ SALAH:**
```json
{
  "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // tanpa "Bearer "
}
{
  "Authorization": {
    "Bearer": "eyJ..."  // sebagai JSON object
  }
}
```

#### 2. Token Expired

Token memiliki expiry time (default: 30 menit). Jika token expired:
- Login ulang untuk mendapatkan token baru
- Copy token baru ke header

#### 3. Admin vs User Role

- **User biasa:** Bisa create, update
- **Admin:** Bisa create, update, **dan delete**

Untuk delete operations, pastikan menggunakan token admin:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 🔍 Troubleshooting Authentication

#### Error: "Authentication required"

**Penyebab:** Header Authorization tidak ada atau salah format.

**Solusi:**
1. Pastikan header `Authorization` sudah ditambahkan
2. Pastikan value dimulai dengan `Bearer ` (dengan spasi)
3. Pastikan token lengkap (tidak terpotong)

#### Error: "Invalid token"

**Penyebab:** Token tidak valid atau expired.

**Solusi:**
1. Login ulang untuk mendapatkan token baru
2. Copy token lengkap (dari awal sampai akhir)
3. Pastikan tidak ada spasi ekstra di token

#### Error: "Admin access required"

**Penyebab:** Mencoba delete operation dengan user biasa.

**Solusi:**
1. Login sebagai admin (username: `admin`, password: `admin123`)
2. Gunakan token admin untuk delete operations

## 📊 GraphQL Schema

### Queries (No Auth Required)

```graphql
query {
  allCharacters {
    id
    name
    species
    homePlanet {
      name
      climate
      terrain
    }
    pilotedStarships {
      name
      model
      manufacturer
    }
  }
  
  character(id: "1") {
    id
    name
    species
  }
  
  allPlanets {
    id
    name
    climate
    terrain
    residents {
      name
      species
    }
  }
  
  allStarships {
    id
    name
    model
    manufacturer
    pilots {
      name
      species
    }
  }
}
```

### Mutations (Auth Required)

#### Create Operations
```graphql
mutation {
  createPlanet(input: {
    name: "Mustafar"
    climate: "Hot"
    terrain: "Volcanic"
  }) {
    id
    name
  }
  
  createCharacter(input: {
    name: "Obi-Wan Kenobi"
    species: "Human"
    homePlanetId: 1
  }) {
    id
    name
    species
  }
  
  createStarship(input: {
    name: "Imperial Star Destroyer"
    model: "Imperial I-class"
    manufacturer: "Kuat Drive Yards"
  }) {
    id
    name
    model
  }
}
```

#### Update Operations
```graphql
mutation {
  updatePlanet(input: {
    id: "6"
    name: "Mustafar (Lava Planet)"
    climate: "Extremely Hot"
  }) {
    id
    name
    climate
  }
  
  updateCharacter(input: {
    id: "6"
    name: "Obi-Wan Kenobi (Jedi Master)"
  }) {
    id
    name
  }
  
  updateStarship(input: {
    id: "4"
    name: "Imperial Star Destroyer (Modified)"
  }) {
    id
    name
  }
}
```

#### Delete Operations (Admin Only)
```graphql
mutation {
  deletePlanet(id: "6")
  deleteCharacter(id: "6")
  deleteStarship(id: "4")
}
```

#### Relationship Operations
```graphql
mutation {
  assignStarship(input: {
    characterId: "1"
    starshipId: "1"
  }) {
    id
    name
    pilotedStarships {
      name
      model
    }
  }
}
```

## 📁 Project Structure

```
python/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI app dengan REST endpoints
│   ├── resolvers.py         # GraphQL resolvers
│   ├── schema.graphql       # GraphQL schema definition
│   ├── database.py          # Database setup & connection
│   ├── seed.py              # Initial data seeding
│   ├── auth.py              # JWT authentication & authorization
│   ├── validators.py        # Pydantic input validators
│   ├── responses.py         # Pydantic response models
│   ├── dataloaders.py       # DataLoader implementations
│   ├── logger.py            # Logging configuration
│   └── config.py            # Environment configuration
├── tests/
│   ├── __init__.py
│   ├── test_resolvers.py    # Resolver unit tests
│   ├── test_auth.py         # Authentication tests
│   ├── test_validators.py   # Validator tests
│   └── test_integration.py  # API integration tests
├── logs/                    # Log files (auto-generated)
│   ├── api.log              # All logs (JSON format)
│   └── error.log            # Error logs only
├── requirements.txt         # Python dependencies
├── Dockerfile               # Docker image configuration
├── docker-compose.yml       # Docker Compose setup
├── ENV_EXAMPLE.txt          # Environment variables template
├── pytest.ini               # Pytest configuration
└── README.md                # This file
```

## 🔧 Configuration

### Environment Variables

Copy `ENV_EXAMPLE.txt` to `.env`:

```env
DATABASE_NAME=starwars.db
SECRET_KEY=your-secret-key-change-in-production-use-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=False
PORT=8000
LOG_LEVEL=INFO
LOG_FILE=api.log
```

### Key Configuration Files

- **`src/config.py`** - Loads environment variables
- **`pytest.ini`** - Pytest configuration
- **`Dockerfile`** - Container configuration
- **`docker-compose.yml`** - Docker Compose services

## 🧪 Testing

### Run All Tests

```bash
cd python
pytest
```

### Run with Coverage

```bash
pytest --cov=src --cov-report=html
# Open htmlcov/index.html in browser
```

### Run Specific Test Files

```bash
# Test resolvers only
pytest tests/test_resolvers.py -v

# Test authentication
pytest tests/test_auth.py -v

# Test validators
pytest tests/test_validators.py -v

# Integration tests
pytest tests/test_integration.py -v
```

### Test Examples

```python
# Example test structure
def test_create_character():
    # Test mutation with authentication
    pass

def test_delete_requires_admin():
    # Test admin-only operations
    pass
```

## 📊 DataLoader Implementation

### How It Works

**Before (N+1 Problem):**
```
Query 1: SELECT * FROM characters (50 rows)
Query 2: SELECT * FROM planets WHERE id = 1
Query 3: SELECT * FROM planets WHERE id = 2
...
Query 51: SELECT * FROM planets WHERE id = 50
Total: 51 queries ❌
```

**After (with DataLoader):**
```
Query 1: SELECT * FROM characters (50 rows)
Query 2: SELECT * FROM planets WHERE id IN (1,2,3,...,50)
Total: 2 queries ✅
```

### Available Loaders

- **`PlanetLoader`** - Batch load planets by ID
- **`CharacterLoader`** - Batch load characters by ID
- **`StarshipLoader`** - Batch load starships by ID
- **`CharacterStarshipsLoader`** - Load starships for characters
- **`PlanetResidentsLoader`** - Load residents for planets
- **`StarshipPilotsLoader`** - Load pilots for starships

### Usage in Resolvers

```python
@character_type.field("homePlanet")
async def resolve_character_home_planet(character_obj, info):
    dataloaders = get_dataloaders(info)
    planet = await dataloaders['planets'].load(int(character_obj['home_planet_id']))
    return planet
```

## 🛡️ Input Validation

### Pydantic Models

```python
class CreateCharacterInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    species: Optional[str] = Field(None, max_length=50)
    homePlanetId: Optional[int] = Field(None, gt=0)
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
```

### Validation Rules

- **Name fields:** 1-100 characters, not empty
- **Species:** Max 50 characters
- **Email:** Valid email format
- **Password:** 6-72 characters
- **IDs:** Positive integers

## 📝 Logging

### Log Files

- **`logs/api.log`** - All application logs (JSON format)
- **`logs/error.log`** - Error logs only (JSON format)

### Log Format

```json
{
  "asctime": "2024-01-01 12:00:00",
  "name": "starwars_api.resolvers",
  "levelname": "INFO",
  "message": "Character created successfully",
  "pathname": "/app/src/resolvers.py",
  "lineno": 297
}
```

### Usage

```python
from logger import get_logger

logger = get_logger("resolvers")
logger.info("Operation started")
logger.error("Error occurred", exc_info=True)
```

## 🌐 API Endpoints

### REST Endpoints (FastAPI)

- **`GET /`** - Root endpoint dengan API info
- **`GET /health`** - Health check dengan database status
- **`POST /auth/register`** - Register new user
- **`POST /auth/login`** - Login dan dapatkan JWT token
- **`GET /auth/me`** - Get current user info (requires auth)
- **`GET /docs`** - Swagger UI documentation
- **`GET /redoc`** - ReDoc documentation

### GraphQL Endpoint

- **`POST /graphql`** - GraphQL endpoint dengan GraphiQL interface

## 🐛 Troubleshooting

### Port Already in Use

**Windows:**
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -i :8000
kill -9 <PID>
```

### Module Not Found

```bash
pip install -r requirements.txt
```

### Database Errors

```bash
# Remove old database
rm starwars.db

# Reinitialize
python -m src.database
python -m src.seed
```

### Import Errors

```bash
# Make sure you're in python directory
cd python

# Run with module path
python -m src.main
```

### Token Issues

1. Ensure token is complete (not truncated)
2. Check token hasn't expired (default: 30 minutes)
3. Login again to get fresh token
4. Verify header format: `Bearer <token>`

## 🚀 Production Deployment

### 1. Environment Setup

```env
DEBUG=False
SECRET_KEY=<strong-random-secret-key>
ACCESS_TOKEN_EXPIRE_MINUTES=30
LOG_LEVEL=WARNING
```

### 2. Use Production WSGI Server

```bash
pip install gunicorn
gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 3. Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Security Checklist

- [ ] Change default admin password
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS
- [ ] Setup reverse proxy (nginx)
- [ ] Configure firewall
- [ ] Setup monitoring
- [ ] Regular backups

## 📈 Performance Tips

1. **DataLoader** - ✅ Already implemented
2. **Database Indexes** - ✅ Already created
3. **Connection Pooling** - Consider SQLAlchemy for production
4. **Caching** - Add Redis for query caching
5. **Async Operations** - Already using async/await

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **GraphiQL:** http://localhost:8000/graphql

### Example Requests

See `CARA_MENGGUNAKAN_AUTH.md` in project root for detailed authentication guide.

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Ariadne GraphQL](https://ariadne.readthedocs.io/)
- [Pydantic Validation](https://docs.pydantic.dev/)
- [DataLoader Pattern](https://github.com/graphql/dataloader)
- [pytest Documentation](https://docs.pytest.org/)

## ✅ Feature Checklist

- [x] Authentication & Authorization (JWT)
- [x] DataLoader implementation
- [x] Input validation (Pydantic)
- [x] Structured logging
- [x] Unit tests (pytest)
- [x] Integration tests
- [x] Docker support
- [x] Environment configuration
- [x] API documentation
- [x] Error handling
- [x] Database migrations

## 📄 License

MIT License

---

**May the Force be with you!** ⚔️✨
