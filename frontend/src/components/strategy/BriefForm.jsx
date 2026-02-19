import { useState } from 'react';
import { useStrategyStore } from '../../stores/strategyStore';
import {
    Zap,
    Target,
    Globe,
    Users,
    Crosshair,
    Palette,
    ChevronRight,
    ChevronLeft,
    Cpu,
    Sparkles,
} from 'lucide-react';

const COUNTRIES = [
    'Argentina', 'México', 'Colombia', 'Chile', 'Perú', 'Ecuador',
    'España', 'Estados Unidos', 'Brasil', 'Uruguay', 'Paraguay',
    'Bolivia', 'Venezuela', 'Costa Rica', 'Panamá', 'Rep. Dominicana',
];

const MISSION_TYPES = [
    { value: 'ventas', label: 'OPERACIÓN: VENTAS', icon: Target },
    { value: 'leads', label: 'OPERACIÓN: LEADS', icon: Users },
    { value: 'branding', label: 'OPERACIÓN: BRANDING', icon: Sparkles },
];

export default function BriefForm({ onStartAnalysis }) {
    const [tab, setTab] = useState(0);
    const { briefData, setBriefField, fillDemoData } = useStrategyStore();

    const handleSubmit = () => {
        if (!briefData.sector) {
            alert('El sector es obligatorio');
            return;
        }
        if (!briefData.competitors) {
            alert('Debes indicar al menos un competidor');
            return;
        }
        onStartAnalysis();
    };

    const inputClass =
        'w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-sl-cyan focus:outline-none focus:ring-1 focus:ring-sl-cyan/50 transition-all font-body';
    const labelClass = 'block text-sm font-semibold text-sl-cyan mb-2 font-heading tracking-wider uppercase';

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-sl-cyan/10 border border-sl-cyan/20 rounded-full px-4 py-1.5 mb-4">
                    <Cpu className="w-4 h-4 text-sl-cyan" />
                    <span className="text-xs font-code text-sl-cyan tracking-widest">ZENTRIX OS v2.0</span>
                </div>
                <h1 className="text-3xl font-heading font-bold text-white mb-2">
                    Análisis <span className="text-sl-cyan">Estratégico</span>
                </h1>
                <p className="text-white/50 font-body">
                    Ingresa los datos de tu marca y competidores. La IA analizará todo.
                </p>
            </div>

            {/* Demo Mode */}
            <button
                onClick={fillDemoData}
                className="mb-6 w-full border border-dashed border-sl-magenta/40 rounded-lg px-4 py-2.5 text-sm text-sl-magenta hover:bg-sl-magenta/10 transition-all font-code flex items-center justify-center gap-2"
            >
                <Zap className="w-4 h-4" />
                MODO DEMO — Cargar datos ficticios
            </button>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-900/60 rounded-lg p-1">
                {['MI ADN', 'COMPETENCIA'].map((label, i) => (
                    <button
                        key={i}
                        onClick={() => setTab(i)}
                        className={`flex-1 py-2.5 rounded-md text-sm font-heading font-semibold tracking-wider transition-all ${tab === i
                                ? 'bg-sl-cyan/20 text-sl-cyan border border-sl-cyan/30'
                                : 'text-white/40 hover:text-white/70'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab 0: MI ADN */}
            {tab === 0 && (
                <div className="space-y-5 animate-fadeIn">
                    <div>
                        <label className={labelClass}>
                            <Zap className="w-3.5 h-3.5 inline mr-1" />
                            Nombre de marca
                        </label>
                        <input
                            className={inputClass}
                            placeholder="Ej: ZER0_TRUST"
                            value={briefData.brandName}
                            onChange={(e) => setBriefField('brandName', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            <Target className="w-3.5 h-3.5 inline mr-1" />
                            Sector / Industria *
                        </label>
                        <input
                            className={inputClass}
                            placeholder="Ej: Ciberseguridad para PYMEs"
                            value={briefData.sector}
                            onChange={(e) => setBriefField('sector', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                            Valores y diferencial
                        </label>
                        <textarea
                            className={`${inputClass} h-20 resize-none`}
                            placeholder="¿Qué te hace único? Valores de marca, propuesta de valor..."
                            value={briefData.brandValues}
                            onChange={(e) => setBriefField('brandValues', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            <Users className="w-3.5 h-3.5 inline mr-1" />
                            Público objetivo
                        </label>
                        <textarea
                            className={`${inputClass} h-20 resize-none`}
                            placeholder="¿A quién le vendes? Edad, perfil, problemas que tienen..."
                            value={briefData.targetAudience}
                            onChange={(e) => setBriefField('targetAudience', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            <Crosshair className="w-3.5 h-3.5 inline mr-1" />
                            Objetivos específicos
                        </label>
                        <input
                            className={inputClass}
                            placeholder="Ej: Generar 100 leads/mes, cerrar 20 ventas..."
                            value={briefData.objectives}
                            onChange={(e) => setBriefField('objectives', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            <Palette className="w-3.5 h-3.5 inline mr-1" />
                            Estética / Diseño
                        </label>
                        <input
                            className={inputClass}
                            placeholder="Ej: Minimalista, oscuro, colores fríos..."
                            value={briefData.designSystem}
                            onChange={(e) => setBriefField('designSystem', e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => setTab(1)}
                        className="w-full mt-4 bg-gradient-to-r from-sl-cyan/20 to-sl-cyan/10 border border-sl-cyan/30 text-sl-cyan py-3 rounded-lg font-heading font-semibold tracking-wider hover:from-sl-cyan/30 hover:to-sl-cyan/20 transition-all flex items-center justify-center gap-2"
                    >
                        SIGUIENTE: COMPETENCIA
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Tab 1: COMPETENCIA */}
            {tab === 1 && (
                <div className="space-y-5 animate-fadeIn">
                    <div>
                        <label className={labelClass}>
                            <Crosshair className="w-3.5 h-3.5 inline mr-1" />
                            Competidores (URLs o nombres) *
                        </label>
                        <textarea
                            className={`${inputClass} h-32 resize-none font-code text-sm`}
                            placeholder={'https://competidor1.com\nhttps://competidor2.com\nhttps://competidor3.com\n\nO simplemente nombres: "Competidor A, Competidor B"'}
                            value={briefData.competitors}
                            onChange={(e) => setBriefField('competitors', e.target.value)}
                        />
                        <p className="text-xs text-white/30 mt-1 font-code">
                            Máximo 3 URLs para scraping. También acepta texto libre.
                        </p>
                    </div>

                    <div>
                        <label className={labelClass}>
                            <Globe className="w-3.5 h-3.5 inline mr-1" />
                            País / Región
                        </label>
                        <select
                            className={inputClass}
                            value={briefData.country}
                            onChange={(e) => setBriefField('country', e.target.value)}
                        >
                            {COUNTRIES.map((c) => (
                                <option key={c} value={c} className="bg-slate-900">
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Tipo de misión</label>
                        <div className="grid grid-cols-3 gap-3">
                            {MISSION_TYPES.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => setBriefField('missionType', value)}
                                    className={`p-3 rounded-lg border text-center transition-all ${briefData.missionType === value
                                            ? 'border-sl-cyan bg-sl-cyan/10 text-sl-cyan'
                                            : 'border-white/10 text-white/40 hover:border-white/20'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 mx-auto mb-1" />
                                    <span className="text-xs font-code">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => setTab(0)}
                            className="flex-1 border border-white/10 text-white/50 py-3 rounded-lg font-heading font-semibold tracking-wider hover:border-white/20 transition-all flex items-center justify-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            VOLVER
                        </button>

                        <button
                            onClick={handleSubmit}
                            className="flex-[2] bg-gradient-to-r from-sl-magenta to-sl-magenta/80 text-white py-3 rounded-lg font-heading font-bold tracking-wider hover:shadow-neon-magenta transition-all flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            EJECUTAR ANÁLISIS ESTRATÉGICO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
