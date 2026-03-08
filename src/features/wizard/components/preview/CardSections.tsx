/* eslint-disable @next/next/no-img-element */
import { Check } from 'lucide-react'
import type { SectionPreviewProps, ContentItem } from './types'

export function BenefitsPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-20 px-6'} max-w-6xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Beneficios
            </h2>
            <div
                className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'}`}
            >
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border transition-all hover:-translate-y-2 hover:shadow-2xl glass group`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div
                                  className={`${m ? 'w-10 h-10 mb-4 rounded-xl' : 'w-14 h-14 mb-8 rounded-2xl'} flex items-center justify-center glass group-hover:scale-110 transition-transform`}
                                  style={{ color: 'var(--preview-secondary)' }}
                              >
                                  <Check size={m ? 20 : 28} strokeWidth={3} />
                              </div>
                              <h3
                                  className={`${m ? 'text-lg mb-2' : 'text-2xl mb-4'} font-bold`}
                                  style={{ color: 'var(--preview-secondary)' }}
                              >
                                  {item.title || 'Beneficio Principal'}
                              </h3>
                              <p
                                  className={`opacity-60 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}
                              >
                                  {item.description || 'Descripción del beneficio...'}
                              </p>
                          </div>
                      ))
                    : [1, 2, 3].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border border-opacity-10 glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="h-14 w-14 mb-8 rounded-2xl opacity-20 bg-current"></div>
                              <div className="h-8 w-3/4 mb-6 rounded-lg opacity-20 bg-current"></div>
                              <div className="h-4 w-full mb-3 rounded-lg opacity-10 bg-current"></div>
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function FeaturesPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Características
            </h2>
            <div
                className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-8'}`}
            >
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border transition-all hover:-translate-y-2 hover:shadow-2xl glass group`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div
                                  className={`${m ? 'w-10 h-10 mb-4 rounded-xl' : 'w-14 h-14 mb-8 rounded-2xl'} flex items-center justify-center glass group-hover:scale-110 transition-transform`}
                                  style={{ color: 'var(--preview-secondary)' }}
                              >
                                  <Check size={m ? 20 : 28} strokeWidth={3} />
                              </div>
                              <h3
                                  className={`${m ? 'text-lg mb-2' : 'text-2xl mb-4'} font-bold`}
                                  style={{ color: 'var(--preview-secondary)' }}
                              >
                                  {item.title || 'Característica'}
                              </h3>
                              <p
                                  className={`opacity-60 ${m ? 'text-sm' : 'text-lg'} leading-relaxed`}
                              >
                                  {item.description || 'Descripción...'}
                              </p>
                          </div>
                      ))
                    : [1, 2, 3].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-5 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border opacity-20 glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="h-14 w-14 mb-8 rounded-2xl opacity-20 bg-current" />
                              <div className="h-8 w-3/4 mb-6 rounded-lg opacity-20 bg-current" />
                              <div className="h-4 w-full mb-3 rounded-lg opacity-10 bg-current" />
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function TeamPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Nuestro Equipo
            </h2>
            <div className={`grid ${m ? 'grid-cols-2 gap-4' : 'grid-cols-2 md:grid-cols-4 gap-8'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div key={i} className="text-center group">
                              <div
                                  className={`${m ? 'w-24 h-24 rounded-2xl mb-3' : 'w-32 h-32 rounded-3xl mb-6'} mx-auto overflow-hidden border-2 group-hover:scale-105 transition-transform`}
                                  style={{
                                      borderColor: 'var(--preview-primary)',
                                      backgroundColor: 'var(--preview-card-bg)',
                                  }}
                              >
                                  {item.photo ? (
                                      <img
                                          src={item.photo}
                                          alt={item.name || ''}
                                          className="w-full h-full object-cover"
                                      />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center opacity-30 text-2xl font-black">
                                          {(item.name || 'T')[0]}
                                      </div>
                                  )}
                              </div>
                              <h3 className={`font-bold ${m ? 'text-sm' : 'text-lg'}`}>
                                  {item.name || 'Nombre'}
                              </h3>
                              <p className={`opacity-50 ${m ? 'text-xs' : 'text-sm'}`}>
                                  {item.role || 'Cargo'}
                              </p>
                          </div>
                      ))
                    : [1, 2, 3, 4].map((i) => (
                          <div key={i} className="text-center opacity-20">
                              <div
                                  className={`${m ? 'w-24 h-24 rounded-2xl mb-3' : 'w-32 h-32 rounded-3xl mb-6'} mx-auto border bg-current opacity-10`}
                                  style={{ borderColor: 'var(--preview-muted)' }}
                              />
                              <div className="h-4 w-2/3 mx-auto rounded bg-current opacity-20 mb-2" />
                              <div className="h-3 w-1/2 mx-auto rounded bg-current opacity-10" />
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function PricingPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Planes y Precios
            </h2>
            <div className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-3 gap-8'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-6 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border text-center transition-all hover:-translate-y-2 hover:shadow-2xl glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <h3
                                  className={`${m ? 'text-lg mb-2' : 'text-2xl mb-4'} font-bold`}
                                  style={{ color: 'var(--preview-secondary)' }}
                              >
                                  {item.name || 'Plan'}
                              </h3>
                              <div
                                  className={`${m ? 'text-3xl mb-4' : 'text-5xl mb-8'} font-black`}
                                  style={{ color: 'var(--preview-primary)' }}
                              >
                                  {item.price || '$0'}
                              </div>
                              <button
                                  className={`w-full ${m ? 'py-3 rounded-xl text-sm' : 'py-4 rounded-2xl text-base'} font-bold transition-all hover:scale-105`}
                                  style={{
                                      backgroundColor: 'var(--preview-accent)',
                                      color: '#FFF',
                                  }}
                              >
                                  {item.cta_text || 'Elegir Plan'}
                              </button>
                          </div>
                      ))
                    : [1, 2, 3].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-6 rounded-2xl' : 'p-10 rounded-[2.5rem]'} border opacity-20 glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="h-6 w-1/2 mx-auto mb-4 rounded bg-current opacity-20" />
                              <div className="h-10 w-1/3 mx-auto mb-6 rounded bg-current opacity-20" />
                              <div className="h-10 w-full rounded-xl bg-current opacity-10" />
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function StatsPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-20 px-6'} max-w-6xl mx-auto`}>
            <div
                className={`grid ${m ? 'grid-cols-2 gap-4' : 'grid-cols-2 md:grid-cols-4 gap-8'} text-center`}
            >
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem]'} border glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div
                                  className={`${m ? 'text-3xl mb-2' : 'text-5xl mb-4'} font-black`}
                                  style={{ color: 'var(--preview-primary)' }}
                              >
                                  {item.value || '0'}
                              </div>
                              <div
                                  className={`opacity-60 ${m ? 'text-xs' : 'text-sm'} font-bold uppercase tracking-wider`}
                              >
                                  {item.label || 'Métrica'}
                              </div>
                          </div>
                      ))
                    : [1, 2, 3, 4].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'p-4 rounded-xl' : 'p-8 rounded-[2rem]'} border opacity-20 glass`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="h-10 w-1/2 mx-auto mb-3 rounded bg-current opacity-20" />
                              <div className="h-3 w-2/3 mx-auto rounded bg-current opacity-10" />
                          </div>
                      ))}
            </div>
        </section>
    )
}
