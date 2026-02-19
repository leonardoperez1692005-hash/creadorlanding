import { X, Swords, Sparkles, MessageCircle, Linkedin } from 'lucide-react';

export default function TacticalOverlay({ type, salesAngle, data, onClose }) {
    if (!data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        {type === 'objections' ? (
                            <Swords className="w-5 h-5 text-amber-400" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        )}
                        <div>
                            <h2 className="font-heading font-bold text-white text-sm tracking-wider">
                                {type === 'objections' ? 'SIMULADOR DE RESISTENCIA' : 'GENERADOR DE CONTENIDO'}
                            </h2>
                            <p className="text-xs text-white/40 font-code">Ángulo: "{salesAngle}"</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Objections Mode */}
                    {type === 'objections' && data.objections && (
                        <div className="space-y-4">
                            {data.objections.map((obj, i) => (
                                <div key={i} className="bg-black/30 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <span className="text-[10px] font-code text-red-400/70 block mb-1">OBJECIÓN DEL CLIENTE</span>
                                            <p className="text-sm text-white/80 italic">"{obj.objection}"</p>
                                        </div>
                                    </div>
                                    <div className="ml-10 pl-4 border-l-2 border-sl-cyan/30">
                                        <span className="text-[10px] font-code text-sl-cyan/70 block mb-1">JUDO VERBAL</span>
                                        <p className="text-sm text-sl-cyan/90">{obj.counterArgument}</p>
                                        {obj.technique && (
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-sl-cyan/10 text-sl-cyan text-[10px] font-code rounded">
                                                Técnica: {obj.technique}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Content Mode */}
                    {type === 'content' && (
                        <div className="space-y-4">
                            {/* TikTok */}
                            {data.tiktok && (
                                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageCircle className="w-4 h-4 text-pink-400" />
                                        <h3 className="font-heading font-bold text-pink-400 text-sm tracking-wider">
                                            TIKTOK / REELS
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-[10px] font-code text-white/40">HOOK (3 seg)</span>
                                            <p className="text-sm text-white font-semibold">{data.tiktok.hook}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-code text-white/40">GUIÓN (30 seg)</span>
                                            <p className="text-sm text-white/70 whitespace-pre-line">{data.tiktok.script}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-code text-white/40">CTA</span>
                                            <p className="text-sm text-pink-400 font-semibold">{data.tiktok.cta}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LinkedIn */}
                            {data.linkedin && (
                                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Linkedin className="w-4 h-4 text-blue-400" />
                                        <h3 className="font-heading font-bold text-blue-400 text-sm tracking-wider">
                                            LINKEDIN POST
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-[10px] font-code text-white/40">HOOK</span>
                                            <p className="text-sm text-white font-semibold">{data.linkedin.hook}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-code text-white/40">CUERPO</span>
                                            <p className="text-sm text-white/70 whitespace-pre-line">{data.linkedin.body}</p>
                                        </div>
                                        {Array.isArray(data.linkedin.hashtags) && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {data.linkedin.hashtags.map((h, i) => (
                                                    <span key={i} className="text-xs text-blue-400 font-code">
                                                        #{h}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
