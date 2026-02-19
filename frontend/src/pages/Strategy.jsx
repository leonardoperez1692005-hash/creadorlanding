import { useStrategyStore } from '../stores/strategyStore';
import BriefForm from '../components/strategy/BriefForm';
import ProcessingView from '../components/strategy/ProcessingView';
import StrategyDashboard from '../components/strategy/StrategyDashboard';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Strategy() {
    const { step, runAnalysis, processingStatus, error } = useStrategyStore();
    const navigate = useNavigate();

    const handleStartAnalysis = async () => {
        try {
            await runAnalysis();
        } catch (err) {
            console.error('Error en análisis:', err);
        }
    };

    return (
        <div className="min-h-screen bg-sl-bg text-white">
            {/* Top bar */}
            <div className="border-b border-white/5 px-6 py-3 flex items-center justify-between">
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

            {/* Content */}
            <div className="p-6 md:p-10">
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
    );
}
