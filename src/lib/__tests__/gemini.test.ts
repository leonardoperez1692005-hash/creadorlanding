import { describe, it, expect } from 'vitest'
import { parseJsonFromAI } from '../gemini'

describe('parseJsonFromAI', () => {
    it('parses raw JSON', () => {
        const raw = '{"name": "test", "value": 42}'
        const result = parseJsonFromAI(raw)
        expect(result).toEqual({ name: 'test', value: 42 })
    })

    it('parses JSON wrapped in markdown code blocks', () => {
        const raw = '```json\n{"key": "value"}\n```'
        const result = parseJsonFromAI(raw)
        expect(result).toEqual({ key: 'value' })
    })

    it('parses JSON with leading text before the object', () => {
        const raw = 'Here is the result:\n{"data": [1, 2, 3]}'
        const result = parseJsonFromAI(raw)
        expect(result).toEqual({ data: [1, 2, 3] })
    })

    it('parses JSON with trailing text after the object', () => {
        const raw = '{"status": "ok"}\nDone.'
        const result = parseJsonFromAI(raw)
        expect(result).toEqual({ status: 'ok' })
    })

    it('handles nested objects', () => {
        const raw = '{"outer": {"inner": {"deep": true}}}'
        const result = parseJsonFromAI(raw)
        expect(result).toEqual({ outer: { inner: { deep: true } } })
    })

    it('throws on completely invalid input', () => {
        expect(() => parseJsonFromAI('not json at all')).toThrow()
    })

    it('throws on empty string', () => {
        expect(() => parseJsonFromAI('')).toThrow()
    })

    it('handles code blocks without json language tag', () => {
        const raw = '```\n{"simple": true}\n```'
        const result = parseJsonFromAI(raw)
        expect(result).toEqual({ simple: true })
    })
})
