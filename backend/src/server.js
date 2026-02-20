import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import uploadRoutes from './routes/uploads.js';
import brandRoutes from './routes/brand.js';
import leadRoutes from './routes/leads.js';
import adminRoutes from './routes/admin.js';
import licenseRoutes from './routes/license.js';
import exportRoutes from './routes/export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

// --- Plugins ---
const allowedOrigins = [
    'http://localhost:3005',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3006',
    process.env.FRONTEND_URL?.trim(),
].filter(Boolean);

await app.register(cors, {
    origin: (origin, cb) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return cb(null, true);
        if (allowedOrigins.some(o => origin === o)) return cb(null, true);
        // Use cb(null, false) — NOT cb(new Error(...)) which causes 500 in Fastify
        cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
});

// --- Decorate with Prisma ---
app.decorate('prisma', prisma);

// --- Register Routes ---
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(projectRoutes, { prefix: '/api/projects' });
await app.register(uploadRoutes, { prefix: '/api/uploads' });
await app.register(brandRoutes, { prefix: '/api/brand' });
await app.register(leadRoutes, { prefix: '/api/leads' });
await app.register(adminRoutes, { prefix: '/api/admin' });
await app.register(licenseRoutes, { prefix: '/api/license' });
await app.register(exportRoutes, { prefix: '/api/export' });

// --- Preview Route ---
import previewRoutes from './routes/preview.js';
await app.register(previewRoutes, { prefix: '/api/preview' });

// --- AI Route ---
import aiRoutes from './routes/ai.js';
await app.register(aiRoutes, { prefix: '/api/ai' });

// --- Strategy Route (ZentrixOs) ---
import strategyRoutes from './routes/strategy.js';
await app.register(strategyRoutes, { prefix: '/api/strategy' });

import strategyHistoryRoutes from './routes/strategyHistoryRoutes.js';
await app.register(strategyHistoryRoutes, { prefix: '/api/strategy-history' });

// --- Health Check ---
app.get('/api/health', async () => ({ status: 'ok', service: 'StaticLaunch Backend' }));

// --- Root Route ---
app.get('/', async (request, reply) => {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StaticLaunch Backend</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
        }
        .container {
            max-width: 600px;
            padding: 40px;
            text-align: center;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(90deg, #00d4ff, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .version {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 40px;
        }
        .card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            text-align: left;
        }
        .card h3 {
            color: #00d4ff;
            margin-bottom: 15px;
            font-size: 1rem;
        }
        .endpoint {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .endpoint:last-child { border-bottom: none; }
        .method {
            background: #7c3aed;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
        }
        .method.get { background: #10b981; }
        .method.post { background: #3b82f6; }
        .method.put { background: #f59e0b; }
        .method.delete { background: #ef4444; }
        .path { color: #aaa; font-family: monospace; }
        .creds {
            margin-top: 40px;
            padding: 20px;
            background: rgba(0,212,255,0.1);
            border-radius: 12px;
            border: 1px solid rgba(0,212,255,0.2);
        }
        .creds h3 { color: #00d4ff; margin-bottom: 10px; }
        .creds p { font-family: monospace; color: #aaa; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 StaticLaunch</h1>
        <p class="version">Backend API v1.0.0</p>
        
        <div class="card">
            <h3>📡 Endpoints Disponibles</h3>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/health</span>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/auth/login</span>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/projects</span>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/admin/users</span>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/admin/licenses</span>
            </div>
            <div class="endpoint">
                <span class="method put">PUT</span>
                <span class="path">/api/admin/users/:id/suspend</span>
            </div>
            <div class="endpoint">
                <span class="method put">PUT</span>
                <span class="path">/api/admin/users/:id/reactivate</span>
            </div>
        </div>
        
        <div class="creds">
            <h3>🔑 Credenciales de Prueba</h3>
            <p>Email: admin@staticlaunch.com</p>
            <p>Password: admin123</p>
        </div>
    </div>
</body>
</html>`;

    reply.header('Content-Type', 'text/html');
    return html;
});

// --- Graceful Shutdown ---
const shutdown = async () => {
    await prisma.$disconnect();
    await app.close();
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// --- Start ---
const PORT = parseInt(process.env.PORT || '3001', 10);

try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`\n🚀 StaticLaunch Backend running on http://localhost:${PORT}`);
} catch (err) {
    app.log.error(err);
    process.exit(1);
}
