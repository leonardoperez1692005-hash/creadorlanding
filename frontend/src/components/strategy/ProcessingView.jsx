import { Loader2, Radio, Scan, Brain, CheckCircle2 } from 'lucide-react';

const PHASES = [
    { icon: Scan, label: 'ESCANEANDO COMPETIDORES', sub: 'Firecrawl Protocol' },
    { icon: Radio, label: 'INVESTIGANDO MERCADO', sub: 'Perplexity Radar' },
    { icon: Brain, label: 'SINTETIZANDO ESTRATEGIA', sub: 'Gemini Engine' },
    { icon: CheckCircle2, label: 'ANÁLISIS COMPLETO', sub: 'Preparando Dashboard' },
];

export default function ProcessingView({ status }) {
    // Determinar fase actual basándose en el status
    let currentPhase = 0;
    if (status?.includes('PERPLEXITY') || status?.includes('INVESTIGANDO')) currentPhase = 1;
    if (status?.includes('GEMINI') || status?.includes('SINTETIZANDO') || status?.includes('ESTRATEGIA')) currentPhase = 2;
    if (status?.includes('COMPLETO')) currentPhase = 3;

    return (
        <div className="max-w-lg mx-auto text-center py-16">
            {/* Spinner principal */}
            <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-sl-cyan/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-sl-magenta/30 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-sl-cyan animate-spin" />
                </div>
            </div>

            {/* Status */}
            <p className="text-sl-cyan font-code text-sm tracking-[0.3em] mb-8 animate-pulse">
                {status || 'PROCESANDO...'}
            </p>

            {/* Fases */}
            <div className="space-y-3 text-left max-w-xs mx-auto">
                {PHASES.map((phase, i) => {
                    const Icon = phase.icon;
                    const isActive = i === currentPhase;
                    const isDone = i < currentPhase;

                    return (
                        <div
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${isActive
                                    ? 'border-sl-cyan/40 bg-sl-cyan/5'
                                    : isDone
                                        ? 'border-green-500/30 bg-green-500/5'
                                        : 'border-white/5 opacity-30'
                                }`}
                        >
                            <Icon
                                className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-sl-cyan animate-pulse' : isDone ? 'text-green-400' : 'text-white/30'
                                    }`}
                            />
                            <div>
                                <p className={`text-xs font-heading font-semibold tracking-wider ${isActive ? 'text-sl-cyan' : isDone ? 'text-green-400' : 'text-white/30'}`}>
                                    {phase.label}
                                </p>
                                <p className="text-[10px] text-white/30 font-code">{phase.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Progress bar */}
            <div className="mt-8 h-1 bg-white/5 rounded-full overflow-hidden max-w-xs mx-auto">
                <div className="h-full bg-gradient-to-r from-sl-cyan to-sl-magenta rounded-full animate-progress-bar" />
            </div>
        </div>
    );
}
