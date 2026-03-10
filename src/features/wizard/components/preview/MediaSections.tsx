import Image from 'next/image'
import { sanitizeHtml } from '@/shared/lib/sanitize'
import type { SectionPreviewProps, ContentItem } from './types'

export function ServicesPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
            {content.eyebrow && (
                <p
                    className={`text-center ${m ? 'text-[9px] mb-2' : 'text-xs mb-4'} font-extrabold tracking-[.2em] uppercase`}
                    style={{ color: 'var(--preview-primary)' }}
                >
                    {content.eyebrow}
                </p>
            )}
            <h2 className={`${m ? 'text-2xl mb-4' : 'text-4xl mb-4'} font-bold text-center`}>
                {content.title || 'Nuestros Servicios'}
            </h2>
            {content.subtitle && (
                <p
                    className={`text-center ${m ? 'text-sm mb-8' : 'text-lg mb-14'} opacity-60 max-w-2xl mx-auto leading-relaxed`}
                >
                    {content.subtitle}
                </p>
            )}
            <div
                className={`grid grid-cols-1 ${m ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-7'}`}
            >
                {items.length > 0
                    ? items.map((item, i) => {
                          const isFeatured = item.featured === 'true'
                          const hasImage = !!item.image
                          return (
                              <div
                                  key={i}
                                  className="rounded-3xl border overflow-hidden transition-all hover:-translate-y-1.5 hover:shadow-2xl group"
                                  style={{
                                      backgroundColor: 'var(--preview-card-bg)',
                                      borderColor: isFeatured
                                          ? 'var(--preview-primary)'
                                          : 'var(--preview-muted)',
                                      borderWidth: isFeatured ? '2px' : '1px',
                                      boxShadow: isFeatured
                                          ? '0 0 30px rgba(0,200,255,0.1)'
                                          : undefined,
                                  }}
                              >
                                  {isFeatured && (
                                      <div
                                          className="h-1"
                                          style={{
                                              background:
                                                  'linear-gradient(90deg, var(--preview-primary), var(--preview-accent))',
                                          }}
                                      />
                                  )}
                                  {hasImage && (
                                      <div
                                          className="relative overflow-hidden"
                                          style={{ aspectRatio: '16/10' }}
                                      >
                                          <Image
                                              src={item.image!}
                                              alt={item.title || ''}
                                              width={800}
                                              height={500}
                                              unoptimized
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                          />
                                          {item.tag && (
                                              <span
                                                  className={`absolute top-3 left-3 ${m ? 'px-2 py-0.5 text-[8px]' : 'px-3 py-1 text-[10px]'} font-extrabold tracking-wider uppercase rounded-md`}
                                                  style={{
                                                      backgroundColor: 'var(--preview-primary)',
                                                      color: '#000',
                                                  }}
                                              >
                                                  {item.tag}
                                              </span>
                                          )}
                                      </div>
                                  )}
                                  <div className={m ? 'p-4' : 'p-7'}>
                                      {item.tag && !hasImage && (
                                          <span
                                              className={`inline-block ${m ? 'px-2 py-0.5 text-[8px] mb-2' : 'px-3 py-1 text-[10px] mb-3'} font-extrabold tracking-wider uppercase rounded-md`}
                                              style={{
                                                  backgroundColor: 'var(--preview-primary)',
                                                  color: '#000',
                                              }}
                                          >
                                              {item.tag}
                                          </span>
                                      )}
                                      <h3
                                          className={`${m ? 'text-base mb-1' : 'text-xl mb-2'} font-extrabold`}
                                          style={{ color: 'var(--preview-secondary)' }}
                                      >
                                          {item.title || 'Servicio'}
                                      </h3>
                                      {!!item.subtitle && (
                                          <p
                                              className={`${m ? 'text-xs mb-2' : 'text-sm mb-3'} font-semibold opacity-55`}
                                          >
                                              {item.subtitle}
                                          </p>
                                      )}
                                      {!!item.description && (
                                          <div
                                              className={`opacity-65 ${m ? 'text-xs' : 'text-sm'} leading-relaxed`}
                                              dangerouslySetInnerHTML={{
                                                  __html: sanitizeHtml(item.description),
                                              }}
                                          />
                                      )}
                                  </div>
                              </div>
                          )
                      })
                    : [1, 2, 3].map((i) => (
                          <div
                              key={i}
                              className="rounded-3xl border opacity-20 overflow-hidden"
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div
                                  className="bg-current opacity-10"
                                  style={{ aspectRatio: '16/10' }}
                              />
                              <div className={m ? 'p-4' : 'p-7'}>
                                  <div className="h-6 w-3/4 mb-4 rounded-lg opacity-20 bg-current" />
                                  <div className="h-4 w-full mb-2 rounded-lg opacity-10 bg-current" />
                              </div>
                          </div>
                      ))}
            </div>
            {content.cta_text && (
                <div className="text-center mt-10">
                    <span
                        className={`inline-block ${m ? 'px-6 py-3 text-sm' : 'px-10 py-5 text-lg'} font-black rounded-2xl`}
                        style={{ backgroundColor: 'var(--preview-accent)', color: '#fff' }}
                    >
                        {content.cta_text}
                    </span>
                </div>
            )}
        </section>
    )
}

