# 🌟 Star Wars GraphQL API - Node.js Implementation

API GraphQL bertema Star Wars menggunakan **Node.js 20+**, **Apollo Server 4**, dan **Express** dengan fitur-fitur enterprise terintegrasi.

## 🚀 Tech Stack

- **Node.js 20+** - JavaScript runtime
- **Apollo Server 4** - Production-ready GraphQL server
- **Express** - Web framework untuk REST endpoints
- **better-sqlite3** - Fast SQLite3 driver
- **GraphQL** - Query language untuk API
- **DataLoader** - Batch loading untuk solve N+1 problem
- **Zod** - TypeScript-first schema validation
- **Winston** - Structured logging
- **Jest** - Testing framework
- **Docker** - Containerization

## ✨ Enterprise Features

### 1. 🔐 Authentication & Authorization
- JWT-based authentication dengan jsonwebtoken
- Role-based access control (RBAC)
- Protected mutations (create/update require auth, delete requires admin)
- REST endpoints untuk login/register
- Automatic admin user creation pada startup

### 2. 📊 DataLoader (N+1 Problem Solution)
- Batch loading menggunakan DataLoader library
- Automatic query batching untuk related data
- Loaders untuk: Planets, Characters, Starships, Relationships
- **Performance improvement: 25x faster** (51 queries → 2 queries)

### 3. 🛡️ Input Validation dengan Zod
- Type-safe validation menggunakan Zod schemas
- Field length validation
- Custom error messages dalam Bahasa Indonesia
- Automatic error formatting untuk GraphQL

### 4. 📝 Structured Logging dengan Winston
- JSON-formatted logs untuk easy parsing
- File rotation (5MB per file, max 5 files)
- Separate logs: combined.log, error.log, exceptions.log, rejections.log
- GraphQL query/error logging
- Log levels: DEBUG, INFO, WARNING, ERROR

### 5. 🧪 Unit & Integration Tests
- Jest test suite dengan ES modules support
- Unit tests untuk resolvers, validators, dataloaders
- Integration tests untuk API endpoints
- Test coverage reporting

## 📦 Installation & Setup

### Prerequisites
- Node.js 20 or higher
- npm or yarn package manager
- Docker (optional, for containerized deployment)

### Option 1: Docker (Recommended)

```bash
cd nodejs
docker-compose up --build
```

**Access:** http://localhost:4000/graphql

⚠️ **PENTING:** Jika menambahkan dependencies baru, rebuild container:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Option 2: Local Development

```bash
cd nodejs

# Install dependencies
npm install

# Initialize database and seed data
npm run seed

# Run development server (with nodemon)
npm run dev

# Or run production server
npm start
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
curl -X POST http://localhost:4000/auth/register \
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
curl -X POST http://localhost:4000/auth/login \
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

### Using Token in Apollo Studio

#### Step 1: Login untuk Mendapatkan Token

**Opsi A: Via Swagger UI (Recommended)**
1. Buka: http://localhost:4000/docs
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
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

#### Step 2: Tambahkan Token di Apollo Studio

1. **Open Apollo Studio**: http://localhost:4000/graphql
2. **Add Header** di panel "Headers" atau "HTTP Headers":
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   **PENTING:** Pastikan ada spasi setelah `Bearer`

3. **Atau menggunakan JSON format:**
   ```json
   {
     "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

#### Step 3: Jalankan Mutation

```graphql
mutation {
  createCharacter(input: {
    name: "Obi-Wan Kenobi"
    species: "Human"
    homePlanetId: 1
  }) {
    id
    name
    species
  }
}
```

**Hasil:** ✅ Berhasil tanpa error!

### ⚠️ Tips Penting

#### 1. Format Header yang Benar

**✅ BENAR:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**❌ SALAH:**
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  // tanpa "Bearer "
Authorization: { "Bearer": "eyJ..." }  // sebagai JSON object
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
curl -X POST http://localhost:4000/auth/login \
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
nodejs/
├── src/
│   ├── server.js            # Apollo Server & Express setup
│   ├── schema.js            # GraphQL schema definition
│   ├── resolvers.js         # GraphQL resolvers
│   ├── database.js          # Database setup & connection
│   ├── seed.js              # Initial data seeding
│   ├── auth.js              # JWT authentication & authorization
│   ├── validators.js        # Zod input validators
│   ├── dataloaders.js       # DataLoader implementations
│   └── logger.js            # Winston logging configuration
├── tests/
│   ├── resolvers.test.js    # Resolver unit tests
│   ├── validators.test.js   # Validator tests
│   ├── dataloaders.test.js  # DataLoader tests
│   └── integration.test.js  # API integration tests
├── logs/                    # Log files (auto-generated)
│   ├── combined.log         # All logs (JSON format)
│   ├── error.log            # Error logs only
│   ├── exceptions.log       # Uncaught exceptions
│   └── rejections.log       # Unhandled promise rejections
├── package.json             # Node.js dependencies & scripts
├── Dockerfile               # Docker image configuration
├── docker-compose.yml       # Docker Compose setup
├── .gitignore               # Git ignore rules
├── .dockerignore            # Docker ignore rules
└── README.md                # This file
```

## 🔧 Configuration

### Environment Variables

Create `.env` file (optional, defaults provided):

```env
PORT=4000
NODE_ENV=development
SECRET_KEY=your-secret-key-change-in-production-use-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=30
LOG_LEVEL=info
LOG_DB_QUERIES=false
```

### Package Scripts

```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "seed": "node src/seed.js",
  "init-db": "node src/database.js",
  "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
  "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch",
  "test:coverage": "node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage"
}
```

## 🧪 Testing

### Run All Tests

```bash
cd nodejs
npm test
```

### Run with Coverage

```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

