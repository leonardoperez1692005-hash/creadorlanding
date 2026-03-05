'use client'

import { Check, ExternalLink, Save, Loader2 } from 'lucide-react'
import { useWizardStore } from '../store/wizardStore'
import { getStepSchema, type StepSchema } from '../config/stepSchemas'
import { StepGeneric } from './StepGeneric'
import { StepList, StepSimpleList } from './StepList'
import {
  saveProjectAction,
  publishProjectAction,
} from '../actions'

// ─── Main component ──────────────────────────────────────────

export function StepContent({ step }: { step: string }) {
  const store = useWizardStore()
  const schema = getStepSchema(step)

  if (!schema) return <div className="text-white">Sección no encontrada: {step}</div>

  switch (schema.kind) {
    case 'generic': {
      const fields = schema.fieldsFn
        ? schema.fieldsFn(store.structureType)
        : schema.fields ?? []
      return (
        <StepGeneric
          title={schema.title}
          section={store.getSection(step)}
          onUpdate={(c) => store.updateSection(step, c)}
          fields={fields}
        />
      )
    }
    case 'list':
      return (
        <StepList
          title={schema.title}
          section={store.getSection(step)}
          onUpdate={(c) => store.updateSection(step, c)}
          itemFields={schema.itemFields}
        />
      )
    case 'simple-list':
      return (
        <StepSimpleList
          title={schema.title}
          section={store.getSection(step)}
          onUpdate={(c) => store.updateSection(step, c)}
        />
      )
    case 'special':
      if (schema.component === 'tracking') return <TrackingStep />
      if (schema.component === 'review') return <ReviewStep />
      return null
  }
}

// ─── TrackingStep ────────────────────────────────────────────

function TrackingStep() {
  const store = useWizardStore()
  const meta = store.meta
  const update = (key: string, value: string) => store.setMeta({ ...meta, [key]: value })

  const fields = [
    { key: 'facebook_pixel_id', label: 'Facebook Pixel ID', placeholder: 'Ej: 1234567890' },
    { key: 'google_analytics_id', label: 'Google Analytics ID (GA4)', placeholder: 'Ej: G-XXXXXXXXXX' },
    { key: 'google_ads_id', label: 'Google Ads ID', placeholder: 'Ej: AW-XXXXXXXXX' },
    { key: 'seo_title', label: 'SEO Title', placeholder: 'Ej: Mi Landing Page Increíble' },
  ]

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-white/5">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-400 mb-1">Integración</p>
        <h2 className="text-2xl font-black text-white">Tracking & Analytics</h2>
        <p className="text-sm text-white/40 mt-1">Conecta tus herramientas de medición.</p>
      </div>
      <div className="space-y-5">
        {fields.map((f) => (
          <div key={f.key} className="group">
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 group-focus-within:text-cyan-400 transition-colors">
              {f.label}
            </label>
            <input
              type="text"
              value={meta[f.key] ?? ''}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 placeholder-white/20 outline-none focus:border-cyan-500/60 focus:bg-white/[0.07] transition-all"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ReviewStep ──────────────────────────────────────────────

function ReviewStep() {
  const store = useWizardStore()

  const handleSave = async (publish: boolean) => {
    store.setIsSaving(true)
    const payload = {
      projectId: store.projectId ?? undefined,
      name: store.projectName || 'Nuevo Proyecto',
      structureType: store.structureType,
      visualModel: store.visualModel,
      sections: store.sections,
      colors: store.customColors as Record<string, string>,
      meta: store.meta as Record<string, string>,
    }
    const result = publish
      ? await publishProjectAction(payload)
      : await saveProjectAction(payload)
    store.setIsSaving(false)
    if (!result.success) { alert(result.error) }
    else if (result.data) {
      store.setProjectId(result.data.id)
      if (publish) {
        window.open(`/p/${result.data.slug}`, '_blank')
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-emerald-500/10 border border-emerald-500/20">
        <Check className="w-10 h-10 text-emerald-400" />
      </div>
      <h2 className="text-3xl font-black mb-2 text-white">¡Todo Listo!</h2>
      <p className="text-white/40 mb-10 max-w-sm">
        Tu landing page está configurada. Publícala y visualízala en el navegador.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => handleSave(true)}
          disabled={store.isSaving}
          className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-black text-base transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #FF007F, #00F0FF)' }}
        >
          {store.isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
          Publicar y Ver
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={store.isSaving}
          className="inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl font-semibold text-white/60 text-sm transition-all hover:text-white/80 active:scale-95 disabled:opacity-50 border border-white/10 hover:border-white/20"
        >
          <Save className="w-4 h-4" />
          Solo Guardar
        </button>
      </div>
    </div>
  )
}
