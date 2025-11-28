from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from ariadne import load_schema_from_path, make_executable_schema
from ariadne.asgi import GraphQL
from .database import init_db, get_db_connection
from .resolvers import resolvers
from .auth import create_access_token, verify_password, get_password_hash, get_current_user
from .validators import LoginInput, RegisterInput
from .responses import (
    RootResponse, HealthResponse, LoginResponse, 
    RegisterResponse, MeResponse, ErrorResponse
)
from .logger import get_logger
from .config import PORT, DEBUG
import os
from pathlib import Path

logger = get_logger("main")

app = FastAPI(
    title="Star Wars GraphQL API (Enhanced)",
    description="API GraphQL yang lengkap dengan fitur-fitur enterprise.",
    version="2.0.0",
    contact={
        "name": "Star Wars API Support",
        "email": "admin@starwars.com",
    },
    license_info={
        "name": "MIT",
    },
    tags_metadata=[
        {
            "name": "root",
            "description": "Root endpoint dengan informasi API",
        },
        {
            "name": "health",
            "description": "Health check endpoints untuk monitoring",
        },
        {
            "name": "authentication",
            "description": "Endpoints untuk autentikasi dan manajemen user",
        },
        {
            "name": "graphql",
            "description": "GraphQL endpoint dengan GraphiQL interface",
        },
    ],
)

schema_path = Path(__file__).parent / "schema.graphql"
type_defs = load_schema_from_path(str(schema_path))
schema = make_executable_schema(type_defs, resolvers)

def get_context_value(request):
    return {
        "request": request,
    }

graphql_app = GraphQL(
    schema, 
    debug=DEBUG,
    context_value=get_context_value
)

app.mount("/graphql", graphql_app)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Star Wars GraphQL API...")
    
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}", exc_info=True)
        raise
    
    try:
        conn = get_db_connection()
        try:
            count = conn.execute("SELECT COUNT(*) FROM characters").fetchone()[0]
            if count == 0:
                logger.info("Database is empty, seeding data...")
                from .seed import seed_data
                seed_data()
                count = conn.execute("SELECT COUNT(*) FROM characters").fetchone()[0]
                logger.info(f"Database seeded with {count} characters")
            else:
                logger.info(f"Database already has {count} characters")
            
            from .auth import get_password_hash
            admin_check = conn.execute(
                "SELECT id FROM users WHERE username = ?",
                ("admin",)
            ).fetchone()
            
            admin_password = get_password_hash("admin123")
            
            if not admin_check:
                conn.execute(
                    "INSERT INTO users (username, email, hashed_password, role) VALUES (?, ?, ?, ?)",
                    ("admin", "admin@starwars.com", admin_password, "admin")
                )
                conn.commit()
                logger.info("✅ Default admin user created: admin/admin123")
            else:
                conn.execute(
                    "UPDATE users SET hashed_password = ? WHERE username = ?",
                    (admin_password, "admin")
                )
                conn.commit()
                logger.info("✅ Admin user password reset: admin/admin123")
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Error during seeding: {e}", exc_info=True)
    
    logger.info(f"API ready! Access GraphiQL at http://localhost:{PORT}/graphql")
    
    print("")
    print("═══════════════════════════════════════════════════════════")
    print("🌟  Star Wars GraphQL API with Python & FastAPI")
    print("═══════════════════════════════════════════════════════════")
    print(f"🚀  Server ready at: http://localhost:{PORT}/graphql")
    print(f"📖  Root endpoint: http://localhost:{PORT}/")
    print(f"💚  Health check: http://localhost:{PORT}/health")
    print(f"📚  API Documentation: http://localhost:{PORT}/docs")
    print(f"📚  API Docs (ReDoc): http://localhost:{PORT}/redoc")
    print("")
    print("📝  Tips:")
    print(f"   - Open GraphiQL: http://localhost:{PORT}/graphql")
    print(f"   - Open Swagger UI: http://localhost:{PORT}/docs")
    print(f"   - Open ReDoc: http://localhost:{PORT}/redoc")
    print("   - Use Insomnia, Postman, or curl to test queries")
    print("   - Press Ctrl+C to stop the server")
    print("═══════════════════════════════════════════════════════════")
    print("")

@app.get(
    "/",
    response_model=RootResponse,
    tags=["root"],
    summary="Root endpoint",
    description="Endpoint utama yang menampilkan informasi API."
)
async def root():
    return {
        "message": "Selamat datang di Star Wars GraphQL API (Enhanced)!",
        "version": "2.0.0",
        "features": [
            "Authentication & Authorization",
            "DataLoader (N+1 Solution)",
            "Input Validation",
            "Error Logging",
            "Unit Tests"
        ],
        "endpoints": {
            "graphql": "/graphql",
            "login": "/auth/login",
            "register": "/auth/register",
            "health": "/health"
        }
    }

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["health"],
    summary="Health check",
    description="Endpoint untuk mengecek status kesehatan API dan koneksi database."
)
async def health():
    try:
        conn = get_db_connection()
        try:
            conn.execute("SELECT 1").fetchone()
            db_status = "connected"
        finally:
            conn.close()
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "version": "2.0.0"
    }

@app.post(
    "/auth/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["authentication"],
    summary="Registrasi user baru",
    description="Endpoint untuk mendaftarkan user baru ke sistem."
)
async def register(input_data: RegisterInput):
    logger.info(f"Registration attempt for username: {input_data.username}")
    
    conn = get_db_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (input_data.username, input_data.email)
        ).fetchone()
        
        if existing:
            logger.warning(f"Registration failed: User already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already exists"
            )
        
        hashed_password = get_password_hash(input_data.password)
        conn.execute(
            "INSERT INTO users (username, email, hashed_password, role) VALUES (?, ?, ?, ?)",
            (input_data.username, input_data.email, hashed_password, input_data.role)
        )
        conn.commit()
        
        logger.info(f"User registered successfully: {input_data.username}")
        return {"message": "User registered successfully", "username": input_data.username}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}", exc_info=True)
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error registering user"
        )
    finally:
        conn.close()

@app.post(
    "/auth/login",
    response_model=LoginResponse,
    tags=["authentication"],
    summary="Login user",
    description="Endpoint untuk login dan mendapatkan JWT access token."
)
async def login(input_data: LoginInput):
    logger.info(f"Login attempt for username: {input_data.username}")
    
    conn = get_db_connection()
    try:
        user = conn.execute(
            "SELECT id, username, email, hashed_password, role FROM users WHERE username = ?",
            (input_data.username,)
        ).fetchone()
        
        if not user or not verify_password(input_data.password, user["hashed_password"]):
            logger.warning(f"Login failed: Invalid credentials for {input_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(
            data={"sub": user["username"], "role": user["role"], "id": user["id"]}
        )
        
        logger.info(f"User logged in successfully: {input_data.username}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "role": user["role"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during login"
        )
    finally:
        conn.close()

@app.get(
    "/auth/me",
    response_model=MeResponse,
    tags=["authentication"],
    summary="Get current user info",
    description="Endpoint untuk mendapatkan informasi user yang sedang login. Memerlukan autentikasi."
)
async def get_me(current_user: dict = Depends(get_current_user)):
    logger.info(f"User info requested for: {current_user.get('sub')}")
    return {
        "id": current_user.get("id"),
        "username": current_user.get("sub"),
        "role": current_user.get("role")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)

