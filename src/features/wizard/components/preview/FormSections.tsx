import { User, MessageSquare } from 'lucide-react'
import type { SectionPreviewProps } from './types'

export function LeadCapturePreview({ content, m }: SectionPreviewProps) {
    return (
        <section className={`${m ? 'py-16 px-4' : 'py-32 px-6'} max-w-4xl mx-auto text-center`}>
            <div
                className={`glass ${m ? 'p-6 rounded-2xl' : 'p-16 rounded-[4rem]'} border border-opacity-10 shadow-2xl`}
                style={{
                    backgroundColor: 'var(--preview-card-bg)',
                    borderColor: 'var(--preview-muted)',
                }}
            >
                <h2 className={`${m ? 'text-2xl mb-4' : 'text-5xl mb-8'} font-extrabold`}>
                    {content.headline || 'Únete ahora'}
                </h2>
                {content.subheadline && (
                    <p
                        className={`${m ? 'mb-6 text-base' : 'mb-12 text-2xl'} opacity-60 font-light leading-relaxed`}
                    >
                        {content.subheadline}
                    </p>
                )}
                <form
                    className="max-w-md mx-auto flex flex-col gap-4"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <div className="relative group">
                        <User
                            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity"
                            size={m ? 16 : 20}
                            style={{ color: 'var(--preview-primary)' }}
                        />
                        <input
                            type="text"
                            placeholder="Tu Nombre"
                            className={`${m ? 'pl-10 pr-4 py-3 rounded-xl text-sm' : 'pl-14 pr-6 py-5 rounded-2xl text-xl'} w-full bg-black/20 border-2 outline-none font-medium transition-all focus:border-opacity-100 border-opacity-20`}
                            style={{
                                backgroundColor: 'var(--preview-bg)',
                                borderColor: 'var(--preview-primary)',
                            }}
                            readOnly
                        />
                    </div>
                    <div className="relative group">
                        <MessageSquare
                            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity"
                            size={m ? 16 : 20}
                            style={{ color: 'var(--preview-primary)' }}
                        />
                        <input
                            type="email"
                            placeholder="Tu Email"
                            className={`${m ? 'pl-10 pr-4 py-3 rounded-xl text-sm' : 'pl-14 pr-6 py-5 rounded-2xl text-xl'} w-full bg-black/20 border-2 outline-none font-medium transition-all focus:border-opacity-100 border-opacity-20`}
                            style={{
                                backgroundColor: 'var(--preview-bg)',
                                borderColor: 'var(--preview-primary)',
                            }}
                            readOnly
                        />
                    </div>
                    <button
                        className={`${m ? 'px-6 py-3 rounded-xl text-base' : 'px-10 py-6 rounded-2xl text-2xl'} font-black mt-2 transition-all hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 active:scale-95`}
                        style={{ backgroundColor: 'var(--preview-primary)', color: '#000' }}
                    >
                        {content.cta_text || 'Enviar'}
                    </button>
                </form>
            </div>
        </section>
    )
}

export function ContactPreview({ content, m }: SectionPreviewProps) {
    return (
        <section className={`${m ? 'py-16 px-4' : 'py-32 px-6'} max-w-4xl mx-auto text-center`}>
            <div
                className={`glass ${m ? 'p-6 rounded-2xl' : 'p-16 rounded-[4rem]'} border shadow-2xl`}
                style={{
                    backgroundColor: 'var(--preview-card-bg)',
                    borderColor: 'var(--preview-muted)',
                }}
            >
                <h2 className={`${m ? 'text-2xl mb-4' : 'text-5xl mb-8'} font-extrabold`}>
                    {content.title || 'Contacto'}
                </h2>
                <div
                    className={`${m ? 'space-y-2 mb-6 text-sm' : 'space-y-3 mb-12 text-lg'} opacity-60`}
                >
                    {content.email && <p>{content.email}</p>}
                    {content.phone && <p>{content.phone}</p>}
                    {content.address && <p>{content.address}</p>}
                </div>
                <form
                    className="max-w-md mx-auto flex flex-col gap-4"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <input
                        type="text"
                        placeholder="Nombre"
                        className={`${m ? 'px-4 py-3 rounded-xl text-sm' : 'px-6 py-5 rounded-2xl text-lg'} w-full border-2 outline-none font-medium`}
                        style={{
                            backgroundColor: 'var(--preview-bg)',
                            borderColor: 'var(--preview-primary)',
                            color: 'var(--preview-text)',
                        }}
                        readOnly
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        className={`${m ? 'px-4 py-3 rounded-xl text-sm' : 'px-6 py-5 rounded-2xl text-lg'} w-full border-2 outline-none font-medium`}
                        style={{
                            backgroundColor: 'var(--preview-bg)',
                            borderColor: 'var(--preview-primary)',
                            color: 'var(--preview-text)',
                        }}
                        readOnly
                    />
                    <textarea
                        placeholder="Mensaje"
                        rows={3}
                        className={`${m ? 'px-4 py-3 rounded-xl text-sm' : 'px-6 py-5 rounded-2xl text-lg'} w-full border-2 outline-none font-medium resize-none`}
                        style={{
                            backgroundColor: 'var(--preview-bg)',
                            borderColor: 'var(--preview-primary)',
                            color: 'var(--preview-text)',
                        }}
                        readOnly
                    />
                    <button
                        className={`${m ? 'px-6 py-3 rounded-xl text-base' : 'px-10 py-6 rounded-2xl text-xl'} font-black mt-2 transition-all hover:shadow-lg`}
                        style={{ backgroundColor: 'var(--preview-primary)', color: '#000' }}
                    >
                        {content.cta_text || 'Enviar Mensaje'}
                    </button>
                </form>
            </div>
        </section>
    )
}
