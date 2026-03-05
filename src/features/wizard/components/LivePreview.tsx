/* eslint-disable @next/next/no-img-element */
'use client'

import { useWizardStore } from '../store/wizardStore'
import { Check, Play, Clock, ArrowRight, MessageSquare, Star, User } from 'lucide-react'
import type { WizardSection, DesignColors } from '../types'

interface LivePreviewProps {
    isMobile?: boolean
    /** Optional overrides for standalone rendering (public pages) */
    data?: {
        sections: WizardSection[]
        customColors: DesignColors
        visualModel: 'dark' | 'light'
        projectName: string
    }
}

export function LivePreview({ isMobile = false, data }: LivePreviewProps) {
    const store = useWizardStore()
    const sections = data?.sections ?? store.sections
    const customColors = data?.customColors ?? store.customColors
    const visualModel = data?.visualModel ?? store.visualModel
    const projectName = data?.projectName ?? store.projectName

    // Map custom colors to CSS variables
    const cssVars = {
        '--preview-primary': customColors.primary || '#00F0FF',
        '--preview-secondary': customColors.secondary || '#7C3AED',
        '--preview-accent': customColors.accent || '#FF007F',
        '--preview-bg': visualModel === 'dark' ? '#0A0E1A' : '#F9FAFB',
        '--preview-text': visualModel === 'dark' ? '#FFFFFF' : '#111827',
        '--preview-muted': visualModel === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        '--preview-card-bg': visualModel === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    } as React.CSSProperties

    return (
        <div
            className="w-full h-full overflow-y-auto relative no-scrollbar selection:bg-cyan-500/30"
            style={cssVars}
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
                .preview-font { font-family: 'Outfit', sans-serif; }
                .glass { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
            `}} />
            <div
                className="min-h-full preview-font transition-colors duration-300 pb-20"
                style={{ backgroundColor: 'var(--preview-bg)', color: 'var(--preview-text)' }}
            >
                {/* Simulated Header */}
                <header className={`${isMobile ? 'p-4' : 'p-6'} border-b border-opacity-20 max-w-6xl mx-auto`} style={{ borderColor: 'var(--preview-muted)' }}>
                    <div className={`font-bold ${isMobile ? 'text-base' : 'text-xl'} tracking-tighter`} style={{ color: 'var(--preview-primary)' }}>
                        {projectName || 'Mi Landing Page'}
                    </div>
                </header>

                <main>
                    {sections.filter(s => s.isVisible).sort((a, b) => a.order - b.order).map(section => (
                        <PreviewSection key={section.id} section={section} isMobile={isMobile} />
                    ))}
                </main>

                <footer className={`${isMobile ? 'py-8 px-4 mt-10' : 'py-16 px-6 mt-20'} border-t border-opacity-10 text-center`} style={{ borderColor: 'var(--preview-muted)' }}>
                    <div className={`font-bold ${isMobile ? 'text-base mb-3' : 'text-2xl mb-6'} tracking-tighter`} style={{ color: 'var(--preview-primary)' }}>
                        {projectName || 'Mi Landing Page'}
                    </div>
                    <p className={`opacity-50 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        &copy; {new Date().getFullYear()} {projectName || 'BrandCommerce'}. Todos los derechos reservados.
                    </p>
                </footer>
            </div>
        </div>
    )
}

function PreviewSection({ section, isMobile }: { section: import('../types').WizardSection; isMobile: boolean }) {
    const { type } = section
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = section.content as Record<string, any>
    const m = isMobile // shorthand

    switch (type) {
        case 'hero':
            return (
                <section className={`${m ? 'py-16 px-4 min-h-0' : 'py-32 px-6 min-h-[80vh]'} text-center max-w-5xl mx-auto flex flex-col items-center justify-center`}>
                    <div className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-8 border border-opacity-30" style={{ color: 'var(--preview-primary)', borderColor: 'var(--preview-primary)' }}>
                        Nueva Oportunidad
                    </div>
                    <h1 className={`${m ? 'text-3xl mb-6' : 'text-5xl md:text-8xl mb-10'} font-extrabold tracking-tight leading-[1.1]`} style={{ color: 'var(--preview-text)' }}>
                        {content.headline || 'Título Principal de tu Oferta'}
                    </h1>
                    <p className={`${m ? 'text-base mb-8' : 'text-xl md:text-3xl mb-12'} opacity-70 font-light max-w-3xl leading-relaxed`}>
                        {content.subheadline || 'Un subtítulo persuasivo que complementa la gran promesa.'}
                    </p>
                    {content.video_url && (
                        <div className={`w-full max-w-4xl aspect-video ${m ? 'rounded-xl mb-8' : 'rounded-[2rem] mb-12'} bg-black/40 border-2 flex flex-col items-center justify-center shadow-2xl glass overflow-hidden relative group cursor-pointer`} style={{ borderColor: 'var(--preview-primary)' }}>
                            <div className={`${m ? 'w-12 h-12' : 'w-20 h-20'} rounded-full flex items-center justify-center bg-white/10 group-hover:scale-110 transition-transform duration-500 glass`}>
                                <Play fill="currentColor" className="ml-1" style={{ color: 'var(--preview-primary)' }} />
                            </div>
                            <span className="mt-4 font-bold tracking-widest text-xs uppercase opacity-40">Ver Presentación</span>
                        </div>
                    )}
                    <button className={`group relative ${m ? 'px-8 py-4 rounded-xl text-base' : 'px-12 py-6 rounded-2xl text-xl'} font-black shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all`} style={{ backgroundColor: 'var(--preview-accent)', color: '#FFF' }}>
                        <span className="relative z-10 flex items-center gap-3">
                            {content.cta_text || 'Comenzar Ahora'}
                            <ArrowRight size={m ? 18 : 24} />
                        </span>
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 blur-2xl transition-opacity animate-pulse" style={{ backgroundColor: 'var(--preview-accent)' }}></div>
                    </button>
                </section>
            )
        case 'benefits':
            const items = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-20 px-6'} max-w-6xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Beneficios</h2>
                    <div className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
                        {items.length > 0 ? items.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border transition-all hover:-translate-y-2 hover:shadow-2xl glass group`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className={`${m ? 'w-10 h-10 mb-4 rounded-xl' : 'w-14 h-14 mb-8 rounded-2xl'} flex items-center justify-center glass group-hover:scale-110 transition-transform`} style={{ color: 'var(--preview-secondary)' }}>
                                    <Check size={m ? 20 : 28} strokeWidth={3} />
                                </div>
                                <h3 className={`${m ? 'text-lg mb-2' : 'text-2xl mb-4'} font-bold`} style={{ color: 'var(--preview-secondary)' }}>{(item.title as string) || 'Beneficio Principal'}</h3>
                                <p className={`opacity-60 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}>{(item.description as string) || 'Descripción del beneficio...'}</p>
                            </div>
                        )) : (
                            [1, 2, 3].map(i => (
                                <div key={i} className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border border-opacity-10 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                    <div className="h-14 w-14 mb-8 rounded-2xl opacity-20 bg-current"></div>
                                    <div className="h-8 w-3/4 mb-6 rounded-lg opacity-20 bg-current"></div>
                                    <div className="h-4 w-full mb-3 rounded-lg opacity-10 bg-current"></div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )
        case 'urgency':
            return (
                <section className={`${m ? 'py-4 px-4 text-sm' : 'py-6 px-6 text-xl'} text-center font-black tracking-widest uppercase shadow-lg z-10 relative`} style={{ backgroundColor: 'var(--preview-accent)', color: '#FFF' }}>
                    {content.text || '⚡ OFERTA VÁLIDA POR TIEMPO LIMITADO ⚡'}
                </section>
            )
        case 'countdown':
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} text-center max-w-4xl mx-auto border-t border-opacity-10`} style={{ borderColor: 'var(--preview-muted)' }}>
                    <div className="flex items-center justify-center gap-3 mb-8 opacity-60">
                        <Clock size={m ? 18 : 24} />
                        <h3 className={`${m ? 'text-base' : 'text-xl'} font-bold uppercase tracking-widest`}>{content.headline || 'La oferta expira en:'}</h3>
                    </div>
                    <div className={`flex justify-center ${m ? 'gap-3' : 'gap-4 md:gap-8'} mb-12`}>
                        {['Días', 'Horas', 'Min', 'Seg'].map(u => (
                            <div key={u} className={`flex flex-col items-center justify-center ${m ? 'p-3 w-16 h-16 rounded-xl' : 'p-6 w-24 h-24 md:w-36 md:h-36 rounded-[2.5rem]'} glass shadow-2xl relative group overflow-hidden`} style={{ backgroundColor: 'var(--preview-card-bg)' }}>
                                <span className={`${m ? 'text-2xl' : 'text-4xl md:text-6xl'} font-black mb-1 group-hover:scale-110 transition-transform duration-500`} style={{ color: 'var(--preview-primary)' }}>00</span>
                                <span className={`${m ? 'text-[8px]' : 'text-[10px] md:text-xs'} uppercase tracking-[0.2em] font-black opacity-40`}>{u}</span>
                                <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-5 transition-opacity" style={{ color: 'var(--preview-primary)' }}></div>
                            </div>
                        ))}
                    </div>
                </section>
            )
        case 'offer':
            return (
                <section className={`${m ? 'py-16 px-4' : 'py-32 px-6'} max-w-4xl mx-auto text-center`}>
                    <div className={`inline-block ${m ? 'p-8 rounded-3xl border-2 min-w-0 w-full' : 'p-16 rounded-[4rem] border-4 min-w-[400px] md:w-auto'} w-full shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group glass`} style={{ borderColor: 'var(--preview-secondary)', backgroundColor: 'var(--preview-bg)' }}>
                        <div className="absolute top-0 inset-x-0 h-3 animate-pulse" style={{ backgroundColor: 'var(--preview-secondary)' }}></div>
                        <span className="inline-block px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-8 opacity-40">Propuesta Única</span>
                        <h2 className={`${m ? 'text-2xl mb-4' : 'text-5xl mb-8'} font-extrabold`}>{content.title || 'Oferta Especial'}</h2>
                        <div className={`${m ? 'text-5xl mb-6' : 'text-8xl mb-12'} font-black tracking-tighter`} style={{ color: 'var(--preview-primary)' }}>
                            {content.price_current || '$97'}
                        </div>
                        <button className={`w-full ${m ? 'px-6 py-4 rounded-xl text-lg' : 'px-12 py-6 rounded-2xl text-2xl'} font-black hover:scale-105 transition-transform block shadow-xl active:scale-95`} style={{ backgroundColor: 'var(--preview-accent)', color: '#FFF' }}>
                            {content.cta_text || 'Comprar Ahora'}
                        </button>
                    </div>
                </section>
            )
        case 'lead_capture':
            return (
                <section className={`${m ? 'py-16 px-4' : 'py-32 px-6'} max-w-4xl mx-auto text-center`}>
                    <div className={`glass ${m ? 'p-6 rounded-2xl' : 'p-16 rounded-[4rem]'} border border-opacity-10 shadow-2xl`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                        <h2 className={`${m ? 'text-2xl mb-4' : 'text-5xl mb-8'} font-extrabold`}>{content.headline || 'Únete ahora'}</h2>
                        {content.subheadline && <p className={`${m ? 'mb-6 text-base' : 'mb-12 text-2xl'} opacity-60 font-light leading-relaxed`}>{content.subheadline}</p>}
                        <form className="max-w-md mx-auto flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity" size={m ? 16 : 20} style={{ color: 'var(--preview-primary)' }} />
                                <input type="text" placeholder="Tu Nombre" className={`${m ? 'pl-10 pr-4 py-3 rounded-xl text-sm' : 'pl-14 pr-6 py-5 rounded-2xl text-xl'} w-full bg-black/20 border-2 outline-none font-medium transition-all focus:border-opacity-100 border-opacity-20`} style={{ backgroundColor: 'var(--preview-bg)', borderColor: 'var(--preview-primary)' }} readOnly />
                            </div>
                            <div className="relative group">
                                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity" size={m ? 16 : 20} style={{ color: 'var(--preview-primary)' }} />
                                <input type="email" placeholder="Tu Email" className={`${m ? 'pl-10 pr-4 py-3 rounded-xl text-sm' : 'pl-14 pr-6 py-5 rounded-2xl text-xl'} w-full bg-black/20 border-2 outline-none font-medium transition-all focus:border-opacity-100 border-opacity-20`} style={{ backgroundColor: 'var(--preview-bg)', borderColor: 'var(--preview-primary)' }} readOnly />
                            </div>
                            <button className={`${m ? 'px-6 py-3 rounded-xl text-base' : 'px-10 py-6 rounded-2xl text-2xl'} font-black mt-2 transition-all hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 active:scale-95`} style={{ backgroundColor: 'var(--preview-primary)', color: '#000' }}>
                                {content.cta_text || 'Enviar'}
                            </button>
                        </form>
                    </div>
                </section>
            )
        case 'faq':
            const faqs = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Preguntas Frecuentes</h2>
                    <div className={`${m ? 'space-y-3' : 'space-y-6'}`}>
                        {faqs.length > 0 ? faqs.map((faq: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem]'} border transition-all hover:shadow-xl glass`} style={{ borderColor: 'var(--preview-muted)', backgroundColor: 'var(--preview-card-bg)' }}>
                                <div className={`flex items-start ${m ? 'gap-3' : 'gap-5'}`}>
                                    <div className={`${m ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} flex items-center justify-center glass flex-shrink-0`} style={{ color: 'var(--preview-primary)' }}>
                                        <MessageSquare size={m ? 14 : 20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold ${m ? 'text-base mb-2' : 'text-xl mb-4'}`} style={{ color: 'var(--preview-secondary)' }}>{(faq.question as string) || 'Pregunta...'}</h3>
                                        <p className={`opacity-60 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}>{(faq.answer as string) || 'Respuesta...'}</p>
                                    </div>
                                </div>
                            </div>
                        )) : [1, 2].map(i => (
                            <div key={i} className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem]'} border opacity-20 glass`} style={{ borderColor: 'var(--preview-muted)', backgroundColor: 'var(--preview-card-bg)' }}>
                                <div className="h-6 w-1/2 mb-4 rounded bg-current opacity-20"></div>
                                <div className="h-4 w-full rounded bg-current opacity-10"></div>
                            </div>
                        ))}
                    </div>
                </section>
            )
        case 'speaker':
            return (
                <section className={`${m ? 'py-16 px-4 flex-col gap-8' : 'py-32 px-6 md:flex-row gap-16'} max-w-5xl mx-auto flex flex-col items-center`}>
                    <div className={`${m ? 'w-48 h-48 rounded-2xl' : 'w-80 h-80 rounded-[3rem]'} bg-opacity-10 border-4 flex-shrink-0 overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-primary)' }}>
                        {content.photo ? (
                            <img src={content.photo as string} alt="Speaker" className="w-full h-full object-cover" />
                        ) : <div className="w-full h-full flex items-center justify-center opacity-30 text-5xl font-black">FOTO</div>}
                    </div>
                    <div className={`text-center ${m ? '' : 'md:text-left'}`}>
                        <div className="inline-block px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-6 border border-opacity-30" style={{ color: 'var(--preview-accent)', borderColor: 'var(--preview-accent)' }}>
                            Tu Especialista
                        </div>
                        <h2 className={`${m ? 'text-2xl mb-4' : 'text-5xl mb-8'} font-black tracking-tighter`} style={{ color: 'var(--preview-primary)' }}>{content.name || 'Nombre del Presentador'}</h2>
                        <p className={`opacity-60 leading-relaxed ${m ? 'text-base' : 'text-2xl'} font-light italic`}>{content.bio || 'Una biografía persuasiva y que construya autoridad comprobable sobre el tema del que vas a enseñar.'}</p>
                    </div>
                </section>
            )
        case 'story':
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
                    <div className={`prose ${m ? 'prose-base' : 'prose-xl'} mx-auto text-current opacity-90 leading-relaxed max-w-full`}>
                        <div dangerouslySetInnerHTML={{ __html: (content.text as string) || '<p>Aquí va el texto de tu historia envolvente...</p>' }} />
                    </div>
                </section>
            )
        case 'solution':
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-5xl mx-auto text-center border-y border-opacity-10 my-10`} style={{ borderColor: 'var(--preview-muted)' }}>
                    <h2 className={`${m ? 'text-2xl mb-6' : 'text-5xl mb-10'} font-bold`} style={{ color: 'var(--preview-secondary)' }}>{content.title || 'La Solución Definitiva'}</h2>
                    <p className={`${m ? 'text-base' : 'text-2xl'} opacity-90 leading-relaxed max-w-4xl mx-auto`}>{content.text || 'Explicación detallada de cómo tu solución resuelve el problema del framework anterior.'}</p>
                </section>
            )
        case 'learning':
            const lItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Lo que aprenderás</h2>
                    <ul className={`${m ? 'space-y-3' : 'space-y-6'}`}>
                        {lItems.length > 0 ? lItems.map((item: string, i: number) => (
                            <li key={i} className={`flex items-start ${m ? 'gap-3 p-4 rounded-xl' : 'gap-6 p-6 rounded-2xl'} bg-opacity-5`} style={{ backgroundColor: 'var(--preview-text)' }}>
                                <span className={`${m ? 'text-xl' : 'text-3xl'} mt-1 font-black`} style={{ color: 'var(--preview-accent)' }}>✓</span>
                                <span className={`${m ? 'text-sm' : 'text-xl'} font-medium opacity-90`}>{item}</span>
                            </li>
                        )) : [1, 2, 3].map(i => (
                            <li key={i} className={`flex gap-6 opacity-30 ${m ? 'p-4 rounded-xl' : 'p-6 rounded-2xl'} border`} style={{ borderColor: 'var(--preview-muted)' }}>
                                <span className="text-3xl" style={{ color: 'var(--preview-accent)' }}>✓</span>
                                <div className="h-6 w-full rounded bg-current opacity-20 mt-2"></div>
                            </li>
                        ))}
                    </ul>
                </section>
            )
        case 'target':
            const tItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-5xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>¿Para quién es esto?</h2>
                    <div className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-2 gap-8'}`}>
                        {tItems.length > 0 ? tItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-3xl'} bg-opacity-5`} style={{ backgroundColor: 'var(--preview-text)' }}>
                                <h3 className={`font-bold ${m ? 'text-lg mb-2' : 'text-2xl mb-4'}`} style={{ color: 'var(--preview-primary)' }}>{(item.title as string) || 'Perfil del Avatar'}</h3>
                                <p className={`opacity-80 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}>{(item.description as string)}</p>
                            </div>
                        )) : [1, 2].map(i => (
                            <div key={i} className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-3xl'} bg-opacity-5`} style={{ backgroundColor: 'var(--preview-text)' }}>
                                <div className="h-6 w-1/2 mb-4 rounded bg-current opacity-20"></div>
                                <div className="h-4 w-full rounded bg-current opacity-10"></div>
                            </div>
                        ))}
                    </div>
                </section>
            )
        case 'testimonials':
            const testItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Historias de Éxito</h2>
                    <div className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
                        {testItems.length > 0 ? testItems.map((item: Record<string, string>, i: number) => (
                            <div key={i} className={`${m ? 'p-6 rounded-2xl' : 'p-12 rounded-[2.5rem]'} border shadow-xl relative group glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={m ? 12 : 16} fill="var(--preview-accent)" color="var(--preview-accent)" />)}
                                </div>
                                <p className={`italic opacity-80 ${m ? 'mb-4 text-sm' : 'mb-10 text-xl'} leading-relaxed relative z-10`}>&quot;{item.text || 'La mejor inversión que he hecho en mi vida.'}&quot;</p>
                                <div className="flex items-center gap-3">
                                    <div className={`${m ? 'w-8 h-8 text-sm' : 'w-12 h-12'} rounded-full border-2 glass flex items-center justify-center font-bold`} style={{ borderColor: 'var(--preview-primary)', color: 'var(--preview-primary)' }}>
                                        {item.author?.[0] || 'C'}
                                    </div>
                                    <div className={`font-black ${m ? 'text-sm' : 'text-lg'} tracking-tight`} style={{ color: 'var(--preview-text)' }}>{item.author || 'Cliente Feliz'}</div>
                                </div>
                                {!m && <div className="absolute top-8 right-10 text-7xl opacity-10 font-black italic" style={{ color: 'var(--preview-primary)' }}>&quot;</div>}
                            </div>
                        )) : [1, 2, 3].map(i => (
                            <div key={i} className={`${m ? 'p-6 rounded-2xl' : 'p-12 rounded-[2.5rem]'} border opacity-20 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="h-4 w-24 mb-6 rounded bg-current opacity-20"></div>
                                <div className="h-20 w-full rounded-[2rem] bg-current opacity-10 mb-6"></div>
                                <div className="h-6 w-1/3 rounded bg-current opacity-20"></div>
                            </div>
                        ))}
                    </div>
                </section>
            )
        // ── Shared Blocks ──
        case 'html_embed':
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto text-center`}>
                    {content.title && <h2 className={`${m ? 'text-2xl mb-6' : 'text-4xl mb-10'} font-bold`}>{content.title}</h2>}
                    <div className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-2xl'} border glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                        {content.html_code ? (
                            <div className="opacity-60 text-sm font-mono text-left overflow-hidden" style={{ maxHeight: '200px' }}>
                                <div className="flex items-center gap-2 mb-3 opacity-50">
                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                    <span className="text-xs ml-2">HTML Embed</span>
                                </div>
                                <code className="text-xs opacity-40 break-all">{(content.html_code as string).substring(0, 200)}...</code>
                            </div>
                        ) : (
                            <p className="opacity-30 text-sm">Código HTML embebido aparecerá aquí</p>
                        )}
                    </div>
                </section>
            )
        case 'image_gallery': {
            const galleryItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Galería</h2>
                    <div className={`grid ${m ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 gap-6'}`}>
                        {galleryItems.length > 0 ? galleryItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'rounded-xl' : 'rounded-2xl'} overflow-hidden border group relative aspect-[4/3]`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                {item.url ? (
                                    <img src={item.url as string} alt={(item.caption as string) || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-20 text-2xl font-black">IMG</div>
                                )}
                                {item.caption ? (
                                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-white text-sm font-medium">{item.caption as string}</p>
                                    </div>
                                ) : null}
                            </div>
                        )) : [1, 2, 3].map(i => (
                            <div key={i} className={`aspect-[4/3] ${m ? 'rounded-xl' : 'rounded-2xl'} border opacity-20`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="w-full h-full flex items-center justify-center opacity-30 text-xl font-black">IMG</div>
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'pricing': {
            const plans = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Planes y Precios</h2>
                    <div className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-3 gap-8'}`}>
                        {plans.length > 0 ? plans.map((plan: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'p-6 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border text-center transition-all hover:-translate-y-2 hover:shadow-2xl glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <h3 className={`${m ? 'text-lg mb-2' : 'text-2xl mb-4'} font-bold`} style={{ color: 'var(--preview-secondary)' }}>{(plan.name as string) || 'Plan'}</h3>
                                <div className={`${m ? 'text-3xl mb-4' : 'text-5xl mb-8'} font-black`} style={{ color: 'var(--preview-primary)' }}>{(plan.price as string) || '$0'}</div>
                                <button className={`w-full ${m ? 'py-3 rounded-xl text-sm' : 'py-4 rounded-2xl text-base'} font-bold transition-all hover:scale-105`} style={{ backgroundColor: 'var(--preview-accent)', color: '#FFF' }}>
                                    {(plan.cta_text as string) || 'Elegir Plan'}
                                </button>
                            </div>
                        )) : [1, 2, 3].map(i => (
                            <div key={i} className={`${m ? 'p-6 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border opacity-20 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="h-6 w-1/2 mx-auto mb-4 rounded bg-current opacity-20" />
                                <div className="h-10 w-1/3 mx-auto mb-6 rounded bg-current opacity-20" />
                                <div className="h-10 w-full rounded-xl bg-current opacity-10" />
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'team': {
            const members = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Nuestro Equipo</h2>
                    <div className={`grid ${m ? 'grid-cols-2 gap-4' : 'grid-cols-2 md:grid-cols-4 gap-8'}`}>
                        {members.length > 0 ? members.map((member: Record<string, unknown>, i: number) => (
                            <div key={i} className="text-center group">
                                <div className={`${m ? 'w-24 h-24 rounded-2xl mb-3' : 'w-32 h-32 rounded-3xl mb-6'} mx-auto overflow-hidden border-2 group-hover:scale-105 transition-transform`} style={{ borderColor: 'var(--preview-primary)', backgroundColor: 'var(--preview-card-bg)' }}>
                                    {member.photo ? (
                                        <img src={member.photo as string} alt={(member.name as string) || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-30 text-2xl font-black">{((member.name as string) || 'T')[0]}</div>
                                    )}
                                </div>
                                <h3 className={`font-bold ${m ? 'text-sm' : 'text-lg'}`}>{(member.name as string) || 'Nombre'}</h3>
                                <p className={`opacity-50 ${m ? 'text-xs' : 'text-sm'}`}>{(member.role as string) || 'Cargo'}</p>
                            </div>
                        )) : [1, 2, 3, 4].map(i => (
                            <div key={i} className="text-center opacity-20">
                                <div className={`${m ? 'w-24 h-24 rounded-2xl mb-3' : 'w-32 h-32 rounded-3xl mb-6'} mx-auto border bg-current opacity-10`} style={{ borderColor: 'var(--preview-muted)' }} />
                                <div className="h-4 w-2/3 mx-auto rounded bg-current opacity-20 mb-2" />
                                <div className="h-3 w-1/2 mx-auto rounded bg-current opacity-10" />
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'logo_wall':
        case 'sponsors': {
            const logos = Array.isArray(content.items) ? content.items : []
            const wallTitle = type === 'sponsors' ? 'Sponsors' : 'Partners & Clientes'
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-20 px-6'} max-w-6xl mx-auto text-center`}>
                    <h2 className={`${m ? 'text-lg mb-6' : 'text-2xl mb-12'} font-bold opacity-40 uppercase tracking-widest`}>{wallTitle}</h2>
                    <div className={`flex flex-wrap items-center justify-center ${m ? 'gap-6' : 'gap-12'}`}>
                        {logos.length > 0 ? logos.map((logo: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'w-16 h-16' : 'w-24 h-24'} flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity glass rounded-xl border`} style={{ borderColor: 'var(--preview-muted)' }}>
                                {logo.logo ? (
                                    <img src={logo.logo as string} alt={(logo.name as string) || ''} className="max-w-full max-h-full object-contain p-2" />
                                ) : (
                                    <span className={`font-bold ${m ? 'text-xs' : 'text-sm'} text-center`}>{(logo.name as string) || 'Logo'}</span>
                                )}
                            </div>
                        )) : [1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`${m ? 'w-16 h-16' : 'w-24 h-24'} border rounded-xl opacity-10`} style={{ borderColor: 'var(--preview-muted)', backgroundColor: 'var(--preview-card-bg)' }} />
                        ))}
                    </div>
                </section>
            )
        }
        case 'contact':
            return (
                <section className={`${m ? 'py-16 px-4' : 'py-32 px-6'} max-w-4xl mx-auto text-center`}>
                    <div className={`glass ${m ? 'p-6 rounded-2xl' : 'p-16 rounded-[4rem]'} border shadow-2xl`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                        <h2 className={`${m ? 'text-2xl mb-4' : 'text-5xl mb-8'} font-extrabold`}>{content.title || 'Contacto'}</h2>
                        <div className={`${m ? 'space-y-2 mb-6 text-sm' : 'space-y-3 mb-12 text-lg'} opacity-60`}>
                            {content.email && <p>{content.email as string}</p>}
                            {content.phone && <p>{content.phone as string}</p>}
                            {content.address && <p>{content.address as string}</p>}
                        </div>
                        <form className="max-w-md mx-auto flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
                            <input type="text" placeholder="Nombre" className={`${m ? 'px-4 py-3 rounded-xl text-sm' : 'px-6 py-5 rounded-2xl text-lg'} w-full border-2 outline-none font-medium`} style={{ backgroundColor: 'var(--preview-bg)', borderColor: 'var(--preview-primary)', color: 'var(--preview-text)' }} readOnly />
                            <input type="email" placeholder="Email" className={`${m ? 'px-4 py-3 rounded-xl text-sm' : 'px-6 py-5 rounded-2xl text-lg'} w-full border-2 outline-none font-medium`} style={{ backgroundColor: 'var(--preview-bg)', borderColor: 'var(--preview-primary)', color: 'var(--preview-text)' }} readOnly />
                            <textarea placeholder="Mensaje" rows={3} className={`${m ? 'px-4 py-3 rounded-xl text-sm' : 'px-6 py-5 rounded-2xl text-lg'} w-full border-2 outline-none font-medium resize-none`} style={{ backgroundColor: 'var(--preview-bg)', borderColor: 'var(--preview-primary)', color: 'var(--preview-text)' }} readOnly />
                            <button className={`${m ? 'px-6 py-3 rounded-xl text-base' : 'px-10 py-6 rounded-2xl text-xl'} font-black mt-2 transition-all hover:shadow-lg`} style={{ backgroundColor: 'var(--preview-primary)', color: '#000' }}>
                                {content.cta_text || 'Enviar Mensaje'}
                            </button>
                        </form>
                    </div>
                </section>
            )
        // ── Sector Blocks ──
        case 'services': {
            const serviceItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Servicios</h2>
                    <div className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
                        {serviceItems.length > 0 ? serviceItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border transition-all hover:-translate-y-2 hover:shadow-2xl glass group`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className={`${m ? 'w-10 h-10 mb-4 rounded-xl' : 'w-14 h-14 mb-8 rounded-2xl'} flex items-center justify-center glass group-hover:scale-110 transition-transform`} style={{ color: 'var(--preview-primary)' }}>
                                    <ArrowRight size={m ? 20 : 28} />
                                </div>
                                <h3 className={`${m ? 'text-lg mb-2' : 'text-2xl mb-4'} font-bold`} style={{ color: 'var(--preview-primary)' }}>{(item.title as string) || 'Servicio'}</h3>
                                <p className={`opacity-60 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}>{(item.description as string) || 'Descripción del servicio...'}</p>
                            </div>
                        )) : [1, 2, 3].map(i => (
                            <div key={i} className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border opacity-20 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="h-14 w-14 mb-8 rounded-2xl opacity-20 bg-current" />
                                <div className="h-8 w-3/4 mb-6 rounded-lg opacity-20 bg-current" />
                                <div className="h-4 w-full mb-3 rounded-lg opacity-10 bg-current" />
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'process':
        case 'process_steps':
        case 'how_it_works': {
            const processItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-5xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Cómo Funciona</h2>
                    <div className={`${m ? 'space-y-4' : 'space-y-8'}`}>
                        {processItems.length > 0 ? processItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`flex ${m ? 'gap-4 p-4 rounded-xl' : 'gap-8 p-8 rounded-[2rem]'} border transition-all hover:shadow-xl glass items-start`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className={`${m ? 'w-10 h-10 text-lg rounded-xl' : 'w-16 h-16 text-2xl rounded-2xl'} flex items-center justify-center font-black flex-shrink-0`} style={{ backgroundColor: 'var(--preview-primary)', color: '#000' }}>
                                    {i + 1}
                                </div>
                                <div>
                                    <h3 className={`font-bold ${m ? 'text-base mb-1' : 'text-xl mb-3'}`}>{(item.title as string) || `Paso ${i + 1}`}</h3>
                                    <p className={`opacity-60 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}>{(item.description as string) || 'Descripción del paso...'}</p>
                                </div>
                            </div>
                        )) : [1, 2, 3].map(i => (
                            <div key={i} className={`flex ${m ? 'gap-4 p-4 rounded-xl' : 'gap-8 p-8 rounded-[2rem]'} border opacity-20 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className={`${m ? 'w-10 h-10 rounded-xl' : 'w-16 h-16 rounded-2xl'} flex-shrink-0 bg-current opacity-20`} />
                                <div className="flex-1">
                                    <div className="h-6 w-1/3 mb-3 rounded bg-current opacity-20" />
                                    <div className="h-4 w-full rounded bg-current opacity-10" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'features': {
            const featureItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Características</h2>
                    <div className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
                        {featureItems.length > 0 ? featureItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border transition-all hover:-translate-y-2 hover:shadow-2xl glass group`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className={`${m ? 'w-10 h-10 mb-4 rounded-xl' : 'w-14 h-14 mb-8 rounded-2xl'} flex items-center justify-center glass group-hover:scale-110 transition-transform`} style={{ color: 'var(--preview-secondary)' }}>
                                    <Check size={m ? 20 : 28} strokeWidth={3} />
                                </div>
                                <h3 className={`${m ? 'text-lg mb-2' : 'text-2xl mb-4'} font-bold`} style={{ color: 'var(--preview-secondary)' }}>{(item.title as string) || 'Característica'}</h3>
                                <p className={`opacity-60 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}>{(item.description as string) || 'Descripción...'}</p>
                            </div>
                        )) : [1, 2, 3].map(i => (
                            <div key={i} className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border opacity-20 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="h-14 w-14 mb-8 rounded-2xl opacity-20 bg-current" />
                                <div className="h-8 w-3/4 mb-6 rounded-lg opacity-20 bg-current" />
                                <div className="h-4 w-full mb-3 rounded-lg opacity-10 bg-current" />
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'skills': {
            const skillItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Habilidades</h2>
                    <div className={`${m ? 'space-y-4' : 'space-y-6'}`}>
                        {skillItems.length > 0 ? skillItems.map((item: Record<string, unknown>, i: number) => {
                            const level = parseInt((item.level as string) || '80', 10) || 80
                            return (
                                <div key={i}>
                                    <div className="flex justify-between mb-2">
                                        <span className={`font-bold ${m ? 'text-sm' : 'text-base'}`}>{(item.title as string) || 'Habilidad'}</span>
                                        <span className={`font-bold ${m ? 'text-sm' : 'text-base'}`} style={{ color: 'var(--preview-primary)' }}>{level}%</span>
                                    </div>
                                    <div className={`${m ? 'h-2 rounded' : 'h-3 rounded-lg'} w-full overflow-hidden`} style={{ backgroundColor: 'var(--preview-muted)' }}>
                                        <div className="h-full rounded-lg transition-all" style={{ width: `${level}%`, backgroundColor: 'var(--preview-primary)' }} />
                                    </div>
                                </div>
                            )
                        }) : [1, 2, 3].map(i => (
                            <div key={i} className="opacity-20">
                                <div className="h-4 w-1/4 mb-2 rounded bg-current opacity-20" />
                                <div className="h-3 w-full rounded bg-current opacity-10" />
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'experience':
        case 'education': {
            const timelineItems = Array.isArray(content.items) ? content.items : []
            const timelineTitle = type === 'education' ? 'Educación' : 'Experiencia'
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>{timelineTitle}</h2>
                    <div className={`${m ? 'space-y-4' : 'space-y-8'} relative`}>
                        {!m && <div className="absolute left-8 top-0 bottom-0 w-px opacity-20" style={{ backgroundColor: 'var(--preview-primary)' }} />}
                        {timelineItems.length > 0 ? timelineItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem] ml-16'} border transition-all hover:shadow-xl glass relative`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                {!m && <div className="absolute -left-[2.55rem] top-8 w-4 h-4 rounded-full border-2" style={{ backgroundColor: 'var(--preview-bg)', borderColor: 'var(--preview-primary)' }} />}
                                {item.period ? <span className={`${m ? 'text-xs' : 'text-sm'} font-bold tracking-wider uppercase`} style={{ color: 'var(--preview-primary)' }}>{item.period as string}</span> : null}
                                <h3 className={`font-bold ${m ? 'text-base mt-1' : 'text-xl mt-2'}`}>{(item.title as string) || timelineTitle}</h3>
                                {item.description ? <p className={`opacity-60 ${m ? 'text-sm mt-1' : 'text-lg mt-3'} leading-relaxed`}>{item.description as string}</p> : null}
                            </div>
                        )) : [1, 2].map(i => (
                            <div key={i} className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem] ml-16'} border opacity-20 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="h-3 w-1/4 mb-3 rounded bg-current opacity-20" />
                                <div className="h-5 w-1/2 mb-3 rounded bg-current opacity-20" />
                                <div className="h-4 w-full rounded bg-current opacity-10" />
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'about':
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-6' : 'text-4xl mb-10'} font-bold text-center`}>{content.title || 'Sobre Nosotros'}</h2>
                    <div className={`${m ? 'p-6 rounded-2xl text-base' : 'p-12 rounded-[3rem] text-xl'} border glass leading-relaxed opacity-80`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                        {content.text ? (
                            <div dangerouslySetInnerHTML={{ __html: content.text as string }} />
                        ) : (
                            <p className="opacity-40">Contenido sobre la empresa aparecerá aquí...</p>
                        )}
                    </div>
                </section>
            )
        case 'guarantee':
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto text-center`}>
                    <div className={`${m ? 'p-6 rounded-2xl' : 'p-12 rounded-[3rem]'} border-2 glass`} style={{ borderColor: 'var(--preview-secondary)', backgroundColor: 'var(--preview-card-bg)' }}>
                        <div className={`${m ? 'text-4xl mb-4' : 'text-7xl mb-8'}`}>🛡️</div>
                        <h2 className={`${m ? 'text-xl mb-3' : 'text-3xl mb-6'} font-extrabold`} style={{ color: 'var(--preview-secondary)' }}>{content.title || 'Garantía de Satisfacción'}</h2>
                        <p className={`opacity-70 ${m ? 'text-sm' : 'text-lg'} leading-relaxed max-w-2xl mx-auto`}>{content.text || 'Si no estás 100% satisfecho, te devolvemos tu dinero.'}</p>
                        {content.period && <p className={`mt-4 font-bold ${m ? 'text-sm' : 'text-base'}`} style={{ color: 'var(--preview-primary)' }}>{content.period as string}</p>}
                    </div>
                </section>
            )
        case 'comparison':
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-5xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>{content.title || '¿Por qué elegirnos?'}</h2>
                    <div className={`grid grid-cols-2 ${m ? 'gap-3' : 'gap-8'}`}>
                        <div className={`${m ? 'p-4 rounded-xl' : 'p-10 rounded-[2.5rem]'} border text-center`} style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' }}>
                            <div className={`${m ? 'text-2xl mb-3' : 'text-5xl mb-6'}`}>😰</div>
                            <h3 className={`font-bold ${m ? 'text-sm mb-3' : 'text-lg mb-6'}`} style={{ color: '#ef4444' }}>{content.without_title || 'Sin Nosotros'}</h3>
                            <div className={`${m ? 'space-y-2' : 'space-y-3'} opacity-60`}>
                                {[1, 2, 3].map(i => <div key={i} className={`h-3 rounded bg-current opacity-20 ${i === 3 ? 'w-2/3 mx-auto' : 'w-full'}`} />)}
                            </div>
                        </div>
                        <div className={`${m ? 'p-4 rounded-xl' : 'p-10 rounded-[2.5rem]'} border text-center`} style={{ borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.05)' }}>
                            <div className={`${m ? 'text-2xl mb-3' : 'text-5xl mb-6'}`}>🚀</div>
                            <h3 className={`font-bold ${m ? 'text-sm mb-3' : 'text-lg mb-6'}`} style={{ color: '#22c55e' }}>{content.with_title || 'Con Nosotros'}</h3>
                            <div className={`${m ? 'space-y-2' : 'space-y-3'} opacity-60`}>
                                {[1, 2, 3].map(i => <div key={i} className={`h-3 rounded bg-current opacity-20 ${i === 3 ? 'w-2/3 mx-auto' : 'w-full'}`} />)}
                            </div>
                        </div>
                    </div>
                </section>
            )
        case 'bonus_stack': {
            const bonusItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>🎁 Bonos Exclusivos</h2>
                    <div className={`${m ? 'space-y-3' : 'space-y-6'}`}>
                        {bonusItems.length > 0 ? bonusItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`flex ${m ? 'gap-3 p-4 rounded-xl' : 'gap-6 p-8 rounded-[2rem]'} border transition-all hover:shadow-xl glass items-center`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className={`${m ? 'text-2xl' : 'text-4xl'} flex-shrink-0`}>🎁</div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${m ? 'text-base' : 'text-xl'}`}>{(item.title as string) || 'Bono'}</h3>
                                    <p className={`opacity-60 ${m ? 'text-sm' : 'text-base'} mt-1`}>{(item.description as string) || ''}</p>
                                </div>
                                {item.value ? <span className={`font-black ${m ? 'text-sm' : 'text-lg'} flex-shrink-0`} style={{ color: 'var(--preview-accent)' }}>Valor: {item.value as string}</span> : null}
                            </div>
                        )) : [1, 2].map(i => (
                            <div key={i} className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem]'} border opacity-20 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="h-6 w-1/2 mb-3 rounded bg-current opacity-20" />
                                <div className="h-4 w-full rounded bg-current opacity-10" />
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'portfolio_showcase': {
            const portfolioItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Portfolio</h2>
                    <div className={`grid ${m ? 'grid-cols-1 gap-4' : 'grid-cols-2 md:grid-cols-3 gap-8'}`}>
                        {portfolioItems.length > 0 ? portfolioItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'rounded-xl' : 'rounded-[2rem]'} overflow-hidden border group transition-all hover:-translate-y-2 hover:shadow-2xl`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className={`aspect-video overflow-hidden ${m ? '' : ''}`}>
                                    {item.image ? (
                                        <img src={item.image as string} alt={(item.title as string) || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-20 text-3xl font-black" style={{ backgroundColor: 'var(--preview-muted)' }}>IMG</div>
                                    )}
                                </div>
                                <div className={`${m ? 'p-4' : 'p-6'}`}>
                                    <h3 className={`font-bold ${m ? 'text-base mb-1' : 'text-lg mb-2'}`}>{(item.title as string) || 'Proyecto'}</h3>
                                    <p className={`opacity-60 ${m ? 'text-sm' : 'text-base'}`}>{(item.description as string) || ''}</p>
                                </div>
                            </div>
                        )) : [1, 2, 3].map(i => (
                            <div key={i} className={`${m ? 'rounded-xl' : 'rounded-[2rem]'} border overflow-hidden opacity-20`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="aspect-video bg-current opacity-10" />
                                <div className="p-6">
                                    <div className="h-5 w-2/3 mb-3 rounded bg-current opacity-20" />
                                    <div className="h-4 w-full rounded bg-current opacity-10" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'stats': {
            const statItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-20 px-6'} max-w-6xl mx-auto`}>
                    <div className={`grid ${m ? 'grid-cols-2 gap-4' : 'grid-cols-2 md:grid-cols-4 gap-8'} text-center`}>
                        {statItems.length > 0 ? statItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem]'} border glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className={`${m ? 'text-3xl mb-2' : 'text-5xl mb-4'} font-black`} style={{ color: 'var(--preview-primary)' }}>{(item.value as string) || '0'}</div>
                                <div className={`opacity-60 ${m ? 'text-xs' : 'text-sm'} font-bold uppercase tracking-wider`}>{(item.label as string) || 'Métrica'}</div>
                            </div>
                        )) : [1, 2, 3, 4].map(i => (
                            <div key={i} className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem]'} border opacity-20 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="h-10 w-1/2 mx-auto mb-3 rounded bg-current opacity-20" />
                                <div className="h-3 w-2/3 mx-auto rounded bg-current opacity-10" />
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'speakers': {
            const speakerItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Speakers</h2>
                    <div className={`grid ${m ? 'grid-cols-2 gap-4' : 'grid-cols-2 md:grid-cols-3 gap-8'}`}>
                        {speakerItems.length > 0 ? speakerItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className="text-center group">
                                <div className={`${m ? 'w-24 h-24 rounded-2xl mb-3' : 'w-40 h-40 rounded-3xl mb-6'} mx-auto overflow-hidden border-2 group-hover:scale-105 transition-transform`} style={{ borderColor: 'var(--preview-accent)', backgroundColor: 'var(--preview-card-bg)' }}>
                                    {item.photo ? (
                                        <img src={item.photo as string} alt={(item.name as string) || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-30 text-3xl font-black">{((item.name as string) || 'S')[0]}</div>
                                    )}
                                </div>
                                <h3 className={`font-bold ${m ? 'text-sm' : 'text-lg'}`}>{(item.name as string) || 'Speaker'}</h3>
                                <p className={`opacity-50 ${m ? 'text-xs mt-1' : 'text-sm mt-2'} leading-relaxed`}>{(item.bio as string) || ''}</p>
                            </div>
                        )) : [1, 2, 3].map(i => (
                            <div key={i} className="text-center opacity-20">
                                <div className={`${m ? 'w-24 h-24 rounded-2xl mb-3' : 'w-40 h-40 rounded-3xl mb-6'} mx-auto border bg-current opacity-10`} style={{ borderColor: 'var(--preview-muted)' }} />
                                <div className="h-4 w-2/3 mx-auto rounded bg-current opacity-20 mb-2" />
                                <div className="h-3 w-1/2 mx-auto rounded bg-current opacity-10" />
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        case 'agenda': {
            const agendaItems = Array.isArray(content.items) ? content.items : []
            return (
                <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
                    <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>Agenda</h2>
                    <div className={`${m ? 'space-y-3' : 'space-y-6'}`}>
                        {agendaItems.length > 0 ? agendaItems.map((item: Record<string, unknown>, i: number) => (
                            <div key={i} className={`flex ${m ? 'gap-3 p-4 rounded-xl' : 'gap-6 p-6 rounded-2xl'} border transition-all hover:shadow-lg glass items-center`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className={`${m ? 'text-sm min-w-[60px]' : 'text-base min-w-[80px]'} font-black flex-shrink-0`} style={{ color: 'var(--preview-primary)' }}>{(item.time as string) || '00:00'}</div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${m ? 'text-base' : 'text-lg'}`}>{(item.title as string) || 'Sesión'}</h3>
                                    {item.speaker ? <p className={`opacity-50 ${m ? 'text-xs' : 'text-sm'} mt-1`}>por {item.speaker as string}</p> : null}
                                </div>
                            </div>
                        )) : [1, 2, 3].map(i => (
                            <div key={i} className={`${m ? 'p-4 rounded-xl' : 'p-6 rounded-2xl'} border opacity-20 glass`} style={{ backgroundColor: 'var(--preview-card-bg)', borderColor: 'var(--preview-muted)' }}>
                                <div className="h-5 w-full rounded bg-current opacity-15" />
                            </div>
                        ))}
                    </div>
                </section>
            )
        }
        default:
            return null
    }
}
