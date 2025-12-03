import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { initDatabase, db } from './database.js';
import { seedData } from './seed.js';
import {
  getPasswordHash,
  verifyPassword,
  createAccessToken,
  getCurrentUser,
  requireAuth,
  initAdminUser,
} from './auth.js';
import { logger, getLogger, logGraphQLQuery, logGraphQLError } from './logger.js';
import { createLoaders } from './dataloaders.js';

const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const serverLogger = getLogger('server');

  serverLogger.info('🔧 Initializing database...');
  initDatabase();
  initAdminUser();

  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM characters').get();
    if (count.count === 0) {
      serverLogger.info('📦 Database is empty, seeding data...');
      seedData();
    } else {
      serverLogger.info(`✅ Database already has ${count.count} characters`);
    }
  } catch (error) {
    serverLogger.error('Error checking database', { error: error.message, stack: error.stack });
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        requestDidStart() {
          return {
            didResolveOperation({ request }) {
              logGraphQLQuery(request.query, request.variables, request.operationName);
            },
            didEncounterErrors({ errors }) {
              errors.forEach(error => {
                logGraphQLError(error);
              });
            },
          };
        },
      },
    ],
    introspection: true,
  });

  await server.start();
  serverLogger.info('🚀 Apollo Server started!');

  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Star Wars GraphQL API (Node.js + Apollo)',
        version: '1.0.0',
        description: 'API GraphQL yang lengkap dengan fitur-fitur enterprise. Menggunakan Node.js, Apollo Server, dan SQLite.',
        contact: {
          name: 'Star Wars API Support',
          email: 'admin@starwars.com',
        },
        license: {
          name: 'MIT',
        },
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server',
        },
      ],
      tags: [
        {
          name: 'root',
          description: 'Root endpoint dengan informasi API',
        },
        {
          name: 'health',
          description: 'Health check endpoints untuk monitoring',
        },
        {
          name: 'authentication',
          description: 'Endpoints untuk autentikasi dan manajemen user',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Authorization header menggunakan format: Bearer <token>',
          },
        },
        schemas: {
          RootResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Selamat datang di Star Wars GraphQL API (Node.js + Apollo)!',
              },
              graphql: {
                type: 'string',
                example: 'http://localhost:4000/graphql',
              },
              docs: {
                type: 'string',
                example: 'Gunakan Apollo Studio atau GraphiQL client untuk test API',
              },
            },
          },
          HealthResponse: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                example: 'ok',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T12:00:00.000Z',
              },
            },
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                example: 'Error message',
              },
            },
          },
          RegisterInput: {
            type: 'object',
            required: ['username', 'email', 'password'],
            properties: {
              username: {
                type: 'string',
                minLength: 3,
                maxLength: 50,
                description: 'Username yang akan digunakan (3-50 karakter, harus unik)',
                example: 'testuser',
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'Email user (format email valid, harus unik)',
                example: 'test@example.com',
              },
              password: {
                type: 'string',
                minLength: 6,
                maxLength: 72,
                description: 'Password user (minimal 6 karakter, maksimal 72 karakter)',
                example: 'testpass123',
              },
              role: {
                type: 'string',
                enum: ['user', 'admin'],
                default: 'user',
                description: "Role user: 'user' (default) atau 'admin'",
                example: 'user',
              },
            },
          },
          LoginInput: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: {
                type: 'string',
                description: 'Username yang terdaftar di sistem',
                example: 'testuser',
              },
              password: {
                type: 'string',
                description: 'Password user',
                example: 'testpass123',
              },
            },
          },
          RegisterResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'User registered successfully',
              },
              username: {
                type: 'string',
                example: 'testuser',
              },
            },
          },
          LoginResponse: {
            type: 'object',
            properties: {
              access_token: {
                type: 'string',
                description: 'JWT access token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              token_type: {
                type: 'string',
                default: 'bearer',
                example: 'bearer',
              },
              user: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    example: 1,
                  },
                  username: {
                    type: 'string',
                    example: 'testuser',
                  },
                  email: {
                    type: 'string',
                    example: 'test@example.com',
                  },
                  role: {
                    type: 'string',
                    example: 'user',
                  },
                },
              },
            },
          },
          MeResponse: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                example: 1,
              },
              username: {
                type: 'string',
                example: 'testuser',
              },
              role: {
                type: 'string',
                example: 'user',
              },
            },
          },
        },
      },
    },
    apis: [join(__dirname, 'server.js')],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Star Wars GraphQL API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const loaders = createLoaders();
        return { req, loaders };
      },
    })
  );

  /**
   * @swagger
   * /:
   *   get:
   *     summary: Root endpoint dengan informasi API
   *     description: Mengembalikan informasi dasar tentang API dan endpoint yang tersedia
   *     tags: [root]
   *     responses:
   *       200:
   *         description: Informasi API berhasil dikembalikan
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RootResponse'
   */
  app.get('/', (req, res) => {
    res.json({
      message: 'Selamat datang di Star Wars GraphQL API (Node.js + Apollo)!',
      graphql: `http://localhost:${PORT}/graphql`,
      docs: 'Gunakan Apollo Studio atau GraphiQL client untuk test API',
    });
  });

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     description: Mengembalikan status kesehatan server dan timestamp
   *     tags: [health]
   *     responses:
   *       200:
   *         description: Server sehat
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthResponse'
   */
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register user baru
   *     description: Membuat akun user baru dengan username, email, dan password
   *     tags: [authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterInput'
   *     responses:
   *       201:
   *         description: User berhasil didaftarkan
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RegisterResponse'
   *       400:
   *         description: Username atau email sudah terdaftar
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         description: Validasi input gagal
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error server
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/auth/register', express.json(), (req, res) => {
    try {
      const { username, email, password, role = 'user' } = req.body;

      if (!username || !email || !password) {
        return res.status(422).json({ error: 'Username, email, and password are required' });
      }

      if (username.length < 3 || username.length > 50) {
        return res.status(422).json({ error: 'Username must be between 3 and 50 characters' });
      }

      if (password.length < 6 || password.length > 72) {
        return res.status(422).json({ error: 'Password must be between 6 and 72 characters' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(422).json({ error: 'Invalid email format' });
      }

      if (role && !['user', 'admin'].includes(role)) {
        return res.status(422).json({ error: "Role must be 'user' or 'admin'" });
      }

      const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
      if (existing) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      const hashedPassword = getPasswordHash(password);
      db.prepare(
        'INSERT INTO users (username, email, hashed_password, role) VALUES (?, ?, ?, ?)'
      ).run(username, email, hashedPassword, role);

      res.status(201).json({
        message: 'User registered successfully',
        username: username,
      });
    } catch (error) {
      serverLogger.error('Error registering user', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Error registering user' });
    }
  });

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login user
   *     description: Login dengan username dan password untuk mendapatkan JWT access token
   *     tags: [authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginInput'
   *     responses:
   *       200:
   *         description: Login berhasil, token dikembalikan
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       401:
   *         description: Username atau password salah
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         description: Username dan password wajib diisi
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error server
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/auth/login', express.json(), (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(422).json({ error: 'Username and password are required' });
      }

      const user = db.prepare(
        'SELECT id, username, email, hashed_password, role FROM users WHERE username = ?'
      ).get(username);

      if (!user || !verifyPassword(password, user.hashed_password)) {
        return res.status(401).json({ error: 'Incorrect username or password' });
      }

      const access_token = createAccessToken({
        sub: user.username,
        role: user.role,
        id: user.id,
      });

      res.json({
        access_token,
        token_type: 'bearer',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      serverLogger.error('Error during login', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Error during login' });
    }
  });

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Get current user info
   *     description: Mengembalikan informasi user yang sedang login (memerlukan autentikasi)
   *     tags: [authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Informasi user berhasil dikembalikan
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MeResponse'
   *       401:
   *         description: Autentikasi diperlukan atau token tidak valid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error server
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/auth/me', (req, res) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      res.json({
        id: user.id,
        username: user.sub,
        role: user.role,
      });
    } catch (error) {
      serverLogger.error('Error getting user info', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Error getting user info' });
    }
  });

  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

  serverLogger.info('');
  serverLogger.info('═══════════════════════════════════════════════════════════');
  serverLogger.info('🌟  Star Wars GraphQL API with Node.js & Apollo Server');
  serverLogger.info('═══════════════════════════════════════════════════════════');
  serverLogger.info(`🚀  Server ready at: http://localhost:${PORT}/graphql`);
  serverLogger.info(`📖  Root endpoint: http://localhost:${PORT}/`);
  serverLogger.info(`💚  Health check: http://localhost:${PORT}/health`);
  serverLogger.info(`📚  API Documentation: http://localhost:${PORT}/docs`);
  serverLogger.info('');
  serverLogger.info('📝  Tips:');
  serverLogger.info(`   - Open Apollo Studio Sandbox: http://localhost:${PORT}/graphql`);
  serverLogger.info(`   - Open Swagger UI: http://localhost:${PORT}/docs`);
  serverLogger.info('   - Use GraphiQL, Insomnia, or Postman to test queries');
  serverLogger.info('   - Press Ctrl+C to stop the server');
  serverLogger.info('═══════════════════════════════════════════════════════════');
  serverLogger.info('');
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🌟  Star Wars GraphQL API with Node.js & Apollo Server');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🚀  Server ready at: http://localhost:${PORT}/graphql`);
    console.log(`📖  Root endpoint: http://localhost:${PORT}/`);
    console.log(`💚  Health check: http://localhost:${PORT}/health`);
    console.log(`📚  API Documentation: http://localhost:${PORT}/docs`);
    console.log('');
    console.log('📝  Tips:');
    console.log(`   - Open Apollo Studio Sandbox: http://localhost:${PORT}/graphql`);
    console.log(`   - Open Swagger UI: http://localhost:${PORT}/docs`);
    console.log('   - Use GraphiQL, Insomnia, or Postman to test queries');
    console.log('   - Press Ctrl+C to stop the server');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  }
}

process.on('SIGINT', () => {
  logger.info('👋 Shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('👋 Shutting down gracefully...');
  db.close();
  process.exit(0);
});

startServer().catch((error) => {
  logger.error('❌ Error starting server', { error: error.message, stack: error.stack });
  process.exit(1);
});


