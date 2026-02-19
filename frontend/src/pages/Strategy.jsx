import { useEffect } from 'react';
import { useStrategyStore } from '../stores/strategyStore';
import BriefForm from '../components/strategy/BriefForm';
import ProcessingView from '../components/strategy/ProcessingView';
import StrategyDashboard from '../components/strategy/StrategyDashboard';
import { ArrowLeft, Clock, History, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Strategy() {
    const {
        step,
        runAnalysis,
        processingStatus,
        error,
        history,
        loadHistory,
        loadStrategyFromHistory,
        loadingHistory
    } = useStrategyStore();

    const navigate = useNavigate();

    useEffect(() => {
        loadHistory();
    }, []);

    const handleStartAnalysis = async () => {
        try {
            await runAnalysis();
        } catch (err) {
            console.error('Error en análisis:', err);
        }
    };

    return (
        <div className="min-h-screen bg-sl-bg text-white flex flex-col">
            {/* Top bar */}
            <div className="border-b border-white/5 px-6 py-3 flex items-center justify-between bg-sl-bg/80 backdrop-blur-md sticky top-0 z-50">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-all font-heading"
                >
                    <ArrowLeft className="w-4 h-4" />
                    VOLVER AL DASHBOARD
                </button>
                <span className="text-xs font-code text-sl-cyan/50 tracking-widest">
                    ZENTRIX OS × STATICLAUNCH
                </span>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* History Sidebar */}
                <div className="w-80 border-r border-white/5 bg-sl-card/30 hidden lg:flex flex-col">
                    <div className="p-4 border-b border-white/5 flex items-center gap-2 text-sl-cyan">
                        <History className="w-4 h-4" />
                        <span className="font-heading text-sm font-semibold tracking-wider">HISTORIAL</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {loadingHistory && (
                            <div className="text-center py-4 text-white/20 text-xs animate-pulse">Cargando...</div>
                        )}

                        {!loadingHistory && history.length === 0 && (
                            <div className="text-center py-8 text-white/20 text-xs p-4">
                                No hay análisis previos.
                            </div>
                        )}

                        {history.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => loadStrategyFromHistory(item.id)}
                                className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-all group flex items-start gap-3 border border-transparent hover:border-white/10"
                            >
                                <div className="mt-1 min-w-[16px]">
                                    <Clock className="w-4 h-4 text-white/20 group-hover:text-sl-cyan/50 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-heading text-sm text-white/80 truncate group-hover:text-sl-cyan transition-colors">
                                        {item.brandName || 'Sin nombre'}
                                    </div>
                                    <div className="text-xs text-white/30 mt-1">
                                        {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/10 opacity-0 group-hover:opacity-100 transition-all self-center" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
                    {/* Error message */}
                    {error && (
                        <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    {step === 'brief' && <BriefForm onStartAnalysis={handleStartAnalysis} />}
                    {step === 'processing' && <ProcessingView status={processingStatus} />}
                    {step === 'dashboard' && <StrategyDashboard />}
                </div>
            </div>
        </div>
    );
}
