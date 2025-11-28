import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import { db } from './database.js';

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-in-production-use-long-random-string';
const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '30', 10);

function _truncatePasswordBytes(password) {
  const passwordBytes = Buffer.from(password, 'utf-8');
  if (passwordBytes.length > 72) {
    return passwordBytes.slice(0, 72);
  }
  return passwordBytes;
}

export function verifyPassword(plainPassword, hashedPassword) {
  const passwordBytes = _truncatePasswordBytes(plainPassword);
  return bcrypt.compareSync(passwordBytes, hashedPassword);
}

export function getPasswordHash(password) {
  const passwordBytes = _truncatePasswordBytes(password);
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(passwordBytes, salt);
}

export function createAccessToken(data) {
  const expiresIn = ACCESS_TOKEN_EXPIRE_MINUTES * 60;
  const payload = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };
  return jwt.sign(payload, SECRET_KEY, { algorithm: ALGORITHM });
}

export function verifyToken(token) {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Token is empty or not a string');
    }

    let cleanToken = token.trim();

    if (cleanToken.startsWith('Bearer ')) {
      cleanToken = cleanToken.substring(7).trim();
    }

    const tokenParts = cleanToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format: JWT token must have 3 parts separated by dots');
    }

    const payload = jwt.verify(cleanToken, SECRET_KEY, { algorithms: [ALGORITHM] });

    if (!payload.sub) {
      throw new Error('Invalid token: missing username');
    }

    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error(`Invalid token: ${error.message}`);
    }
    throw error;
  }
}

export function getCurrentUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export function requireAuth(req) {
  const user = getCurrentUser(req);
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
  return user;
}

export function requireAdmin(req) {
  const user = requireAuth(req);
  if (user.role !== 'admin') {
    throw new GraphQLError('Admin access required', {
      extensions: {
        code: 'FORBIDDEN',
        http: { status: 403 },
      },
    });
  }
  return user;
}

export function initAdminUser() {
  try {
    const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!admin) {
      const hashedPassword = getPasswordHash('admin123');
      db.prepare(
        'INSERT INTO users (username, email, hashed_password, role) VALUES (?, ?, ?, ?)'
      ).run('admin', 'admin@starwars.com', hashedPassword, 'admin');
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}

