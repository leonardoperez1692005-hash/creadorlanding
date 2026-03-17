import Image from 'next/image'
import { Clock } from 'lucide-react'
import { sanitizeHtml } from '@/shared/lib/sanitize'
import type { SectionPreviewProps, ContentItem } from './types'

export function ComparisonPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    const cmpBg: React.CSSProperties = {
        ...(content.bg_color ? { backgroundColor: content.bg_color } : {}),
        ...(content.bg_image
            ? {
                  backgroundImage: `url(${content.bg_image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
              }
            : {}),
        position: 'relative' as const,
    }
    const cmpText = content.text_color || undefined
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-5xl mx-auto`} style={cmpBg}>
            {content.bg_image && <div className="absolute inset-0 bg-black/60" />}
            <div className="relative z-10">
                <h2
                    className={`${m ? 'text-2xl mb-2' : 'text-4xl mb-3'} font-bold text-center`}
                    style={{ color: cmpText }}
                >
                    {content.title || '¿Por qué elegirnos?'}
                </h2>
                {content.subtitle && (
                    <p
                        className={`text-center opacity-60 ${m ? 'text-sm mb-6' : 'text-lg mb-10'}`}
                        style={{ color: cmpText }}
                    >
                        {content.subtitle}
                    </p>
                )}
                <div className={`grid grid-cols-2 ${m ? 'gap-2 mb-4' : 'gap-4 mb-6'}`}>
                    <div
                        className={`text-center ${m ? 'p-2 text-xs' : 'p-3 text-sm'} font-bold uppercase tracking-wider rounded-xl`}
                        style={{
                            color: '#ef4444',
                            backgroundColor: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.12)',
                        }}
                    >
                        😰 {content.without_title || 'Sin Nosotros'}
                    </div>
                    <div
                        className={`text-center ${m ? 'p-2 text-xs' : 'p-3 text-sm'} font-bold uppercase tracking-wider rounded-xl`}
                        style={{
                            color: '#22c55e',
                            backgroundColor: 'rgba(34,197,94,0.08)',
                            border: '1px solid rgba(34,197,94,0.12)',
                        }}
                    >
                        🚀 {content.with_title || 'Con Nosotros'}
                    </div>
                </div>
                <div className={`${m ? 'space-y-2' : 'space-y-3'}`}>
                    {items.length > 0
                        ? items.map((item, i) => (
                              <div key={i} className={`grid grid-cols-2 ${m ? 'gap-2' : 'gap-4'}`}>
                                  <div
                                      className={`${m ? 'p-3 rounded-lg text-xs' : 'p-5 rounded-xl text-sm'} flex items-start gap-2`}
                                      style={{
                                          backgroundColor: 'rgba(239,68,68,0.06)',
                                          border: '1px solid rgba(239,68,68,0.15)',
                                      }}
                                  >
                                      <span style={{ color: '#ef4444', fontWeight: 900 }}>✗</span>
                                      <span className="opacity-60" style={{ color: cmpText }}>
                                          {item.without || ''}
                                      </span>
                                  </div>
                                  <div
                                      className={`${m ? 'p-3 rounded-lg text-xs' : 'p-5 rounded-xl text-sm'} flex items-start gap-2`}
                                      style={{
                                          backgroundColor: 'rgba(34,197,94,0.06)',
                                          border: '1px solid rgba(34,197,94,0.2)',
                                      }}
                                  >
                                      <span style={{ color: '#22c55e', fontWeight: 900 }}>✓</span>
                                      <span className="font-semibold" style={{ color: cmpText }}>
                                          {item.with || ''}
                                      </span>
                                  </div>
                              </div>
                          ))
                        : [1, 2, 3].map((i) => (
                              <div key={i} className={`grid grid-cols-2 ${m ? 'gap-2' : 'gap-4'}`}>
                                  <div
                                      className={`${m ? 'p-3 rounded-lg' : 'p-5 rounded-xl'} opacity-20`}
                                      style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
                                  >
                                      <div className="h-3 rounded bg-current w-3/4" />
                                  </div>
                                  <div
                                      className={`${m ? 'p-3 rounded-lg' : 'p-5 rounded-xl'} opacity-20`}
                                      style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}
                                  >
                                      <div className="h-3 rounded bg-current w-3/4" />
                                  </div>
                              </div>
                          ))}
                </div>
                {content.cta_text && (
                    <div className={`text-center ${m ? 'mt-6' : 'mt-10'}`}>
                        <span
                            className={`inline-block ${m ? 'px-6 py-2.5 text-sm' : 'px-10 py-4 text-base'} font-bold rounded-2xl`}
                            style={{ background: 'var(--primary, #00F0FF)', color: '#000' }}
                        >
                            {content.cta_text}
                        </span>
                    </div>
                )}
            </div>
        </section>
    )
}

