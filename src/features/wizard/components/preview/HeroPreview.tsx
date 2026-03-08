import { Play, ArrowRight } from 'lucide-react'
import type { SectionPreviewProps } from './types'

export function HeroPreview({ content, m }: SectionPreviewProps) {
    return (
        <section
            className={`${m ? 'py-16 px-4 min-h-0' : 'py-32 px-6 min-h-[80vh]'} text-center max-w-5xl mx-auto flex flex-col items-center justify-center`}
        >
            <div
                className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-8 border border-opacity-30"
                style={{ color: 'var(--preview-primary)', borderColor: 'var(--preview-primary)' }}
            >
                Nueva Oportunidad
            </div>
            <h1
                className={`${m ? 'text-3xl mb-6' : 'text-5xl md:text-8xl mb-10'} font-extrabold tracking-tight leading-[1.1]`}
                style={{ color: 'var(--preview-text)' }}
            >
                {content.headline || 'Título Principal de tu Oferta'}
            </h1>
            <p
                className={`${m ? 'text-base mb-8' : 'text-xl md:text-3xl mb-12'} opacity-70 font-light max-w-3xl leading-relaxed`}
            >
                {content.subheadline || 'Un subtítulo persuasivo que complementa la gran promesa.'}
            </p>
            {content.video_url && (
                <div
                    className={`w-full max-w-4xl aspect-video ${m ? 'rounded-xl mb-8' : 'rounded-[2rem] mb-12'} bg-black/40 border-2 flex flex-col items-center justify-center shadow-2xl glass overflow-hidden relative group cursor-pointer`}
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
        </section>
    )
}
