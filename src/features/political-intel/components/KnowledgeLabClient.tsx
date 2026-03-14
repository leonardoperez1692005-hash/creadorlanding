'use client'

import { useState } from 'react'
import {
    Database,
    Search,
    Zap,
    CheckCircle,
    AlertCircle,
    Loader2,
    ChevronRight,
    Bug,
} from 'lucide-react'
import {
    indexPoliticianKnowledgeAction,
    queryPoliticianCorpusAction,
    getPoliticianCorpusStatusAction,
    debugScrapeAction,
} from '../actions/knowledge'

// ─── Styles ───────────────────────────────────────────────

const card: React.CSSProperties = {
    background: '#0f1425',
    border: '1px solid #1e2540',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.25rem',
}

const label: React.CSSProperties = {
    display: 'block',
    color: '#A78BFA',
    fontSize: '0.75rem',
    fontWeight: 600,
    marginBottom: '0.3rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
}

const input: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #1e2540',
    background: '#0A0E1A',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
}

const primaryBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.55rem 1.25rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #00c8ff, #7C3AED)',
    border: 'none',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
}

const secondaryBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    background: 'rgba(0,200,255,0.08)',
    border: '1px solid rgba(0,200,255,0.2)',
    color: '#00c8ff',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
}

const debugBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.45rem 0.9rem',
    borderRadius: '8px',
    background: 'rgba(251,191,36,0.08)',
    border: '1px solid rgba(251,191,36,0.25)',
    color: '#FBB124',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
}

const sectionTitle: React.CSSProperties = {
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
}

const grid2: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '0.75rem',
}

const pre: React.CSSProperties = {
    background: '#07090f',
    border: '1px solid #1e2540',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.72rem',
    color: '#8b9ec7',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '220px',
    overflowY: 'auto',
    marginTop: '0.5rem',
}

// ─── Component ────────────────────────────────────────────

