import { authenticate } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

export default async function uploadRoutes(app) {
    const prisma = app.prisma;

    // --- Upload Logo ---
    app.post('/logo', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) return reply.status(400).send({ error: 'No se envió archivo' });

            // Ensure upload dir exists
            const userDir = path.join(UPLOAD_DIR, `user-${request.user.id}`);
            await fs.mkdir(userDir, { recursive: true });

            // Process with sharp
            const filename = `logo-${Date.now()}.webp`;
            const filepath = path.join(userDir, filename);

            const buffer = await data.toBuffer();
            await sharp(buffer)
                .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 90 })
                .toFile(filepath);

            const logoPath = `/uploads/user-${request.user.id}/${filename}`;

            // Extract palette with node-vibrant
            // Pastel Modern defaults (override via Vibrant extraction below)
            let suggestedPalette = {
                primary: '#B8B5FF',
                secondary: '#FFB6C1',
                accent: '#98D8C8',
                background: '#1A1A2E',
            };

            let suggestedTypography = {
                heading: 'Inter',
                body: 'Inter'
            };

            try {
                const VibrantModule = await import('node-vibrant/node');
                const Vibrant = VibrantModule.default || VibrantModule.Vibrant;
                const palette = await Vibrant.from(buffer).getPalette();
                if (palette) {
                    suggestedPalette = {
                        primary: palette.Vibrant?.hex || '#B8B5FF',
                        secondary: palette.LightVibrant?.hex || palette.Muted?.hex || '#FFB6C1',
                        accent: palette.DarkVibrant?.hex || '#98D8C8',
                        // Keep background neutral so landing is readable
                        background: '#1A1A2E',
                    };

                    // Heurástica de tipografía basada en la "vibra" del color
                    // Si hay mucha saturación (Vibrant), ir por algo Tech/Cyber
                    // Si es apagado (Muted), ir por algo Elegante/Ems
                    const vibrantPop = palette.Vibrant?.population || 0;
                    const mutedPop = palette.Muted?.population || 0;

                    if (vibrantPop > mutedPop) {
                        suggestedTypography = {
                            heading: 'Orbitron',
                            body: 'Rajdhani'
                        };
                    } else if (palette.LightMuted) {
                        suggestedTypography = {
                            heading: 'Montserrat',
                            body: 'Inter'
                        };
                    } else {
                        suggestedTypography = {
                            heading: 'Inter',
                            body: 'Inter'
                        };
                    }
                }
            } catch (err) {
                console.error('Vibrant error:', err);
                // Fallback to defaults
            }

            // Upsert brand identity
            await prisma.brandIdentity.upsert({
                where: { userId: request.user.id },
                create: {
                    userId: request.user.id,
                    logoPath,
                    designTokens: JSON.stringify({
                        colors: suggestedPalette,
                        typography: suggestedTypography
                    }),
                },
                update: {
                    logoPath,
                    designTokens: JSON.stringify({
                        colors: suggestedPalette,
                        typography: suggestedTypography
                    })
                },
            });

            return reply.send({ logoPath, suggestedPalette, suggestedTypography });
        } catch (err) {
            return reply.status(500).send({ error: 'Error al subir logo', details: err.message });
        }
    });
}
