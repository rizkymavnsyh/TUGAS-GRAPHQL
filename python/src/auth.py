from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import logging
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import get_db_connection
from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

logger = logging.getLogger("starwars_api.auth")

security = HTTPBearer(auto_error=False)

def _truncate_password_bytes(password: str) -> bytes:
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        return password_bytes[:72]
    return password_bytes

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = _truncate_password_bytes(plain_password)
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def get_password_hash(password: str) -> str:
    password_bytes = _truncate_password_bytes(password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if credentials is None:
        logger.warning("Authentication attempt without credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please provide Authorization header with Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    
    if not token or not isinstance(token, str):
        logger.warning("Token is empty or not a string")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: token is empty",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = token.strip()
    
    if token.startswith("Bearer "):
        token = token[7:].strip()
        logger.warning("Token contains 'Bearer ' prefix, removing it")
    
    token_parts = token.split('.')
    if len(token_parts) != 3:
        logger.warning(f"Invalid token format: expected 3 parts, got {len(token_parts)}. Token preview: {token[:50]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format: JWT token must have 3 parts separated by dots",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.debug(f"Verifying token: {token[:20]}... (length: {len(token)})")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            logger.warning("Token missing username field")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing username",
                headers={"WWW-Authenticate": "Bearer"},
            )
        logger.info(f"Token verified successfully for user: {username}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        logger.error(f"Token verification failed: {str(e)}. Token preview: {token[:50]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_role(required_role: str):
    def role_checker(user: dict = Depends(verify_token)):
        user_role = user.get("role", "user")
        if user_role != required_role and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role} role"
            )
        return user
    return role_checker

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    return verify_token(credentials)

def is_admin(user: dict = Depends(get_current_user)) -> bool:
    return user.get("role") == "admin"

def get_user_from_context(info):
    request = info.context.get("request")
    if not request:
        return None

    auth_header = None
    headers = request.headers if hasattr(request, 'headers') else {}

    for header_name in ['authorization', 'Authorization', 'AUTHORIZATION']:
        if header_name in headers:
            auth_header = headers[header_name]
            break
    
    if not auth_header:
        return None


    if isinstance(auth_header, str) and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "").strip()

    elif isinstance(auth_header, str):
        token = auth_header.strip()

    else:
        logger.warning(f"Unexpected auth header format: {type(auth_header)}")
        return None
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.debug(f"JWT decode error: {e}")
        return None

def require_auth(info):
    """
    Require authentication for GraphQL operations.
    Raises GraphQLError if user is not authenticated.
    
    IMPORTANT: Authorization must be sent as HTTP Header, NOT as GraphQL variable!
    Format: Authorization: Bearer <token>
    """
    user = get_user_from_context(info)
    if not user:
        raise Exception(
            "Authentication required. "
            "Please add 'Authorization: Bearer <token>' to HTTP Headers (NOT GraphQL Variables!). "
            "Login at /auth/login to get a token."
        )
    return user

def require_admin(info):
    user = require_auth(info)
    if user.get("role") != "admin":
        raise Exception("Admin access required")
    return user

