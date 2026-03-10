import { describe, it, expect } from 'vitest'
import { THEME_PRESETS, getGoogleFontsUrl, getPresetById } from './themes'

describe('THEME_PRESETS', () => {
    it('has 10 presets', () => {
        expect(THEME_PRESETS).toHaveLength(10)
    })

    it('each preset has all required fields', () => {
        for (const preset of THEME_PRESETS) {
            expect(preset.id).toBeTruthy()
            expect(preset.name).toBeTruthy()
            expect(preset.description).toBeTruthy()
            expect(preset.primary).toMatch(/^#[0-9A-Fa-f]{6}$/)
            expect(preset.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/)
            expect(preset.accent).toMatch(/^#[0-9A-Fa-f]{6}$/)
            expect(typeof preset.isDark).toBe('boolean')
            expect(preset.fontHeading).toBeTruthy()
            expect(preset.fontBody).toBeTruthy()
            expect(['sharp', 'rounded', 'pill']).toContain(preset.borderRadius)
            expect(['flat', 'glass', 'bordered', 'elevated']).toContain(preset.cardStyle)
        }
    })

    it('has unique IDs', () => {
        const ids = THEME_PRESETS.map((p) => p.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('has mix of dark and light themes', () => {
        const darkCount = THEME_PRESETS.filter((p) => p.isDark).length
        const lightCount = THEME_PRESETS.filter((p) => !p.isDark).length
        expect(darkCount).toBeGreaterThan(0)
        expect(lightCount).toBeGreaterThan(0)
    })
})

describe('getPresetById()', () => {
    it('returns preset by ID', () => {
        const preset = getPresetById('midnight-tech')
        expect(preset).toBeDefined()
        expect(preset!.name).toBe('Midnight Tech')
        expect(preset!.isDark).toBe(true)
    })

    it('returns undefined for non-existent ID', () => {
        expect(getPresetById('does-not-exist')).toBeUndefined()
    })
})

describe('getGoogleFontsUrl()', () => {
    it('includes heading and body fonts', () => {
        const url = getGoogleFontsUrl('Space Grotesk', 'Inter')
        expect(url).toContain('family=Space+Grotesk')
        expect(url).toContain('family=Inter')
    })

    it('always includes Outfit as fallback', () => {
        const url = getGoogleFontsUrl('Montserrat', 'Lora')
        expect(url).toContain('family=Outfit')
    })

    it('deduplicates when heading equals body', () => {
        const url = getGoogleFontsUrl('Outfit', 'Outfit')
        const matches = url.match(/family=Outfit/g)
        expect(matches).toHaveLength(1)
    })

    it('starts with Google Fonts API URL', () => {
        const url = getGoogleFontsUrl('Inter', 'Inter')
        expect(url).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?/)
    })

    it('includes font weights', () => {
        const url = getGoogleFontsUrl('Inter', 'DM Sans')
        expect(url).toContain(':wght@300;400;600;700;800;900')
    })
})
