'use client'

import { useEffect, useState } from 'react'
import {
    Loader2,
    Plus,
    Trash2,
    Briefcase,
    HelpCircle,
    MessageSquare,
    BarChart3,
    Users,
    Sparkles,
    Save,
    ChevronDown,
    ChevronRight,
} from 'lucide-react'
import { getBusinessDataAction, saveBusinessDataAction, type BusinessData } from '../actions'

type ListItem = Record<string, string | undefined>

interface ListSectionProps {
    title: string
    description: string
    icon: React.ReactNode
    items: ListItem[]
    fields: { key: string; label: string; placeholder: string; multiline?: boolean }[]
    onAdd: () => void
    onRemove: (index: number) => void
    onChange: (index: number, key: string, value: string) => void
}

function ListSection({
    title,
    description,
    icon,
    items,
    fields,
    onAdd,
    onRemove,
    onChange,
}: ListSectionProps) {
    const [open, setOpen] = useState(items.length > 0)

    return (
        <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <div className="text-left">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                            {title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {items.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
                            {items.length}
                        </span>
                    )}
                    {open ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                </div>
            </button>

            {open && (
                <div className="px-4 pb-4 space-y-3">
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className="bg-[#0A0E1A] border border-[#1F2937] rounded-lg p-3 relative group"
                        >
                            <button
                                onClick={() => onRemove(i)}
                                className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="space-y-2 pr-6">
                                {fields.map((f) => (
                                    <div key={f.key}>
                                        <label className="block text-[10px] uppercase text-gray-500 mb-1">
                                            {f.label}
                                        </label>
                                        {f.multiline ? (
                                            <textarea
                                                value={item[f.key] ?? ''}
                                                onChange={(e) => onChange(i, f.key, e.target.value)}
                                                placeholder={f.placeholder}
                                                rows={2}
                                                className="w-full bg-transparent border border-[#374151] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 resize-y"
                                            />
                                        ) : (
                                            <input
                                                value={item[f.key] ?? ''}
                                                onChange={(e) => onChange(i, f.key, e.target.value)}
                                                placeholder={f.placeholder}
                                                className="w-full bg-transparent border border-[#374151] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={onAdd}
                        className="w-full py-2.5 rounded-lg border border-dashed border-[#374151] text-gray-500 text-xs font-semibold flex items-center justify-center gap-2 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                </div>
            )}
        </div>
    )
}

export function BusinessDataSection() {
    const [data, setData] = useState<BusinessData>({
        services: [],
        faqs: [],
        testimonials: [],
        stats: [],
        team_members: [],
        differentiators: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        getBusinessDataAction().then((res) => {
            if (res.success && res.data) setData(res.data)
            setLoading(false)
        })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        const result = await saveBusinessDataAction(data)
        setSaving(false)
        if (result.success) {
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } else {
            alert(result.error)
        }
    }

    function updateList(key: keyof BusinessData, items: ListItem[]) {
        setData((d) => ({ ...d, [key]: items }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
        )
    }

    const filledCount = [
        data.services.length > 0,
        data.faqs.length > 0,
        data.testimonials.length > 0,
        data.stats.length > 0,
        data.team_members.length > 0,
        data.differentiators.length > 0,
    ].filter(Boolean).length

    return (
        <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-6 backdrop-blur-sm">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" /> DATOS DE NEGOCIO
                    </h2>
                    <span className="text-[10px] text-gray-500">{filledCount}/6 completados</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Cuanta más información cargues, mejores serán las estrategias y landings que
                    genere la IA. Sin estos datos, la IA inventará contenido genérico que vos vas a
                    tener que reemplazar.
                </p>
            </div>

            <div className="space-y-3">
                <ListSection
                    title="Servicios / Productos"
                    description="¿Qué ofrecés? La IA los usa para crear bloques de servicios reales."
                    icon={<Briefcase className="w-4 h-4 text-cyan-400" />}
                    items={data.services}
                    fields={[
                        {
                            key: 'title',
                            label: 'Nombre',
                            placeholder: 'Ej: Consultoría Estratégica',
                        },
                        {
                            key: 'description',
                            label: 'Descripción',
                            placeholder:
                                'Ej: Análisis de mercado y plan de acción para escalar tu negocio.',
                            multiline: true,
                        },
                    ]}
                    onAdd={() =>
                        updateList('services', [...data.services, { title: '', description: '' }])
                    }
                    onRemove={(i) =>
                        updateList(
                            'services',
                            data.services.filter((_, idx) => idx !== i),
                        )
                    }
                    onChange={(i, key, val) =>
                        updateList(
                            'services',
                            data.services.map((item, idx) =>
                                idx === i ? { ...item, [key]: val } : item,
                            ),
                        )
                    }
                />

                <ListSection
                    title="Preguntas Frecuentes"
                    description="Las preguntas reales de tus clientes. La IA las usa + agrega objeciones competitivas."
                    icon={<HelpCircle className="w-4 h-4 text-amber-400" />}
                    items={data.faqs}
                    fields={[
                        {
                            key: 'question',
                            label: 'Pregunta',
                            placeholder: 'Ej: ¿Cuánto tarda el proceso?',
                        },
                        {
                            key: 'answer',
                            label: 'Respuesta',
                            placeholder: 'Ej: El proceso completo lleva entre 2 y 4 semanas...',
                            multiline: true,
                        },
                    ]}
                    onAdd={() => updateList('faqs', [...data.faqs, { question: '', answer: '' }])}
                    onRemove={(i) =>
                        updateList(
                            'faqs',
                            data.faqs.filter((_, idx) => idx !== i),
                        )
                    }
                    onChange={(i, key, val) =>
                        updateList(
                            'faqs',
                            data.faqs.map((item, idx) =>
                                idx === i ? { ...item, [key]: val } : item,
                            ),
                        )
                    }
                />

                <ListSection
                    title="Testimonios"
                    description="Testimonios reales de clientes. Sin esto, la IA generará testimonios ficticios."
                    icon={<MessageSquare className="w-4 h-4 text-green-400" />}
                    items={data.testimonials}
                    fields={[
                        {
                            key: 'text',
                            label: 'Testimonio',
                            placeholder:
                                'Ej: Duplicamos nuestras ventas en 3 meses gracias a su estrategia.',
                            multiline: true,
                        },
                        {
                            key: 'author',
                            label: 'Nombre y cargo',
                            placeholder: 'Ej: María García, CEO de TechCorp',
                        },
                    ]}
                    onAdd={() =>
                        updateList('testimonials', [...data.testimonials, { text: '', author: '' }])
                    }
                    onRemove={(i) =>
                        updateList(
                            'testimonials',
                            data.testimonials.filter((_, idx) => idx !== i),
                        )
                    }
                    onChange={(i, key, val) =>
                        updateList(
                            'testimonials',
                            data.testimonials.map((item, idx) =>
                                idx === i ? { ...item, [key]: val } : item,
                            ),
                        )
                    }
                />

                <ListSection
                    title="Números / Estadísticas"
                    description="Tus métricas reales: clientes, años, satisfacción. Sin datos, la IA inventará números."
                    icon={<BarChart3 className="w-4 h-4 text-pink-400" />}
                    items={data.stats}
                    fields={[
                        { key: 'value', label: 'Valor', placeholder: 'Ej: +500' },
                        { key: 'label', label: 'Etiqueta', placeholder: 'Ej: Clientes activos' },
                    ]}
                    onAdd={() => updateList('stats', [...data.stats, { value: '', label: '' }])}
                    onRemove={(i) =>
                        updateList(
                            'stats',
                            data.stats.filter((_, idx) => idx !== i),
                        )
                    }
                    onChange={(i, key, val) =>
                        updateList(
                            'stats',
                            data.stats.map((item, idx) =>
                                idx === i ? { ...item, [key]: val } : item,
                            ),
                        )
                    }
                />

                <ListSection
                    title="Equipo"
                    description="Los miembros de tu equipo que querés mostrar."
                    icon={<Users className="w-4 h-4 text-purple-400" />}
                    items={data.team_members}
                    fields={[
                        { key: 'name', label: 'Nombre', placeholder: 'Ej: Juan Pérez' },
                        { key: 'role', label: 'Cargo', placeholder: 'Ej: Director de Estrategia' },
                    ]}
                    onAdd={() =>
                        updateList('team_members', [...data.team_members, { name: '', role: '' }])
                    }
                    onRemove={(i) =>
                        updateList(
                            'team_members',
                            data.team_members.filter((_, idx) => idx !== i),
                        )
                    }
                    onChange={(i, key, val) =>
                        updateList(
                            'team_members',
                            data.team_members.map((item, idx) =>
                                idx === i ? { ...item, [key]: val } : item,
                            ),
                        )
                    }
                />

                {/* Diferenciadores — textarea simple */}
                <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                                Diferenciadores
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                ¿Qué te hace ÚNICO vs la competencia? La IA usa esto para los
                                ángulos de ataque.
                            </p>
                        </div>
                    </div>
                    <textarea
                        value={data.differentiators}
                        onChange={(e) =>
                            setData((d) => ({ ...d, differentiators: e.target.value }))
                        }
                        placeholder="Ej: Somos los únicos que ofrecemos garantía de resultados en 90 días. Nuestro equipo tiene +15 años en el sector. Metodología propia validada con +200 clientes."
                        rows={4}
                        className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 leading-relaxed resize-y focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                </div>
            </div>

            {/* Save button */}
            <div className="mt-6">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saved ? '¡Guardado!' : 'Guardar datos de negocio'}
                </button>
            </div>
        </div>
    )
}