export function CountdownPreview({ content, m }: SectionPreviewProps) {
    return (
        <section
            className={`${m ? 'py-12 px-4' : 'py-24 px-6'} text-center max-w-4xl mx-auto border-t border-opacity-10`}
            style={{ borderColor: 'var(--preview-muted)' }}
        >
            <div className="flex items-center justify-center gap-3 mb-8 opacity-60">
                <Clock size={m ? 18 : 24} />
                <h3
                    className={`${m ? 'text-base' : 'text-xl'} font-bold uppercase tracking-widest`}
                >
                    {content.headline || 'La oferta expira en:'}
                </h3>
            </div>
            <div className={`flex justify-center ${m ? 'gap-3' : 'gap-4 md:gap-8'} mb-12`}>
                {['Días', 'Horas', 'Min', 'Seg'].map((u) => (
                    <div
                        key={u}
                        className={`flex flex-col items-center justify-center ${m ? 'p-3 w-16 h-16 rounded-xl' : 'p-6 w-24 h-24 md:w-36 md:h-36 rounded-[2.5rem]'} glass shadow-2xl relative group overflow-hidden`}
                        style={{ backgroundColor: 'var(--preview-card-bg)' }}
                    >
                        <span
                            className={`${m ? 'text-2xl' : 'text-4xl md:text-6xl'} font-black mb-1 group-hover:scale-110 transition-transform duration-500`}
                            style={{ color: 'var(--preview-primary)' }}
                        >
                            00
                        </span>
                        <span
                            className={`${m ? 'text-[8px]' : 'text-[10px] md:text-xs'} uppercase tracking-[0.2em] font-black opacity-40`}
                        >
                            {u}
                        </span>
                        <div
                            className="absolute inset-0 bg-current opacity-0 group-hover:opacity-5 transition-opacity"
                            style={{ color: 'var(--preview-primary)' }}
                        ></div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export function UrgencyPreview({ content, m }: SectionPreviewProps) {
    const urgTitle = content.title || content.text || '⚡ OFERTA VÁLIDA POR TIEMPO LIMITADO ⚡'
    const urgDesc = content.title ? content.text || '' : ''
    const urgHasImage = content.image && String(content.image).trim()
    const urgHasCta = content.cta_text && String(content.cta_text).trim()
    const urgBg: React.CSSProperties = {
        backgroundColor: content.bg_color || 'var(--preview-accent)',
        ...(content.bg_image
            ? {
                  backgroundImage: `url(${content.bg_image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
              }
            : {}),
        position: 'relative' as const,
    }
    if (!urgDesc && !urgHasImage && !content.bg_image && !urgHasCta) {
        return (
            <section
                className={`${m ? 'py-4 px-4 text-sm' : 'py-6 px-6 text-xl'} text-center font-black tracking-widest uppercase shadow-lg z-10 relative`}
                style={{ backgroundColor: 'var(--preview-accent)', color: '#FFF' }}
            >
                {urgTitle as string}
            </section>
        )
    }
    return (
        <section className={`${m ? 'py-10 px-4' : 'py-16 px-6'} relative`} style={urgBg}>
            {content.bg_image && <div className="absolute inset-0 bg-black/50" />}
            <div
                className={`relative z-10 max-w-5xl mx-auto ${urgHasImage ? `grid ${m ? 'grid-cols-1 gap-6' : 'grid-cols-2 gap-10'} items-center` : 'text-center'}`}
            >
                <div>
                    <h2 className={`${m ? 'text-xl' : 'text-3xl'} font-black text-white mb-3`}>
                        {urgTitle as string}
                    </h2>
                    {urgDesc && (
                        <p
                            className={`${m ? 'text-sm' : 'text-base'} text-white/80 leading-relaxed ${urgHasImage ? '' : 'max-w-xl mx-auto'} mb-5`}
                        >
                            {urgDesc}
                        </p>
                    )}
                    {urgHasCta && (
                        <span
                            className={`inline-block ${m ? 'px-6 py-2.5 text-sm' : 'px-9 py-3.5 text-base'} font-bold rounded-xl`}
                            style={{
                                background: '#fff',
                                color: content.bg_color || 'var(--preview-accent)',
                            }}
                        >
                            {content.cta_text}
                        </span>
                    )}
                </div>
                {urgHasImage && (
                    <div
                        className={`${m ? 'rounded-xl' : 'rounded-2xl'} overflow-hidden border-2 border-white/15`}
                    >
                        <Image
                            src={content.image!}
                            alt="Urgency section image"
                            width={800}
                            height={500}
                            unoptimized
                            className="w-full h-auto object-cover"
                            style={{ aspectRatio: '16/10' }}
                        />
                    </div>
                )}
            </div>
        </section>
    )
}

export function OfferPreview({ content, m }: SectionPreviewProps) {
    return (
        <section className={`${m ? 'py-16 px-4' : 'py-32 px-6'} max-w-4xl mx-auto text-center`}>
            <div
                className={`inline-block ${m ? 'p-8 rounded-3xl border-2 min-w-0 w-full' : 'p-16 rounded-[4rem] border-4 min-w-[400px] md:w-auto'} w-full shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group glass`}
                style={{
                    borderColor: 'var(--preview-secondary)',
                    backgroundColor: 'var(--preview-bg)',
                }}
            >
                <div
                    className="absolute top-0 inset-x-0 h-3 animate-pulse"
                    style={{ backgroundColor: 'var(--preview-secondary)' }}
                ></div>
                <span className="inline-block px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-8 opacity-40">
                    Propuesta Única
                </span>
                <h2 className={`${m ? 'text-2xl mb-4' : 'text-5xl mb-8'} font-extrabold`}>
                    {content.title || 'Oferta Especial'}
                </h2>
                <div
                    className={`${m ? 'text-5xl mb-6' : 'text-8xl mb-12'} font-black tracking-tighter`}
                    style={{ color: 'var(--preview-primary)' }}
                >
                    {content.price_current || '$97'}
                </div>
                <button
                    className={`w-full ${m ? 'px-6 py-4 rounded-xl text-lg' : 'px-12 py-6 rounded-2xl text-2xl'} font-black hover:scale-105 transition-transform block shadow-xl active:scale-95`}
                    style={{ backgroundColor: 'var(--preview-accent)', color: '#FFF' }}
                >
                    {content.cta_text || 'Comprar Ahora'}
                </button>
            </div>
        </section>
    )
}

export function StoryPreview({ content, m }: SectionPreviewProps) {
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
            <div
                className={`prose ${m ? 'prose-base' : 'prose-xl'} mx-auto text-current opacity-90 leading-relaxed max-w-full`}
            >
                <div
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(
                            (content.text as string) ||
                                '<p>Aquí va el texto de tu historia envolvente...</p>',
                        ),
                    }}
                />
            </div>
        </section>
    )
}

export function SolutionPreview({ content, m }: SectionPreviewProps) {
    return (
        <section
            className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-5xl mx-auto text-center border-y border-opacity-10 my-10`}
            style={{ borderColor: 'var(--preview-muted)' }}
        >
            <h2
                className={`${m ? 'text-2xl mb-6' : 'text-5xl mb-10'} font-bold`}
                style={{ color: 'var(--preview-secondary)' }}
            >
                {content.title || 'La Solución Definitiva'}
            </h2>
            <p
                className={`${m ? 'text-base' : 'text-2xl'} opacity-90 leading-relaxed max-w-4xl mx-auto`}
            >
                {content.text ||
                    'Explicación detallada de cómo tu solución resuelve el problema del framework anterior.'}
            </p>
        </section>
    )
}

export function GuaranteePreview({ content, m }: SectionPreviewProps) {
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto text-center`}>
            <div
                className={`${m ? 'p-6 rounded-2xl' : 'p-12 rounded-[3rem]'} border-2 glass`}
                style={{
                    borderColor: 'var(--preview-secondary)',
                    backgroundColor: 'var(--preview-card-bg)',
                }}
            >
                <div className={`${m ? 'text-4xl mb-4' : 'text-7xl mb-8'}`}>🛡️</div>
                <h2
                    className={`${m ? 'text-xl mb-3' : 'text-3xl mb-6'} font-extrabold`}
                    style={{ color: 'var(--preview-secondary)' }}
                >
                    {content.title || 'Garantía de Satisfacción'}
                </h2>
                <p
                    className={`opacity-70 ${m ? 'text-sm' : 'text-lg'} leading-relaxed max-w-2xl mx-auto`}
                >
                    {content.text || 'Si no estás 100% satisfecho, te devolvemos tu dinero.'}
                </p>
                {content.period && (
                    <p
                        className={`mt-4 font-bold ${m ? 'text-sm' : 'text-base'}`}
                        style={{ color: 'var(--preview-primary)' }}
                    >
                        {content.period}
                    </p>
                )}
            </div>
        </section>
    )
}

export function HtmlEmbedPreview({ content, m }: SectionPreviewProps) {
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto text-center`}>
            {content.title && (
                <h2 className={`${m ? 'text-2xl mb-6' : 'text-4xl mb-10'} font-bold`}>
                    {content.title}
                </h2>
            )}
            <div
                className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-2xl'} border glass`}
                style={{
                    backgroundColor: 'var(--preview-card-bg)',
                    borderColor: 'var(--preview-muted)',
                }}
            >
                {content.html_code ? (
                    <div
                        className="opacity-60 text-sm font-mono text-left overflow-hidden"
                        style={{ maxHeight: '200px' }}
                    >
                        <div className="flex items-center gap-2 mb-3 opacity-50">
                            <div className="w-3 h-3 rounded-full bg-red-500/60" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                            <div className="w-3 h-3 rounded-full bg-green-500/60" />
                            <span className="text-xs ml-2">HTML Embed</span>
                        </div>
                        <code className="text-xs opacity-40 break-all">
                            {content.html_code.substring(0, 200)}...
                        </code>
                    </div>
                ) : (
                    <p className="opacity-30 text-sm">Código HTML embebido aparecerá aquí</p>
                )}
            </div>
        </section>
    )
}

export function SpeakerPreview({ content, m }: SectionPreviewProps) {
    return (
        <section
            className={`${m ? 'py-16 px-4 flex-col gap-8' : 'py-32 px-6 md:flex-row gap-16'} max-w-5xl mx-auto flex flex-col items-center`}
        >
            <div
                className={`${m ? 'w-48 h-48 rounded-2xl' : 'w-80 h-80 rounded-[3rem]'} bg-opacity-10 border-4 flex-shrink-0 overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 glass`}
                style={{
                    backgroundColor: 'var(--preview-card-bg)',
                    borderColor: 'var(--preview-primary)',
                }}
            >
                {content.photo ? (
                    <Image
                        src={content.photo}
                        alt="Speaker"
                        width={320}
                        height={320}
                        unoptimized
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-30 text-5xl font-black">
                        FOTO
                    </div>
                )}
            </div>
            <div className={`text-center ${m ? '' : 'md:text-left'}`}>
                <div
                    className="inline-block px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-6 border border-opacity-30"
                    style={{ color: 'var(--preview-accent)', borderColor: 'var(--preview-accent)' }}
                >
                    Tu Especialista
                </div>
                <h2
                    className={`${m ? 'text-2xl mb-4' : 'text-5xl mb-8'} font-black tracking-tighter`}
                    style={{ color: 'var(--preview-primary)' }}
                >
                    {content.name || 'Nombre del Presentador'}
                </h2>
                <p
                    className={`opacity-60 leading-relaxed ${m ? 'text-base' : 'text-2xl'} font-light italic`}
                >
                    {content.bio ||
                        'Una biografía persuasiva y que construya autoridad comprobable sobre el tema del que vas a enseñar.'}
                </p>
            </div>
        </section>
    )
}

export function AboutPreview({ content, m }: SectionPreviewProps) {
    const bgColor = content.bg_color as string | undefined
    const eyebrow = content.eyebrow as string | undefined
    const photo = content.photo as string | undefined
    const layout = (content.photo_layout as string) || 'top'
    const isSide = !!photo && (layout === 'left' || layout === 'right') && !m

    const photoEl = photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={photo}
            alt={String(content.title || 'Foto')}
            className="rounded-3xl object-cover"
            style={
                isSide
                    ? { width: '280px', height: '340px', flexShrink: 0 }
                    : { width: m ? '160px' : '260px', height: m ? '200px' : '320px' }
            }
        />
    ) : null

    const textEl = (
        <div
            className={`${m ? 'p-6 rounded-2xl text-base' : 'p-12 rounded-[3rem] text-xl'} border glass leading-relaxed opacity-80`}
            style={{
                backgroundColor: 'var(--preview-card-bg)',
                borderColor: 'var(--preview-muted)',
                flex: isSide ? 1 : undefined,
            }}
        >
            {content.text ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(content.text)) }} />
            ) : (
                <p className="opacity-40">Contenido sobre la empresa aparecerá aquí...</p>
            )}
        </div>
    )

    return (
        <section
            className={`${m ? 'py-12 px-4' : 'py-24 px-6'}`}
            style={bgColor ? { backgroundColor: bgColor } : undefined}
        >
            <div className="max-w-5xl mx-auto">
                {eyebrow && (
                    <p
                        className={`text-center font-bold uppercase tracking-widest ${m ? 'text-xs mb-2' : 'text-sm mb-3'}`}
                        style={{ color: 'var(--preview-primary)' }}
                    >
                        {eyebrow}
                    </p>
                )}
                <h2 className={`${m ? 'text-2xl mb-6' : 'text-4xl mb-10'} font-bold text-center`}>
                    {content.title || 'Sobre Nosotros'}
                </h2>
                {isSide ? (
                    <div
                        className="flex items-center gap-10"
                        style={{ flexDirection: layout === 'right' ? 'row-reverse' : 'row' }}
                    >
                        {photoEl}
                        {textEl}
                    </div>
                ) : (
                    <>
                        {photo && <div className="flex justify-center mb-8">{photoEl}</div>}
                        {textEl}
                    </>
                )}
            </div>
        </section>
    )
}
