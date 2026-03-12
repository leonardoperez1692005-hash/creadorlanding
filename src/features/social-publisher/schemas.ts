// =============================================
// Social Publisher — Zod Schemas
// =============================================

import { z } from 'zod'

export const publishPostInputSchema = z.object({
    accountId: z.string().uuid('ID de cuenta inválido'),
    post: z.object({
        platform: z.enum(['linkedin', 'x', 'tiktok', 'instagram']),
        contentType: z.enum([
            'post',
            'carousel',
            'reel',
            'story',
            'video',
            'duet',
            'article',
            'poll',
            'thread',
            'tweet',
        ]),
        topic: z.string().min(1),
        content: z.object({
            text: z.string().min(1, 'El texto del post es requerido'),
            hashtags: z.array(z.string()),
            visualConcept: z.string().optional(),
            hook: z.string().optional(),
        }),
        bestTime: z.string(),
    }),
})

export const schedulePostInputSchema = z.object({
    accountId: z.string().uuid('ID de cuenta inválido'),
    post: z.object({
        platform: z.enum(['linkedin', 'x', 'tiktok', 'instagram']),
        contentType: z.enum([
            'post',
            'carousel',
            'reel',
            'story',
            'video',
            'duet',
            'article',
            'poll',
            'thread',
            'tweet',
        ]),
        topic: z.string().min(1),
        content: z.object({
            text: z.string().min(1, 'El texto del post es requerido'),
            hashtags: z.array(z.string()),
            visualConcept: z.string().optional(),
            hook: z.string().optional(),
        }),
        bestTime: z.string(),
    }),
    scheduledFor: z
        .string()
        .refine(
            (val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(),
            'La fecha de programación debe ser futura',
        ),
    reportId: z.string().uuid().optional(),
    planId: z.string().uuid().optional(),
})

export const cancelScheduledPostInputSchema = z.object({
    scheduledPostId: z.string().uuid('ID de post programado inválido'),
})

export const disconnectAccountInputSchema = z.object({
    accountId: z.string().uuid('ID de cuenta inválido'),
})

export const scheduleDayInputSchema = z.object({
    accountIds: z.record(z.enum(['linkedin', 'x', 'tiktok', 'instagram']), z.string().uuid()),
    posts: z.array(
        z.object({
            platform: z.enum(['linkedin', 'x', 'tiktok', 'instagram']),
            contentType: z.enum([
                'post',
                'carousel',
                'reel',
                'story',
                'video',
                'duet',
                'article',
                'poll',
                'thread',
                'tweet',
            ]),
            topic: z.string().min(1),
            content: z.object({
                text: z.string().min(1),
                hashtags: z.array(z.string()),
                visualConcept: z.string().optional(),
                hook: z.string().optional(),
            }),
            bestTime: z.string(),
        }),
    ),
    baseDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha base inválida'),
    reportId: z.string().uuid().optional(),
    planId: z.string().uuid().optional(),
})
