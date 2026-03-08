import { MessageSquare, Star } from 'lucide-react'
import type { SectionPreviewProps, ContentItem } from './types'

export function FaqPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Preguntas Frecuentes
            </h2>
            <div className={`${m ? 'space-y-3' : 'space-y-6'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem]'} border transition-all hover:shadow-xl glass`}
                              style={{
                                  borderColor: 'var(--preview-muted)',
                                  backgroundColor: 'var(--preview-card-bg)',
                              }}
                          >
                              <div className={`flex items-start ${m ? 'gap-3' : 'gap-5'}`}>
                                  <div
                                      className={`${m ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} flex items-center justify-center glass flex-shrink-0`}
                                      style={{ color: 'var(--preview-primary)' }}
                                  >
                                      <MessageSquare size={m ? 14 : 20} />
                                  </div>
                                  <div>
                                      <h3
                                          className={`font-bold ${m ? 'text-base mb-2' : 'text-xl mb-4'}`}
                                          style={{ color: 'var(--preview-secondary)' }}
                                      >
                                          {item.question || 'Pregunta...'}
                                      </h3>
                                      <p
                                          className={`opacity-60 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}
                                      >
                                          {item.answer || 'Respuesta...'}
                                      </p>
                                  </div>
                              </div>
                          </div>
                      ))
                    : [1, 2].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem]'} border opacity-20 glass`}
                              style={{
                                  borderColor: 'var(--preview-muted)',
                                  backgroundColor: 'var(--preview-card-bg)',
                              }}
                          >
                              <div className="h-6 w-1/2 mb-4 rounded bg-current opacity-20"></div>
                              <div className="h-4 w-full rounded bg-current opacity-10"></div>
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function ProcessPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-5xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Cómo Funciona
            </h2>
            <div className={`${m ? 'space-y-4' : 'space-y-8'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`flex ${m ? 'gap-4 p-4 rounded-xl' : 'gap-8 p-8 rounded-[2rem]'} border transition-all hover:shadow-xl glass items-start`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div
                                  className={`${m ? 'w-10 h-10 text-lg rounded-xl' : 'w-16 h-16 text-2xl rounded-2xl'} flex items-center justify-center font-black flex-shrink-0`}
                                  style={{
                                      backgroundColor: 'var(--preview-primary)',
                                      color: '#000',
                                  }}
                              >
                                  {i + 1}
                              </div>
                              <div>
                                  <h3
                                      className={`font-bold ${m ? 'text-base mb-1' : 'text-xl mb-3'}`}
                                  >
                                      {item.title || `Paso ${i + 1}`}
                                  </h3>
                                  <p
                                      className={`opacity-60 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}
                                  >
                                      {item.description || 'Descripción del paso...'}
                                  </p>
                              </div>
                          </div>
                      ))
                    : [1, 2, 3].map((i) => (
                          <div
                              key={i}
                              className={`flex ${m ? 'gap-4 p-4 rounded-xl' : 'gap-8 p-8 rounded-[2rem]'} border opacity-20 glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div
                                  className={`${m ? 'w-10 h-10 rounded-xl' : 'w-16 h-16 rounded-2xl'} flex-shrink-0 bg-current opacity-20`}
                              />
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

export function TestimonialsPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Historias de Éxito
            </h2>
            <div
                className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'}`}
            >
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-6 rounded-2xl' : 'p-12 rounded-[2.5rem]'} border shadow-xl relative group glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="flex gap-1 mb-4">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                          key={s}
                                          size={m ? 12 : 16}
                                          fill="var(--preview-accent)"
                                          color="var(--preview-accent)"
                                      />
                                  ))}
                              </div>
                              <p
                                  className={`italic opacity-80 ${m ? 'mb-4 text-sm' : 'mb-10 text-xl'} leading-relaxed relative z-10`}
                              >
                                  &quot;{item.text || 'La mejor inversión que he hecho en mi vida.'}
                                  &quot;
                              </p>
                              <div className="flex items-center gap-3">
                                  <div
                                      className={`${m ? 'w-8 h-8 text-sm' : 'w-12 h-12'} rounded-full border-2 glass flex items-center justify-center font-bold`}
                                      style={{
                                          borderColor: 'var(--preview-primary)',
                                          color: 'var(--preview-primary)',
                                      }}
                                  >
                                      {item.author?.[0] || 'C'}
                                  </div>
                                  <div
                                      className={`font-black ${m ? 'text-sm' : 'text-lg'} tracking-tight`}
                                      style={{ color: 'var(--preview-text)' }}
                                  >
                                      {item.author || 'Cliente Feliz'}
                                  </div>
                              </div>
                              {!m && (
                                  <div
                                      className="absolute top-8 right-10 text-7xl opacity-10 font-black italic"
                                      style={{ color: 'var(--preview-primary)' }}
                                  >
                                      &quot;
                                  </div>
                              )}
                          </div>
                      ))
                    : [1, 2, 3].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-6 rounded-2xl' : 'p-12 rounded-[2.5rem]'} border opacity-20 glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="h-4 w-24 mb-6 rounded bg-current opacity-20"></div>
                              <div className="h-20 w-full rounded-[2rem] bg-current opacity-10 mb-6"></div>
                              <div className="h-6 w-1/3 rounded bg-current opacity-20"></div>
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function LearningPreview({ content, m }: SectionPreviewProps) {
    const items = Array.isArray(content.items) ? (content.items as string[]) : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Lo que aprenderás
            </h2>
            <ul className={`${m ? 'space-y-3' : 'space-y-6'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <li
                              key={i}
                              className={`flex items-start ${m ? 'gap-3 p-4 rounded-xl' : 'gap-6 p-6 rounded-2xl'} bg-opacity-5`}
                              style={{ backgroundColor: 'var(--preview-text)' }}
                          >
                              <span
                                  className={`${m ? 'text-xl' : 'text-3xl'} mt-1 font-black`}
                                  style={{ color: 'var(--preview-accent)' }}
                              >
                                  ✓
                              </span>
                              <span
                                  className={`${m ? 'text-sm' : 'text-xl'} font-medium opacity-90`}
                              >
                                  {item}
                              </span>
                          </li>
                      ))
                    : [1, 2, 3].map((i) => (
                          <li
                              key={i}
                              className={`flex gap-6 opacity-30 ${m ? 'p-4 rounded-xl' : 'p-6 rounded-2xl'} border`}
                              style={{ borderColor: 'var(--preview-muted)' }}
                          >
                              <span className="text-3xl" style={{ color: 'var(--preview-accent)' }}>
                                  ✓
                              </span>
                              <div className="h-6 w-full rounded bg-current opacity-20 mt-2"></div>
                          </li>
                      ))}
            </ul>
        </section>
    )
}

export function TargetPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-5xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                ¿Para quién es esto?
            </h2>
            <div className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-2 gap-8'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-3xl'} bg-opacity-5`}
                              style={{ backgroundColor: 'var(--preview-text)' }}
                          >
                              <h3
                                  className={`font-bold ${m ? 'text-lg mb-2' : 'text-2xl mb-4'}`}
                                  style={{ color: 'var(--preview-primary)' }}
                              >
                                  {item.title || 'Perfil del Avatar'}
                              </h3>
                              <p
                                  className={`opacity-80 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}
                              >
                                  {item.description}
                              </p>
                          </div>
                      ))
                    : [1, 2].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-3xl'} bg-opacity-5`}
                              style={{ backgroundColor: 'var(--preview-text)' }}
                          >
                              <div className="h-6 w-1/2 mb-4 rounded bg-current opacity-20"></div>
                              <div className="h-4 w-full rounded bg-current opacity-10"></div>
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function TimelinePreview({ content, m, title }: SectionPreviewProps & { title: string }) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                {title}
            </h2>
            <div className={`${m ? 'space-y-4' : 'space-y-8'} relative`}>
                {!m && (
                    <div
                        className="absolute left-8 top-0 bottom-0 w-px opacity-20"
                        style={{ backgroundColor: 'var(--preview-primary)' }}
                    />
                )}
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem] ml-16'} border transition-all hover:shadow-xl glass relative`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              {!m && (
                                  <div
                                      className="absolute -left-[2.55rem] top-8 w-4 h-4 rounded-full border-2"
                                      style={{
                                          backgroundColor: 'var(--preview-bg)',
                                          borderColor: 'var(--preview-primary)',
                                      }}
                                  />
                              )}
                              {item.period ? (
                                  <span
                                      className={`${m ? 'text-xs' : 'text-sm'} font-bold tracking-wider uppercase`}
                                      style={{ color: 'var(--preview-primary)' }}
                                  >
                                      {item.period}
                                  </span>
                              ) : null}
                              <h3 className={`font-bold ${m ? 'text-base mt-1' : 'text-xl mt-2'}`}>
                                  {item.title || title}
                              </h3>
                              {item.description ? (
                                  <p
                                      className={`opacity-60 ${m ? 'text-sm mt-1' : 'text-lg mt-3'} leading-relaxed`}
                                  >
                                      {item.description}
                                  </p>
                              ) : null}
                          </div>
                      ))
                    : [1, 2].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem] ml-16'} border opacity-20 glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="h-3 w-1/4 mb-3 rounded bg-current opacity-20" />
                              <div className="h-5 w-1/2 mb-3 rounded bg-current opacity-20" />
                              <div className="h-4 w-full rounded bg-current opacity-10" />
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function AgendaPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Agenda
            </h2>
            <div className={`${m ? 'space-y-3' : 'space-y-6'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`flex ${m ? 'gap-3 p-4 rounded-xl' : 'gap-6 p-6 rounded-2xl'} border transition-all hover:shadow-lg glass items-center`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div
                                  className={`${m ? 'text-sm min-w-[60px]' : 'text-base min-w-[80px]'} font-black flex-shrink-0`}
                                  style={{ color: 'var(--preview-primary)' }}
                              >
                                  {item.time || '00:00'}
                              </div>
                              <div className="flex-1">
                                  <h3 className={`font-bold ${m ? 'text-base' : 'text-lg'}`}>
                                      {item.title || 'Sesión'}
                                  </h3>
                                  {item.speaker ? (
                                      <p className={`opacity-50 ${m ? 'text-xs' : 'text-sm'} mt-1`}>
                                          por {item.speaker}
                                      </p>
                                  ) : null}
                              </div>
                          </div>
                      ))
                    : [1, 2, 3].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-4 rounded-xl' : 'p-6 rounded-2xl'} border opacity-20 glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="h-5 w-full rounded bg-current opacity-15" />
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function BonusStackPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                🎁 Bonos Exclusivos
            </h2>
            <div className={`${m ? 'space-y-3' : 'space-y-6'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`flex ${m ? 'gap-3 p-4 rounded-xl' : 'gap-6 p-8 rounded-[2rem]'} border transition-all hover:shadow-xl glass items-center`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className={`${m ? 'text-2xl' : 'text-4xl'} flex-shrink-0`}>
                                  🎁
                              </div>
                              <div className="flex-1">
                                  <h3 className={`font-bold ${m ? 'text-base' : 'text-xl'}`}>
                                      {item.title || 'Bono'}
                                  </h3>
                                  <p className={`opacity-60 ${m ? 'text-sm' : 'text-base'} mt-1`}>
                                      {item.description || ''}
                                  </p>
                              </div>
                              {item.value ? (
                                  <span
                                      className={`font-black ${m ? 'text-sm' : 'text-lg'} flex-shrink-0`}
                                      style={{ color: 'var(--preview-accent)' }}
                                  >
                                      Valor: {item.value}
                                  </span>
                              ) : null}
                          </div>
                      ))
                    : [1, 2].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem]'} border opacity-20 glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="h-6 w-1/2 mb-3 rounded bg-current opacity-20" />
                              <div className="h-4 w-full rounded bg-current opacity-10" />
                          </div>
                      ))}
            </div>
        </section>
    )
}
