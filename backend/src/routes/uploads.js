import { authenticate } from '../middleware/auth.js';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export default async function uploadRoutes(app) {
    const prisma = app.prisma;

    // --- Upload Logo ---
    app.post('/logo', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) return reply.status(400).send({ error: 'No se envió archivo' });

            // Create user-scoped Supabase client
            const authHeader = request.headers.authorization;
            const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
                global: { headers: { Authorization: authHeader } }
            });

            // Process with sharp (resize/optimize)
            const buffer = await data.toBuffer();
            const optimizedBuffer = await sharp(buffer)
                .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 90 })
                .toBuffer();

            const filename = `user-${request.user.id}/logo-${Date.now()}.webp`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('logos') // Asegúrate de crear este bucket en Supabase
                .upload(filename, optimizedBuffer, {
                    contentType: 'image/webp',
                    upsert: true
                });

            if (uploadError) {
                console.error('Supabase Upload Error:', uploadError);
                throw new Error('Error subiendo archivo a Supabase');
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('logos')
                .getPublicUrl(filename);

            const logoPath = publicUrl;

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
            console.error('Upload Route Error:', err);
            return reply.status(500).send({ error: 'Error al subir logo', details: err.message });
        }
    });
}
