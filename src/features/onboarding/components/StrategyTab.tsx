'use client'

import type React from 'react'
import { Target } from 'lucide-react'
import type { OnboardingFormData } from './onboarding-constants'

interface StrategyTabProps {
    formData: OnboardingFormData
    setFormData: React.Dispatch<React.SetStateAction<OnboardingFormData>>
}

export function StrategyTab({ formData, setFormData }: StrategyTabProps) {
    return (
        <>
            <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-6 backdrop-blur-sm">
                <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <Target className="w-4 h-4 text-cyan-400" /> ESTRATEGIA COMERCIAL
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Datos base para el generador BrandVortix
                    </p>
                </div>
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label
                                htmlFor="onb-brand-name"
                                className="block text-xs uppercase font-semibold text-gray-400 mb-1.5"
                            >
                                Nombre de Marca *
                            </label>
                            <input
                                id="onb-brand-name"
                                type="text"
                                placeholder="Ej: TechPro Solutions"
                                value={formData.brand_name}
                                onChange={(e) =>
                                    setFormData((f) => ({
                                        ...f,
                                        brand_name: e.target.value,
                                    }))
                                }
                                className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="onb-sector"
                                className="block text-xs uppercase font-semibold text-gray-400 mb-1.5"
                            >
                                Sector o Nicho *
                            </label>
                            <input
                                id="onb-sector"
                                type="text"
                                placeholder="Ej: SaaS B2B, Agencia de marketing..."
                                value={formData.sector}
                                onChange={(e) =>
                                    setFormData((f) => ({
                                        ...f,
                                        sector: e.target.value,
                                    }))
                                }
                                className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="onb-target-audience"
                            className="block text-xs uppercase font-semibold text-gray-400 mb-1.5"
                        >
                            Público Objetivo (Buyer Persona) *
                        </label>
                        <textarea
                            id="onb-target-audience"
                            placeholder="Ej: CEOs de empresas de logística con 50-200 empleados..."
                            value={formData.target_audience}
                            onChange={(e) =>
                                setFormData((f) => ({
                                    ...f,
                                    target_audience: e.target.value,
                                }))
                            }
                            rows={3}
                            className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-3 text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="onb-brand-values"
                            className="block text-xs uppercase font-semibold text-gray-400 mb-1.5"
                        >
                            Valores y Tono de Marca *
                        </label>
                        <textarea
                            id="onb-brand-values"
                            placeholder="Ej: Voz directa, técnica y sofisticada. Centrada en resultados."
                            value={formData.brand_values}
                            onChange={(e) =>
                                setFormData((f) => ({
                                    ...f,
                                    brand_values: e.target.value,
                                }))
                            }
                            rows={3}
                            className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-3 text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="onb-business-objective"
                            className="block text-xs uppercase font-semibold text-gray-400 mb-1.5"
                        >
                            Objetivo Comercial *
                        </label>
                        <textarea
                            id="onb-business-objective"
                            placeholder="Ej: Agendar demos calificadas. Escalar de 7 a 8 cifras."
                            value={formData.business_objective}
                            onChange={(e) =>
                                setFormData((f) => ({
                                    ...f,
                                    business_objective: e.target.value,
                                }))
                            }
                            rows={3}
                            className="w-full bg-[#0A0E1A] border border-[#374151] rounded-lg px-4 py-3 text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                </div>
            </div>
        </>
    )
}
