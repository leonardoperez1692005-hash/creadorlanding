import { Play, ArrowRight } from 'lucide-react'
import { extractYouTubeId } from '../../lib/renderers/utils'
import type { SectionPreviewProps } from './types'

export function HeroPreview({ content, m }: SectionPreviewProps) {
    const bgImage = content.bg_image as string | undefined
    const bgVideo = content.bg_video as string | undefined
    const hasBg = bgImage || bgVideo
    const overlayColor = (content.overlay_color as string) || '#000000'
    const opacityRaw =
        content.overlay_opacity !== undefined && content.overlay_opacity !== ''
            ? Number(content.overlay_opacity)
            : 50
    const overlayOpacity = Math.min(Math.max(opacityRaw, 0), 100) / 100

    const eyebrow = content.eyebrow as string | undefined

    // Determine background media
    let bgMediaEl: React.ReactNode = null
    if (bgVideo) {
        const ytId = extractYouTubeId(bgVideo)
        if (ytId) {
            bgMediaEl = (
                <iframe
                    title="Preview"
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3`}
                    allow="autoplay;encrypted-media"
                    frameBorder="0"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: 'calc(100% + 200px)',
                        height: 'calc(100% + 200px)',
                        transform: 'translate(-50%,-50%)',
                        objectFit: 'cover',
                        pointerEvents: 'none',
                        border: 0,
                    }}
                />
            )
        } else {
            bgMediaEl = (
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={bgVideo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
            )
        }
    } else if (bgImage) {
        bgMediaEl = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={bgImage}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
        )
    }

    return (
        <section
            className={`${m ? 'py-16 px-4 min-h-0' : 'py-32 px-6 min-h-[80vh]'} text-center flex flex-col items-center justify-center`}
            style={{ position: 'relative', overflow: 'hidden' }}
        >
            {/* Background media */}
            {hasBg && (
                <>
                    <div
                        aria-hidden="true"
                        style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}
                    >
                        {bgMediaEl}
                    </div>
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 1,
                            background: overlayColor,
                            opacity: overlayOpacity,
                        }}
                    />
                </>
            )}

            {/* Gradient mesh when no custom bg */}
            {!hasBg && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        pointerEvents: 'none',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            width: 400,
                            height: 400,
                            borderRadius: '50%',
                            background: 'var(--preview-primary)',
                            opacity: 0.06,
                            filter: 'blur(120px)',
                            top: -150,
                            right: -80,
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            width: 350,
                            height: 350,
                            borderRadius: '50%',
                            background: 'var(--preview-secondary)',
                            opacity: 0.05,
                            filter: 'blur(100px)',
                            bottom: -120,
                            left: -60,
                        }}
                    />
                </div>
            )}

            {/* Content — z-index above overlays */}
            <div className="max-w-5xl mx-auto" style={{ position: 'relative', zIndex: 2 }}>
                <div
                    className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-8 border border-opacity-30"
                    style={{
                        color: 'var(--preview-primary)',
                        borderColor: 'var(--preview-primary)',
                    }}
                >
                    {eyebrow || 'Nueva Oportunidad'}
                </div>
                <h1
                    className={`${m ? 'text-3xl mb-6' : 'text-5xl md:text-8xl mb-10'} font-extrabold tracking-tight leading-[1.1]`}
                    style={{ color: 'var(--preview-text)' }}
                >
                    {content.headline || 'Título Principal de tu Oferta'}
                </h1>
                <p
                    className={`${m ? 'text-base mb-8' : 'text-xl md:text-3xl mb-12'} opacity-70 font-light max-w-3xl leading-relaxed mx-auto`}
                >
                    {content.subheadline ||
                        'Un subtítulo persuasivo que complementa la gran promesa.'}
                </p>
                {content.video_url && (
                    <div
                        className={`w-full max-w-4xl aspect-video ${m ? 'rounded-xl mb-8' : 'rounded-[2rem] mb-12'} bg-black/40 border-2 flex flex-col items-center justify-center shadow-2xl glass overflow-hidden relative group cursor-pointer mx-auto`}
                        style={{ borderColor: 'var(--preview-primary)' }}
                    >
                        <div
                            className={`${m ? 'w-12 h-12' : 'w-20 h-20'} rounded-full flex items-center justify-center bg-white/10 group-hover:scale-110 transition-transform duration-500 glass`}
                        >
                            <Play
                                fill="currentColor"
                                className="ml-1"
                                style={{ color: 'var(--preview-primary)' }}
                            />
                        </div>
                        <span className="mt-4 font-bold tracking-widest text-xs uppercase opacity-40">
                            Ver Presentación
                        </span>
                    </div>
                )}
                <button
                    className={`group relative ${m ? 'px-8 py-4 rounded-xl text-base' : 'px-12 py-6 rounded-2xl text-xl'} font-black shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all`}
                    style={{ backgroundColor: 'var(--preview-accent)', color: '#FFF' }}
                >
                    <span className="relative z-10 flex items-center gap-3">
                        {content.cta_text || 'Comenzar Ahora'}
                        <ArrowRight size={m ? 18 : 24} />
                    </span>
                    <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 blur-2xl transition-opacity animate-pulse"
                        style={{ backgroundColor: 'var(--preview-accent)' }}
                    ></div>
                </button>
            </div>
        </section>
    )
}
