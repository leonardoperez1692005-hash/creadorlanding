import { describe, it, expect } from 'vitest'
import { generateLeadsPDF, generateStrategyPDF } from './pdf/pdfGenerator'
import { generateLeadsXLSX } from './xlsx/xlsxGenerator'
import { generateStrategyPPTX } from './pptx/pptxGenerator'
import { generateStrategyDOCX } from './docx/docxGenerator'
import type { Lead } from '@/features/leads/types'
import type { StrategyData, StrategyMeta } from '@/features/strategy/types'

// ─── Mock Data ────────────────────────────────────────

const mockLeads: Lead[] = [
    {
        id: '1',
        name: 'Juan Pérez',
        email: 'juan@test.com',
        phone: '+54 11 1234-5678',
        source: 'landing',
        message: 'Quiero info',
        created_at: '2026-03-01T10:00:00Z',
    },
    {
        id: '2',
        name: 'María García',
        email: 'maria@test.com',
        phone: '',
        source: 'referido',
        message: '',
        created_at: '2026-03-02T14:30:00Z',
    },
]

const mockStrategy: StrategyData = {
    salesAngles: [
        {
            name: 'Ángulo de dolor',
            type: 'emotion',
            hook: 'Estás perdiendo dinero',
            description: 'Apela al dolor económico',
            adVariants: [{ headline: 'No pierdas más', body: 'Descubre cómo ahorrar hoy' }],
        },
    ],
    landingBlueprint: {
        recommendedType: 'VSL',
        sections: [
            { name: 'Hero', purpose: 'Captar atención', suggestedContent: 'Headline impactante' },
            { name: 'Benefits', purpose: 'Mostrar valor', suggestedContent: 'Lista de beneficios' },
        ],
    },
    competitorAnalysis: [
        {
            name: 'Competidor A',
            mainMessage: 'Somos los mejores',
            strengths: ['Marca conocida'],
            weaknesses: ['Precio alto'],
        },
    ],
    marketInsights: {
        trends: ['AI en marketing', 'Automatización'],
        painPoints: ['Falta de tiempo', 'Complejidad técnica'],
        opportunities: ['Mercado en crecimiento'],
    },
    adsStrategy: {
        platforms: ['Facebook', 'Google'],
        hooks: ['Ahorra tiempo', 'Más ventas'],
    },
    contentPillars: [{ pillar: 'Educación', topics: ['Tips de marketing'], tone: 'Profesional' }],
}

const mockStrategyMeta: StrategyMeta = {
    competitorsScraped: 1,
    totalCompetitors: 3,
    hasMarketResearch: true,
    generatedAt: '2026-03-01T10:00:00Z',
}

// ─── PDF Generator ────────────────────────────────────

describe('PDF Generators', () => {
    it('generates leads PDF as Buffer', async () => {
        const buffer = await generateLeadsPDF(mockLeads, 'Proyecto Test')
        expect(buffer).toBeInstanceOf(Buffer)
        expect(buffer.length).toBeGreaterThan(100)
        // PDF magic bytes: %PDF
        expect(buffer.toString('ascii', 0, 4)).toBe('%PDF')
    })

    it('generates strategy PDF as Buffer', async () => {
        const buffer = await generateStrategyPDF(mockStrategy, mockStrategyMeta)
        expect(buffer).toBeInstanceOf(Buffer)
        expect(buffer.length).toBeGreaterThan(100)
        expect(buffer.toString('ascii', 0, 4)).toBe('%PDF')
    })

    it('handles empty leads array', async () => {
        const buffer = await generateLeadsPDF([], 'Empty')
        expect(buffer).toBeInstanceOf(Buffer)
        expect(buffer.toString('ascii', 0, 4)).toBe('%PDF')
    })
})

// ─── XLSX Generator ───────────────────────────────────

describe('XLSX Generators', () => {
    it('generates leads XLSX as Buffer', async () => {
        const buffer = await generateLeadsXLSX(mockLeads, 'Proyecto Test')
        expect(buffer).toBeInstanceOf(Buffer)
        expect(buffer.length).toBeGreaterThan(100)
        // XLSX/ZIP magic bytes: PK
        expect(buffer.toString('ascii', 0, 2)).toBe('PK')
    })

    it('handles empty leads array', async () => {
        const buffer = await generateLeadsXLSX([], 'Empty')
        expect(buffer).toBeInstanceOf(Buffer)
    })
})

// ─── PPTX Generator ──────────────────────────────────

describe('PPTX Generators', () => {
    it('generates strategy PPTX as Buffer', async () => {
        const buffer = await generateStrategyPPTX(mockStrategy, mockStrategyMeta)
        expect(buffer).toBeInstanceOf(Buffer)
        expect(buffer.length).toBeGreaterThan(100)
        // PPTX/ZIP magic bytes: PK
        expect(buffer.toString('ascii', 0, 2)).toBe('PK')
    })
})

// ─── DOCX Generator ──────────────────────────────────

describe('DOCX Generators', () => {
    it('generates strategy DOCX as Buffer', async () => {
        const buffer = await generateStrategyDOCX(mockStrategy, mockStrategyMeta)
        expect(buffer).toBeInstanceOf(Buffer)
        expect(buffer.length).toBeGreaterThan(100)
        // DOCX/ZIP magic bytes: PK
        expect(buffer.toString('ascii', 0, 2)).toBe('PK')
    })
})
