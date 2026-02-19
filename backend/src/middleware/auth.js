import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'staticlaunch-secret';

export function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export async function authenticate(request, reply) {
    try {
        // Accept token from Authorization header OR query parameter
        let token = null;

        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (request.query?.token) {
            token = request.query.token;
        }

        if (!token) {
            return reply.status(401).send({ error: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        request.user = decoded;
    } catch {
        return reply.status(401).send({ error: 'Token inválido o expirado' });
    }
}

export async function checkAdmin(request, reply) {
    await authenticate(request, reply);
    if (reply.sent) return;
    // Allow both 'admin' and 'superadmin' roles
    if (request.user.role !== 'admin' && request.user.role !== 'superadmin') {
        return reply.status(403).send({ error: 'Acceso denegado. Se requiere rol admin.' });
    }
}
