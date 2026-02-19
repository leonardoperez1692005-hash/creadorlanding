
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Sparkles, Zap, Shield } from 'lucide-react';
import { api } from '../lib/api';

export default function Pricing() {
    const { plan, checkAuth } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const plans = [
        {
            id: 'starter',
            name: 'Starter',
            price: '$0',
            description: 'Para probar la plataforma',
            features: ['3 Proyectos', 'Analytics Básicos', '500 Leads'],
            icon: Shield,
            color: 'from-gray-500 to-slate-500'
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '$29',
            period: '/mes',
            description: 'Para creadores serios',
            features: ['20 Proyectos', 'ZentrixOs AI (50/mes)', 'Dominio Personalizado', 'Soporte Prioritario', 'Analytics Avanzados'],
            recommended: true,
            icon: Zap,
            color: 'from-sl-cyan to-blue-500'
        },
        {
            id: 'agency',
            name: 'Agency',
            price: '$99',
            period: '/mes',
            description: 'Para escalar tu negocio',
            features: ['100 Proyectos', 'ZentrixOs AI (200/mes)', 'White Label', 'API Access', 'Team Members'],
            icon: Sparkles,
            color: 'from-purple-500 to-pink-500'
        }
    ];

    const handleUpgrade = async (slug) => {
        if (loading) return;
        setLoading(true);
        try {
            // Usamos endpoint directo del backend (Mock para MVP)
            const token = localStorage.getItem('sl_token');
            const res = await fetch('http://localhost:3001/api/auth/upgrade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planSlug: slug })
            });

            if (res.ok) {
                await checkAuth(); // Recargar usuario y plan
                alert(`¡Plan actualizado a ${slug.toUpperCase()}!`);
                navigate('/');
            } else {
                alert('Error al actualizar plan');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0E1A] text-white py-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                        Elige tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-sl-cyan to-emerald-400">Poder</span>
                    </h1>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        Desbloquea todo el potencial de StaticLaunch y ZentrixOs para escalar tus ventas.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((p) => {
                        const isCurrent = plan?.slug === p.id;
                        const Icon = p.icon;

                        return (
                            <div
                                key={p.id}
                                className={`relative bg-white/5 border rounded-2xl p-8 transition-all hover:-translate-y-2 ${p.recommended ? 'border-sl-cyan/50 shadow-lg shadow-sl-cyan/10' : 'border-white/10 hover:border-white/20'}`}
                            >
                                {p.recommended && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sl-cyan to-blue-500 text-black font-bold text-xs py-1 px-3 rounded-full shadow-lg">
                                        RECOMENDADO
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center mb-6`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>

                                <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold">{p.price}</span>
                                    {p.period && <span className="text-white/40 text-sm">{p.period}</span>}
                                </div>
                                <p className="text-white/50 text-sm mb-8">{p.description}</p>

                                <ul className="space-y-4 mb-8">
                                    {p.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                                            <Check className="w-5 h-5 text-sl-cyan shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleUpgrade(p.id)}
                                    disabled={isCurrent || loading}
                                    className={`w-full py-3 rounded-lg font-bold transition-all ${isCurrent
                                            ? 'bg-white/10 text-white/40 cursor-default'
                                            : p.recommended
                                                ? 'bg-sl-cyan text-black hover:bg-sl-cyan/90 shadow-lg shadow-sl-cyan/20'
                                                : 'bg-white text-black hover:bg-white/90'
                                        }`}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> :
                                        isCurrent ? 'Plan Actual' : 'Seleccionar Plan'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors text-sm">
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
