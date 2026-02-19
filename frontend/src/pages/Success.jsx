import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
    CheckCircle2,
    Link as LinkIcon,
    Copy,
    ExternalLink,
    LayoutDashboard,
    QrCode,
    Loader2
} from 'lucide-react';

export default function Success() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const data = await api.getProject(id);
                setProject(data.project);
            } catch (error) {
                console.error('Error fetching project:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    const handleCopy = () => {
        if (!project) return;
        const url = `${window.location.origin}/creadorlanding/view/${project.id}`; // Assuming this is the public path or similar
        // For demonstration, use the slug if needed or the specific export path
        // In this app, many projects are viewed via the plugin or specific ID
        const finalUrl = window.location.origin.includes('localhost')
            ? `http://localhost:3001/api/export/${project.id}/public` // Direct access to generated HTML during dev
            : `${window.location.origin}/landing/${project.slug}`;

        navigator.clipboard.writeText(finalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-sl-bg flex flex-col items-center justify-center text-sl-cyan">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-heading">Cargando detalles de publicación...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-sl-bg flex flex-col items-center justify-center text-white p-4">
                <h1 className="text-2xl font-bold mb-4">Proyecto no encontrado</h1>
                <Link to="/" className="btn-primary">Volver al Dashboard</Link>
            </div>
        );
    }

    const landingUrl = window.location.origin.includes('localhost')
        ? `http://localhost:3001/api/export/${project.id}/view`
        : `${window.location.origin}/landing/${project.slug}`;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(landingUrl)}&bgcolor=0A0E1A&color=00F0FF`;

    return (
        <div className="min-h-screen bg-sl-bg text-white relative overflow-hidden flex flex-col items-center justify-center p-6">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-sl-magenta blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-sl-cyan blur-[120px] rounded-full animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-2xl w-full relative z-10 text-center space-y-8">
                {/* Header Icon */}
                <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full border-4 border-sl-cyan flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)] animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-12 h-12 text-sl-cyan" />
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold">
                        ¡Tu Landing está <span className="text-sl-magenta">en</span> <span className="text-sl-cyan">vivo</span>!
                    </h1>
                    <p className="text-sl-text-muted text-lg uppercase tracking-[0.2em]">
                        {project.name} ha sido publicada exitosamente
                    </p>
                </div>

                {/* URL Section */}
                <div className="bg-sl-bg/50 border border-sl-border p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
                    <p className="text-sm text-sl-text-muted flex items-center justify-center gap-2">
                        <LinkIcon className="w-4 h-4" /> Tu URL:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 bg-black/40 border border-sl-border rounded-xl px-4 py-3 text-sl-cyan font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                            {landingUrl}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="btn-primary flex items-center justify-center gap-2 py-3 px-6 whitespace-nowrap"
                        >
                            <Copy className="w-4 h-4" />
                            {copied ? '¡Copiado!' : 'COPIAR'}
                        </button>
                    </div>
                </div>

                {/* QR Section */}
                <div className="bg-sl-bg/50 border border-sl-border p-8 rounded-2xl flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-400">
                    <div className="bg-white p-3 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                        <img
                            src={qrUrl}
                            alt="QR Code"
                            className="w-40 h-40"
                        />
                    </div>
                    <p className="text-sl-text-muted text-sm flex items-center gap-2">
                        <QrCode className="w-4 h-4" /> Escanea para ver en tu móvil
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-600">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-sl-bg border border-sl-border rounded-xl font-bold hover:bg-sl-border transition-all"
                    >
                        <LayoutDashboard className="w-5 h-5 text-sl-magenta" />
                        IR AL DASHBOARD
                    </button>
                    <a
                        href={landingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sl-magenta to-sl-cyan text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all"
                    >
                        <ExternalLink className="w-5 h-5" />
                        VER LANDING
                    </a>
                </div>

                {/* Footer status (Visual only as per request) */}
                <div className="pt-8 text-left max-w-sm mx-auto opacity-50 space-y-2 font-mono text-[10px] text-sl-cyan animate-in fade-in duration-1000 delay-1000">
                    <p>[LOG] Proceso de deploy:</p>
                    <p className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-sl-cyan rounded-full"></span> Optimizing images... ✓
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-sl-cyan rounded-full"></span> Minifying CSS... ✓
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-sl-cyan rounded-full"></span> Propagating to edge... ✓
                    </p>
                </div>
            </div>
        </div>
    );
}