export function KnowledgeLabClient() {
    // Indexing form
    const [name, setName] = useState('')
    const [handle, setHandle] = useState('')
    const [topics, setTopics] = useState('inflación, economía, seguridad')
    const [country, setCountry] = useState('ar')
    const [indexing, setIndexing] = useState(false)
    const [indexResult, setIndexResult] = useState<{
        statementsIndexed: number
        corpusName: string
    } | null>(null)
    const [indexError, setIndexError] = useState('')

    // Query form
    const [queryHandle, setQueryHandle] = useState('')
    const [queryText, setQueryText] = useState('')
    const [querying, setQuerying] = useState(false)
    const [queryResults, setQueryResults] = useState<Array<{
        text: string
        score: number
        topic: string
        source_url: string
        date: string
    }> | null>(null)
    const [queryError, setQueryError] = useState('')

    // Status form
    const [statusHandle, setStatusHandle] = useState('')
    const [checkingStatus, setCheckingStatus] = useState(false)
    const [corpusStatus, setCorpusStatus] = useState<{
        exists: boolean
        statementCount: number
        topicsIndexed: string[]
        lastIndexed: string | null
        corpusName: string | null
    } | null>(null)

    // Debug form
    const [debugName, setDebugName] = useState('')
    const [debugHandle, setDebugHandle] = useState('')
    const [debugTopic, setDebugTopic] = useState('reforma laboral')
    const [debugCountry, setDebugCountry] = useState('ar')
    const [debugging, setDebugging] = useState(false)
    const [debugResult, setDebugResult] = useState<{
        query: string
        serpLength: number
        serpSnippet: string
        geminiExtracted: number
        geminiRaw: string
    } | null>(null)
    const [debugError, setDebugError] = useState('')

    // ── Handlers ──────────────────────────────────────────

    async function handleIndex() {
        if (!name.trim() || !handle.trim() || !topics.trim()) return
        setIndexing(true)
        setIndexResult(null)
        setIndexError('')
        const topicList = topics
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        const res = await indexPoliticianKnowledgeAction(
            handle.trim(),
            name.trim(),
            topicList,
            country,
        )
        if (res.success && res.data) {
            setIndexResult(res.data)
            setQueryHandle(handle.trim())
            setStatusHandle(handle.trim())
        } else {
            setIndexError((res as { success: false; error: string }).error)
        }
        setIndexing(false)
    }

    async function handleQuery() {
        if (!queryHandle.trim() || !queryText.trim()) return
        setQuerying(true)
        setQueryResults(null)
        setQueryError('')
        const res = await queryPoliticianCorpusAction(queryHandle.trim(), queryText.trim(), 5)
        if (res.success && res.data) {
            setQueryResults(res.data)
        } else {
            setQueryError((res as { success: false; error: string }).error)
        }
        setQuerying(false)
    }

    async function handleStatus() {
        if (!statusHandle.trim()) return
        setCheckingStatus(true)
        setCorpusStatus(null)
        const res = await getPoliticianCorpusStatusAction(statusHandle.trim())
        if (res.success && res.data) setCorpusStatus(res.data)
        setCheckingStatus(false)
    }

    async function handleDebug() {
        if (!debugName.trim() || !debugTopic.trim()) return
        setDebugging(true)
        setDebugResult(null)
        setDebugError('')
        const res = await debugScrapeAction(
            debugName.trim(),
            debugHandle.trim() || '@unknown',
            debugTopic.trim(),
            debugCountry,
        )
        if (res.success && res.data) {
            setDebugResult(res.data)
        } else {
            setDebugError((res as { success: false; error: string }).error)
        }
        setDebugging(false)
    }

    // ─────────────────────────────────────────────────────

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.4rem',
                    }}
                >
                    <Database size={22} color="#00c8ff" />
                    <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                        Knowledge Lab — RAG Político
                    </h1>
                </div>
                <p style={{ color: '#8b9ec7', fontSize: '0.875rem', margin: 0 }}>
                    Indexá declaraciones de un rival en el corpus de Gemini y verificá que la
                    búsqueda semántica funciona.
                </p>
            </div>

            {/* ─── DIAGNÓSTICO SERP ─── */}
            <div
                style={{
                    ...card,
                    border: '1px solid rgba(251,191,36,0.2)',
                    background: 'rgba(251,191,36,0.03)',
                }}
            >
                <div style={{ ...sectionTitle, color: '#FBB124' }}>
                    <Bug size={18} color="#FBB124" />
                    Diagnóstico SERP — ¿qué está encontrando?
                </div>
                <p
                    style={{
                        color: '#8b9ec7',
                        fontSize: '0.8rem',
                        marginTop: '-0.5rem',
                        marginBottom: '1rem',
                    }}
                >
                    Probá un solo query para ver qué devuelve SERP y cuánto extrae Gemini. Útil para
                    debuggear.
                </p>

                <div style={grid2}>
                    <div>
                        <label htmlFor="kl-debug-name" style={{ ...label, color: '#FBB124' }}>
                            Nombre del político
                        </label>
                        <input
                            id="kl-debug-name"
                            style={input}
                            value={debugName}
                            onChange={(e) => setDebugName(e.target.value)}
                            placeholder="ej. Javier Milei"
                        />
                    </div>
                    <div>
                        <label htmlFor="kl-debug-topic" style={{ ...label, color: '#FBB124' }}>
                            Tema a testear
                        </label>
                        <input
                            id="kl-debug-topic"
                            style={input}
                            value={debugTopic}
                            onChange={(e) => setDebugTopic(e.target.value)}
                            placeholder="ej. reforma laboral"
                        />
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-end',
                        marginBottom: '1rem',
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <label htmlFor="kl-debug-handle" style={{ ...label, color: '#FBB124' }}>
                            Handle (opcional)
                        </label>
                        <input
                            id="kl-debug-handle"
                            style={input}
                            value={debugHandle}
                            onChange={(e) => setDebugHandle(e.target.value)}
                            placeholder="ej. @JMilei"
                        />
                    </div>
                    <div style={{ width: '100px' }}>
                        <label htmlFor="kl-debug-country" style={{ ...label, color: '#FBB124' }}>
                            País
                        </label>
                        <input
                            id="kl-debug-country"
                            style={input}
                            value={debugCountry}
                            onChange={(e) => setDebugCountry(e.target.value)}
                            placeholder="ar"
                        />
                    </div>
                </div>

                <button
                    style={{ ...debugBtn, opacity: debugging ? 0.7 : 1 }}
                    onClick={handleDebug}
                    disabled={debugging || !debugName.trim() || !debugTopic.trim()}
                >
                    {debugging ? <Loader2 size={14} className="animate-spin" /> : <Bug size={14} />}
                    {debugging ? 'Testeando...' : 'Correr diagnóstico'}
                </button>

                {debugError && (
                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '0.6rem 0.875rem',
                            background: 'rgba(248,113,113,0.08)',
                            border: '1px solid rgba(248,113,113,0.2)',
                            borderRadius: '8px',
                        }}
                    >
                        <p style={{ color: '#F87171', fontSize: '0.8rem', margin: 0 }}>
                            <strong>Error:</strong> {debugError}
                        </p>
                    </div>
                )}

                {debugResult && (
                    <div style={{ marginTop: '1rem' }}>
                        {/* Stats row */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                flexWrap: 'wrap',
                                marginBottom: '0.75rem',
                            }}
                        >
                            <div
                                style={{
                                    padding: '0.5rem 0.875rem',
                                    background: 'rgba(16,185,129,0.1)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    borderRadius: '6px',
                                }}
                            >
                                <p
                                    style={{
                                        color: '#8b9ec7',
                                        fontSize: '0.65rem',
                                        margin: '0 0 0.15rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    SERP chars
                                </p>
                                <p
                                    style={{
                                        color: '#10B981',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        margin: 0,
                                    }}
                                >
                                    {debugResult.serpLength.toLocaleString()}
                                </p>
                            </div>
                            <div
                                style={{
                                    padding: '0.5rem 0.875rem',
                                    background:
                                        debugResult.geminiExtracted > 0
                                            ? 'rgba(16,185,129,0.1)'
                                            : 'rgba(248,113,113,0.1)',
                                    border: `1px solid ${debugResult.geminiExtracted > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.2)'}`,
                                    borderRadius: '6px',
                                }}
                            >
                                <p
                                    style={{
                                        color: '#8b9ec7',
                                        fontSize: '0.65rem',
                                        margin: '0 0 0.15rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Gemini extrajo
                                </p>
                                <p
                                    style={{
                                        color:
                                            debugResult.geminiExtracted > 0 ? '#10B981' : '#F87171',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        margin: 0,
                                    }}
                                >
                                    {debugResult.geminiExtracted} declaraciones
                                </p>
                            </div>
                        </div>

                        {/* Query used */}
                        <p
                            style={{
                                color: '#5d7099',
                                fontSize: '0.75rem',
                                marginBottom: '0.4rem',
                            }}
                        >
                            Query SERP:{' '}
                            <code style={{ color: '#A78BFA' }}>{debugResult.query}</code>
                        </p>

                        {/* SERP snippet */}
                        <p
                            style={{
                                color: '#8b9ec7',
                                fontSize: '0.75rem',
                                marginBottom: '0.25rem',
                            }}
                        >
                            Snippet SERP (primeros 800 chars):
                        </p>
                        <pre style={pre}>{debugResult.serpSnippet || '— vacío —'}</pre>

                        {/* Gemini raw */}
                        <p
                            style={{
                                color: '#8b9ec7',
                                fontSize: '0.75rem',
                                marginBottom: '0.25rem',
                                marginTop: '0.75rem',
                            }}
                        >
                            Respuesta Gemini (extracto):
                        </p>
                        <pre
                            style={{
                                ...pre,
                                color: debugResult.geminiExtracted > 0 ? '#10B981' : '#F87171',
                            }}
                        >
                            {debugResult.geminiRaw || '— sin respuesta —'}
                        </pre>
                    </div>
                )}
            </div>

            {/* ─── STEP 1: Indexar ─── */}
            <div style={card}>
                <div style={sectionTitle}>
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #00c8ff, #7C3AED)',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            flexShrink: 0,
                        }}
                    >
                        1
                    </span>
                    Indexar declaraciones del rival
                </div>

                <div style={grid2}>
                    <div>
                        <label htmlFor="kl-name" style={label}>
                            Nombre completo
                        </label>
                        <input
                            id="kl-name"
                            style={input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ej. Javier Milei"
                        />
                    </div>
                    <div>
                        <label htmlFor="kl-handle" style={label}>
                            Handle Twitter/X
                        </label>
                        <input
                            id="kl-handle"
                            style={input}
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            placeholder="ej. @JMilei"
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                    <label htmlFor="kl-topics" style={label}>
                        Temas a buscar (separados por coma)
                    </label>
                    <input
                        id="kl-topics"
                        style={input}
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        placeholder="inflación, economía, dolarización, seguridad"
                    />
                    <span
                        style={{
                            color: '#5d7099',
                            fontSize: '0.75rem',
                            marginTop: '0.25rem',
                            display: 'block',
                        }}
                    >
                        Se buscará qué dijo el rival sobre cada uno de estos temas
                    </span>
                </div>

                <div style={{ marginBottom: '1rem', maxWidth: '160px' }}>
                    <label htmlFor="kl-country" style={label}>
                        País (código)
                    </label>
                    <input
                        id="kl-country"
                        style={input}
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="ar"
                    />
                </div>

                <button
                    style={{ ...primaryBtn, opacity: indexing ? 0.7 : 1 }}
                    onClick={handleIndex}
                    disabled={indexing || !name.trim() || !handle.trim()}
                >
                    {indexing ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                    {indexing ? 'Buscando y indexando...' : 'Indexar declaraciones'}
                </button>

                {indexing && (
                    <p style={{ color: '#8b9ec7', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                        ⏳ Esto puede tardar 30-60 segundos — buscando en la web + extrayendo citas
                        con Gemini + indexando en corpus...
                    </p>
                )}

                {indexResult && (
                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                        }}
                    >
                        <CheckCircle
                            size={16}
                            color="#10B981"
                            style={{ marginTop: '0.1rem', flexShrink: 0 }}
                        />
                        <div>
                            <p
                                style={{
                                    color: '#10B981',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    margin: '0 0 0.25rem',
                                }}
                            >
                                ✅ {indexResult.statementsIndexed} declaraciones indexadas
                            </p>
                            <p
                                style={{
                                    color: '#5d7099',
                                    fontSize: '0.75rem',
                                    margin: 0,
                                    wordBreak: 'break-all',
                                }}
                            >
                                Corpus: {indexResult.corpusName}
                            </p>
                        </div>
                    </div>
                )}

                {indexError && (
                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            background: 'rgba(248,113,113,0.08)',
                            border: '1px solid rgba(248,113,113,0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                        }}
                    >
                        <AlertCircle
                            size={16}
                            color="#F87171"
                            style={{ marginTop: '0.1rem', flexShrink: 0 }}
                        />
                        <p style={{ color: '#F87171', fontSize: '0.875rem', margin: 0 }}>
                            {indexError}
                        </p>
                    </div>
                )}
            </div>

            {/* ─── STEP 2: Query ─── */}
            <div style={card}>
                <div style={sectionTitle}>
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #00c8ff, #7C3AED)',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            flexShrink: 0,
                        }}
                    >
                        2
                    </span>
                    Consultar el corpus (verificar RAG)
                </div>

                <div style={grid2}>
                    <div>
                        <label htmlFor="kl-query-handle" style={label}>
                            Handle del rival
                        </label>
                        <input
                            id="kl-query-handle"
                            style={input}
                            value={queryHandle}
                            onChange={(e) => setQueryHandle(e.target.value)}
                            placeholder="ej. @JMilei"
                        />
                    </div>
                    <div>
                        <label htmlFor="kl-query-text" style={label}>
                            Pregunta / búsqueda semántica
                        </label>
                        <input
                            id="kl-query-text"
                            style={input}
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                            placeholder="¿qué dijo sobre la inflación?"
                            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                        />
                    </div>
                </div>

                <button
                    style={{ ...secondaryBtn, opacity: querying ? 0.7 : 1 }}
                    onClick={handleQuery}
                    disabled={querying || !queryHandle.trim() || !queryText.trim()}
                >
                    {querying ? (
                        <Loader2 size={15} className="animate-spin" />
                    ) : (
                        <Search size={15} />
                    )}
                    {querying ? 'Buscando...' : 'Buscar en corpus'}
                </button>

                {queryResults && (
                    <div style={{ marginTop: '1rem' }}>
                        {queryResults.length === 0 ? (
                            <p style={{ color: '#8b9ec7', fontSize: '0.875rem' }}>
                                Sin resultados relevantes para esa query.
                            </p>
                        ) : (
                            queryResults.map((r, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '0.875rem',
                                        background: '#0A0E1A',
                                        border: '1px solid #1e2540',
                                        borderRadius: '8px',
                                        marginBottom: '0.6rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.4rem',
                                        }}
                                    >
                                        <span
                                            style={{
                                                background: 'rgba(0,200,255,0.1)',
                                                color: '#00c8ff',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '4px',
                                            }}
                                        >
                                            {r.topic || 'general'}
                                        </span>
                                        <span style={{ color: '#5d7099', fontSize: '0.7rem' }}>
                                            Score: {(r.score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <p
                                        style={{
                                            color: '#e2e8f0',
                                            fontSize: '0.875rem',
                                            margin: '0 0 0.4rem',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        &ldquo;{r.text}&rdquo;
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {r.date && (
                                            <span style={{ color: '#5d7099', fontSize: '0.72rem' }}>
                                                📅 {r.date}
                                            </span>
                                        )}
                                        {r.source_url && (
                                            <a
                                                href={r.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: '#A78BFA',
                                                    fontSize: '0.72rem',
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                🔗 Ver fuente
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {queryError && (
                    <p style={{ color: '#F87171', fontSize: '0.875rem', marginTop: '0.75rem' }}>
                        {queryError}
                    </p>
                )}
            </div>

            {/* ─── STEP 3: Status ─── */}
            <div style={card}>
                <div style={sectionTitle}>
                    <span
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            flexShrink: 0,
                            color: '#8b9ec7',
                        }}
                    >
                        3
                    </span>
                    <span style={{ color: '#8b9ec7' }}>Estado del corpus</span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label htmlFor="kl-status-handle" style={label}>
                            Handle
                        </label>
                        <input
                            id="kl-status-handle"
                            style={input}
                            value={statusHandle}
                            onChange={(e) => setStatusHandle(e.target.value)}
                            placeholder="ej. @JMilei"
                        />
                    </div>
                    <button
                        style={{
                            ...secondaryBtn,
                            opacity: checkingStatus ? 0.7 : 1,
                            flexShrink: 0,
                        }}
                        onClick={handleStatus}
                        disabled={checkingStatus || !statusHandle.trim()}
                    >
                        {checkingStatus ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <ChevronRight size={14} />
                        )}
                        Ver estado
                    </button>
                </div>

                {corpusStatus && (
                    <div style={{ marginTop: '1rem' }}>
                        {!corpusStatus.exists ? (
                            <p style={{ color: '#8b9ec7', fontSize: '0.875rem' }}>
                                No hay corpus para ese rival todavía. Indexá primero en el paso 1.
                            </p>
                        ) : (
                            <div
                                style={{
                                    padding: '0.875rem',
                                    background: '#0A0E1A',
                                    border: '1px solid #1e2540',
                                    borderRadius: '8px',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <div>
                                        <span style={{ ...label, marginBottom: '0.15rem' }}>
                                            Declaraciones indexadas
                                        </span>
                                        <span
                                            style={{
                                                color: '#10B981',
                                                fontSize: '1.25rem',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {corpusStatus.statementCount}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ ...label, marginBottom: '0.15rem' }}>
                                            Última indexación
                                        </span>
                                        <span style={{ color: '#e2e8f0', fontSize: '0.8rem' }}>
                                            {corpusStatus.lastIndexed
                                                ? new Date(corpusStatus.lastIndexed).toLocaleString(
                                                      'es-AR',
                                                  )
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                {corpusStatus.topicsIndexed.length > 0 && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <span style={{ ...label, marginBottom: '0.4rem' }}>
                                            Temas indexados
                                        </span>
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.4rem',
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {corpusStatus.topicsIndexed.map((t) => (
                                                <span
                                                    key={t}
                                                    style={{
                                                        background: 'rgba(167,139,250,0.1)',
                                                        color: '#A78BFA',
                                                        fontSize: '0.75rem',
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '20px',
                                                        border: '1px solid rgba(167,139,250,0.2)',
                                                    }}
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <p
                                    style={{
                                        color: '#5d7099',
                                        fontSize: '0.7rem',
                                        marginTop: '0.6rem',
                                        marginBottom: 0,
                                        wordBreak: 'break-all',
                                    }}
                                >
                                    Corpus ID: {corpusStatus.corpusName}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