export function PortfolioPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Portfolio
            </h2>
            <div className={`grid ${m ? 'grid-cols-1 gap-4' : 'grid-cols-2 md:grid-cols-3 gap-8'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'rounded-xl' : 'rounded-[2rem]'} overflow-hidden border group transition-all hover:-translate-y-2 hover:shadow-2xl`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="aspect-video overflow-hidden">
                                  {item.image ? (
                                      <Image
                                          src={item.image}
                                          alt={item.title || ''}
                                          width={800}
                                          height={450}
                                          unoptimized
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      />
                                  ) : (
                                      <div
                                          className="w-full h-full flex items-center justify-center opacity-20 text-3xl font-black"
                                          style={{ backgroundColor: 'var(--preview-muted)' }}
                                      >
                                          IMG
                                      </div>
                                  )}
                              </div>
                              <div className={`${m ? 'p-4' : 'p-6'}`}>
                                  <h3
                                      className={`font-bold ${m ? 'text-base mb-1' : 'text-lg mb-2'}`}
                                  >
                                      {item.title || 'Proyecto'}
                                  </h3>
                                  <p className={`opacity-60 ${m ? 'text-sm' : 'text-base'}`}>
                                      {item.description || ''}
                                  </p>
                              </div>
                          </div>
                      ))
                    : [1, 2, 3].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'rounded-xl' : 'rounded-[2rem]'} border overflow-hidden opacity-20`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
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

export function GalleryPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Galería
            </h2>
            <div className={`grid ${m ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 gap-6'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'rounded-xl' : 'rounded-2xl'} overflow-hidden border group relative aspect-[4/3]`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              {item.url ? (
                                  <Image
                                      src={item.url}
                                      alt={item.caption || ''}
                                      width={600}
                                      height={450}
                                      unoptimized
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center opacity-20 text-2xl font-black">
                                      IMG
                                  </div>
                              )}
                              {item.caption ? (
                                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                      <p className="text-white text-sm font-medium">
                                          {item.caption}
                                      </p>
                                  </div>
                              ) : null}
                          </div>
                      ))
                    : [1, 2, 3].map((i) => (
                          <div
                              key={i}
                              className={`aspect-[4/3] ${m ? 'rounded-xl' : 'rounded-2xl'} border opacity-20`}
                              style={{
                                  backgroundColor: 'var(--preview-card-bg)',
                                  borderColor: 'var(--preview-muted)',
                              }}
                          >
                              <div className="w-full h-full flex items-center justify-center opacity-30 text-xl font-black">
                                  IMG
                              </div>
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function LogoWallPreview({ content, m, title }: SectionPreviewProps & { title: string }) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-20 px-6'} max-w-6xl mx-auto text-center`}>
            <h2
                className={`${m ? 'text-lg mb-6' : 'text-2xl mb-12'} font-bold opacity-40 uppercase tracking-widest`}
            >
                {title}
            </h2>
            <div className={`flex flex-wrap items-center justify-center ${m ? 'gap-6' : 'gap-12'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div
                              key={i}
                              className={`${m ? 'w-16 h-16' : 'w-24 h-24'} flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity glass rounded-xl border`}
                              style={{ borderColor: 'var(--preview-muted)' }}
                          >
                              {item.logo ? (
                                  <Image
                                      src={item.logo}
                                      alt={item.name || ''}
                                      width={96}
                                      height={96}
                                      unoptimized
                                      className="max-w-full max-h-full object-contain p-2"
                                  />
                              ) : (
                                  <span
                                      className={`font-bold ${m ? 'text-xs' : 'text-sm'} text-center`}
                                  >
                                      {item.name || 'Logo'}
                                  </span>
                              )}
                          </div>
                      ))
                    : [1, 2, 3, 4, 5].map((i) => (
                          <div
                              key={i}
                              className={`${m ? 'w-16 h-16' : 'w-24 h-24'} border rounded-xl opacity-10`}
                              style={{
                                  borderColor: 'var(--preview-muted)',
                                  backgroundColor: 'var(--preview-card-bg)',
                              }}
                          />
                      ))}
            </div>
        </section>
    )
}

export function SkillsPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-4xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Habilidades
            </h2>
            <div className={`${m ? 'space-y-4' : 'space-y-6'}`}>
                {items.length > 0
                    ? items.map((item, i) => {
                          const level = parseInt(item.level || '80', 10) || 80
                          return (
                              <div key={i}>
                                  <div className="flex justify-between mb-2">
                                      <span className={`font-bold ${m ? 'text-sm' : 'text-base'}`}>
                                          {item.title || 'Habilidad'}
                                      </span>
                                      <span
                                          className={`font-bold ${m ? 'text-sm' : 'text-base'}`}
                                          style={{ color: 'var(--preview-primary)' }}
                                      >
                                          {level}%
                                      </span>
                                  </div>
                                  <div
                                      className={`${m ? 'h-2 rounded' : 'h-3 rounded-lg'} w-full overflow-hidden`}
                                      style={{ backgroundColor: 'var(--preview-muted)' }}
                                  >
                                      <div
                                          className="h-full rounded-lg transition-all"
                                          style={{
                                              width: `${level}%`,
                                              backgroundColor: 'var(--preview-primary)',
                                          }}
                                      />
                                  </div>
                              </div>
                          )
                      })
                    : [1, 2, 3].map((i) => (
                          <div key={i} className="opacity-20">
                              <div className="h-4 w-1/4 mb-2 rounded bg-current opacity-20" />
                              <div className="h-3 w-full rounded bg-current opacity-10" />
                          </div>
                      ))}
            </div>
        </section>
    )
}

export function SpeakersPreview({ content, m }: SectionPreviewProps) {
    const items: ContentItem[] = Array.isArray(content.items) ? content.items : []
    return (
        <section className={`${m ? 'py-12 px-4' : 'py-24 px-6'} max-w-6xl mx-auto`}>
            <h2 className={`${m ? 'text-2xl mb-8' : 'text-4xl mb-16'} font-bold text-center`}>
                Speakers
            </h2>
            <div className={`grid ${m ? 'grid-cols-2 gap-4' : 'grid-cols-2 md:grid-cols-3 gap-8'}`}>
                {items.length > 0
                    ? items.map((item, i) => (
                          <div key={i} className="text-center group">
                              <div
                                  className={`${m ? 'w-24 h-24 rounded-2xl mb-3' : 'w-40 h-40 rounded-3xl mb-6'} mx-auto overflow-hidden border-2 group-hover:scale-105 transition-transform`}
                                  style={{
                                      borderColor: 'var(--preview-accent)',
                                      backgroundColor: 'var(--preview-card-bg)',
                                  }}
                              >
                                  {item.photo ? (
                                      <Image
                                          src={item.photo}
                                          alt={item.name || ''}
                                          width={160}
                                          height={160}
                                          unoptimized
                                          className="w-full h-full object-cover"
                                      />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center opacity-30 text-3xl font-black">
                                          {(item.name || 'S')[0]}
                                      </div>
                                  )}
                              </div>
                              <h3 className={`font-bold ${m ? 'text-sm' : 'text-lg'}`}>
                                  {item.name || 'Speaker'}
                              </h3>
                              <p
                                  className={`opacity-50 ${m ? 'text-xs mt-1' : 'text-sm mt-2'} leading-relaxed`}
                              >
                                  {item.bio || ''}
                              </p>
                          </div>
                      ))
                    : [1, 2, 3].map((i) => (
                          <div key={i} className="text-center opacity-20">
                              <div
                                  className={`${m ? 'w-24 h-24 rounded-2xl mb-3' : 'w-40 h-40 rounded-3xl mb-6'} mx-auto border bg-current opacity-10`}
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
