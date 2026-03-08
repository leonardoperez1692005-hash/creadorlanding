import { z } from 'zod'

export const attackVectorSchema = z.object({
    rivalName: z.string(),
    rivalWeakness: z.string(),
    brandStrength: z.string(),
    attackAngle: z.string(),
    outputs: z.object({
        adCopy: z.object({
            headline: z.string(),
            body: z.string(),
            cta: z.string(),
        }),
        tiktokScript: z.object({
            hook: z.string(),
            script: z.string(),
            cta: z.string(),
        }),
        linkedinPost: z.object({
            hook: z.string(),
            body: z.string(),
            hashtags: z.array(z.string()),
        }),
        instagramPost: z
            .object({
                format: z.enum(['reel', 'carousel', 'image']),
                visualConcept: z.string(),
                caption: z.string(),
                hashtags: z.array(z.string()),
            })
            .optional()
            .default({ format: 'image', visualConcept: '', caption: '', hashtags: [] }),
        xPost: z
            .object({
                text: z.string(),
                hashtags: z.array(z.string()),
            })
            .optional()
            .default({ text: '', hashtags: [] }),
        landingSectionCopy: z.object({
            heroHeadline: z.string(),
            heroSubheadline: z.string(),
            benefitTitle: z.string(),
            benefitDescription: z.string(),
            urgencyText: z.string(),
        }),
    }),
})

export const attackPlanSchema = z.object({
    executiveSummary: z.string(),
    attackMatrix: z.array(attackVectorSchema),
    overallStrategy: z.string(),
    landingSections: z.array(z.string()),
    landingContent: z.record(z.string(), z.record(z.string(), z.unknown())),
    clientTasks: z.array(z.string()).default([]),
})

export const attackPlanMetaSchema = z.object({
    intelReportId: z.string(),
    brandIdentityUsed: z.boolean(),
    vectorsGenerated: z.number(),
    generatedAt: z.string(),
})

// =============================================
// Social Media Calendar — Schemas
// =============================================

const socialPlatformSchema = z.enum(['linkedin', 'x', 'tiktok', 'instagram'])

const contentFormatSchema = z.enum([
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
])

const socialPostContentSchema = z.preprocess(
    (val) => {
        // Gemini sometimes returns content as a plain string instead of an object
        if (typeof val === 'string') {
            return { text: val, hashtags: [] }
        }
        return val
    },
    z.object({
        text: z.string(),
        hashtags: z.array(z.string()).default([]),
        visualConcept: z
            .string()
            .nullish()
            .transform((v) => v ?? undefined),
        hook: z
            .string()
            .nullish()
            .transform((v) => v ?? undefined),
    }),
)

const socialPostSchema = z.object({
    platform: socialPlatformSchema,
    contentType: contentFormatSchema,
    topic: z.string(),
    content: socialPostContentSchema,
    bestTime: z.string(),
})

const calendarDaySchema = z.object({
    day: z.number().min(1).max(7),
    dayName: z.string(),
    posts: z.array(socialPostSchema),
})

export const socialMediaCalendarSchema = z.object({
    weeklyTheme: z.string(),
    days: z.array(calendarDaySchema).min(7).max(7),
    tips: z.array(z.string()),
})