### Run in Watch Mode

```bash
npm run test:watch
```

### Run Specific Test Files

```bash
# Test resolvers only
npm test -- resolvers.test.js

# Test validators only
npm test -- validators.test.js

# Test dataloaders only
npm test -- dataloaders.test.js

# Integration tests only
npm test -- integration.test.js
```

### Test Examples

```javascript
// Example test structure
describe('createCharacter mutation', () => {
  it('should require authentication', async () => {
    // Test mutation without auth token
  });
  
  it('should create character with valid input', async () => {
    // Test successful creation
  });
});
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

- **`createPlanetLoader()`** - Batch load planets by ID
- **`createCharacterLoader()`** - Batch load characters by ID
- **`createStarshipLoader()`** - Batch load starships by ID
- **`createCharacterStarshipsLoader()`** - Load starships for characters
- **`createPlanetResidentsLoader()`** - Load residents for planets
- **`createStarshipPilotsLoader()`** - Load pilots for starships

### Usage in Resolvers

```javascript
Character: {
  homePlanet: (character, _, { loaders }) => {
    if (!character.home_planet_id) return null;
    return loaders.planet.load(character.home_planet_id);
  },
  
  pilotedStarships: (character, _, { loaders }) => {
    return loaders.characterStarships.load(character.id);
  },
}
```

### Loader Factory

```javascript
export function createLoaders() {
  return {
    planet: createPlanetLoader(),
    character: createCharacterLoader(),
    starship: createStarshipLoader(),
    characterStarships: createCharacterStarshipsLoader(),
    planetResidents: createPlanetResidentsLoader(),
    starshipPilots: createStarshipPilotsLoader(),
  };
}
```

## 🛡️ Input Validation dengan Zod

### Zod Schemas

```javascript
export const CreateCharacterInputSchema = z.object({
  name: z.string()
    .min(1, 'Nama karakter tidak boleh kosong')
    .max(100, 'Nama karakter maksimal 100 karakter'),
  species: z.string()
    .max(50, 'Species maksimal 50 karakter')
    .optional()
    .nullable(),
  homePlanetId: z.number()
    .int()
    .positive('homePlanetId harus bilangan bulat positif')
    .optional()
    .nullable(),
});
```

### Validation Rules

- **Name fields:** 1-100 characters, not empty
- **Species:** Max 50 characters
- **Email:** Valid email format
- **Password:** 6-72 characters
- **IDs:** Positive integers or strings

### Usage

```javascript
import { validateInput, CreateCharacterInputSchema } from './validators.js';

const validated = validateInput(CreateCharacterInputSchema, input);
// Use validated.name, validated.species, etc.
```

### Error Formatting

Zod errors automatically formatted as GraphQL errors:
```json
{
  "errors": [{
    "message": "Validation error: name: Nama karakter tidak boleh kosong",
    "extensions": {
      "code": "VALIDATION_ERROR",
      "errors": [...]
    }
  }]
}
```

## 📝 Logging dengan Winston

### Log Files

- **`logs/combined.log`** - All application logs (JSON format)
- **`logs/error.log`** - Error logs only (JSON format)
- **`logs/exceptions.log`** - Uncaught exceptions
- **`logs/rejections.log`** - Unhandled promise rejections

### Log Format

```json
{
  "timestamp": "2024-01-01 12:00:00",
  "level": "info",
  "message": "GraphQL Query",
  "service": "starwars-graphql-api",
  "query": "query { allCharacters { id name } }",
  "variables": {},
  "operationName": null
}
```

### Usage

```javascript
import { logger, getLogger, logGraphQLQuery, logGraphQLError } from './logger.js';

