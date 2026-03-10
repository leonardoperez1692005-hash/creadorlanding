import { describe, it, expect } from 'vitest'
import { esc, delay, extractYouTubeId } from './utils'

describe('esc()', () => {
    it('escapes HTML special characters', () => {
        expect(esc('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        )
    })

    it('escapes ampersand', () => {
        expect(esc('A & B')).toBe('A &amp; B')
    })

    it('escapes single quotes', () => {
        expect(esc("it's")).toBe('it&#39;s')
    })

    it('returns empty string for null/undefined', () => {
        expect(esc(null)).toBe('')
        expect(esc(undefined)).toBe('')
    })

    it('converts numbers to string', () => {
        expect(esc(42)).toBe('42')
    })
})

describe('delay()', () => {
    it('returns transition-delay style for index 0', () => {
        expect(delay(0)).toBe('style="transition-delay:0ms"')
    })

    it('calculates 80ms increments', () => {
        expect(delay(3)).toBe('style="transition-delay:240ms"')
    })
})

describe('extractYouTubeId()', () => {
    it('extracts from youtube.com/watch?v=', () => {
        expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('extracts from youtu.be/', () => {
        expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('extracts from youtube.com/embed/', () => {
        expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('extracts from youtube.com/shorts/', () => {
        expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('returns null for non-YouTube URLs', () => {
        expect(extractYouTubeId('https://vimeo.com/123456')).toBeNull()
    })

    it('returns null for invalid URLs', () => {
        expect(extractYouTubeId('not a url')).toBeNull()
    })
})