const logger = getLogger('resolvers');
logger.info('Operation started', { userId: 1 });
logger.error('Error occurred', { error: error.message, stack: error.stack });

// GraphQL specific
logGraphQLQuery(query, variables, operationName);
logGraphQLError(error, { operation: 'createCharacter' });
```

### Log Levels

- **DEBUG** - Detailed debugging information
- **INFO** - General informational messages
- **WARN** - Warning messages
- **ERROR** - Error messages

## 🌐 API Endpoints

### REST Endpoints (Express)

- **`GET /`** - Root endpoint dengan API info
- **`GET /health`** - Health check
- **`POST /auth/register`** - Register new user
- **`POST /auth/login`** - Login dan dapatkan JWT token
- **`GET /docs`** - Swagger UI documentation

### GraphQL Endpoint

- **`POST /graphql`** - GraphQL endpoint dengan Apollo Studio Sandbox

## 🐛 Troubleshooting

### Port Already in Use

**Windows:**
```bash
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -i :4000
kill -9 <PID>
```

### Module Not Found

```bash
npm install
```

### Database Errors

```bash
# Remove old database
rm starwars.db

# Reinitialize
npm run init-db
npm run seed
```

### Docker Issues

Jika dependencies tidak terinstall di Docker:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Token Issues

1. Ensure token is complete (not truncated)
2. Check token hasn't expired (default: 30 minutes)
3. Login again to get fresh token
4. Verify header format: `Bearer <token>` (with space after Bearer)

**Lihat section "Troubleshooting Authentication" di atas untuk detail lebih lengkap.**

### Jest ES Modules

Jika ada error dengan Jest dan ES modules:
```bash
# Ensure package.json has:
{
  "type": "module",
  "jest": {
    "extensionsToTreatAsEsm": [".js"],
    "moduleNameMapper": {
      "^(\\.{1,2}/.*)\\.js$": "$1"
    }
  }
}
```

## 🚀 Production Deployment

### 1. Environment Setup

```env
NODE_ENV=production
PORT=4000
SECRET_KEY=<strong-random-secret-key>
ACCESS_TOKEN_EXPIRE_MINUTES=30
LOG_LEVEL=warn
```

### 2. Build & Start

```bash
npm install --production
npm start
```

### 3. Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Process Manager (PM2)

```bash
npm install -g pm2
pm2 start src/server.js --name starwars-api
pm2 save
pm2 startup
```

### 5. Security Checklist

- [ ] Change default admin password
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS
- [ ] Setup reverse proxy (nginx)
- [ ] Configure firewall
- [ ] Setup monitoring
- [ ] Regular backups
- [ ] Rate limiting
- [ ] CORS configuration

## 📈 Performance Tips

1. **DataLoader** - ✅ Already implemented
2. **Database Indexes** - ✅ Already created
3. **Connection Pooling** - better-sqlite3 handles this
4. **Caching** - Add Redis for query caching
5. **Compression** - Enable gzip compression in Express

## 📚 API Documentation

### Interactive Documentation

- **Apollo Studio Sandbox:** http://localhost:4000/graphql
- **Swagger UI:** http://localhost:4000/docs

### Example Requests

See `CARA_MENGGUNAKAN_AUTH.md` in project root for detailed authentication guide.

## 🎓 Learning Resources

- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [DataLoader Pattern](https://github.com/graphql/dataloader)
- [Zod Validation](https://zod.dev/)
- [Winston Logging](https://github.com/winstonjs/winston)
- [Jest Testing](https://jestjs.io/)

## ✅ Feature Checklist

- [x] Authentication & Authorization (JWT)
- [x] DataLoader implementation
- [x] Input validation (Zod)
- [x] Structured logging (Winston)
- [x] Unit tests (Jest)
- [x] Integration tests
- [x] Docker support
- [x] Environment configuration
- [x] API documentation
- [x] Error handling
- [x] Database setup

## 📄 License

MIT License

---

**May the Force be with you!** ⚔️✨
