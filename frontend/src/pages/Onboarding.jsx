import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getUploadUrl } from '../lib/api';
import { Upload, Palette, Type, ArrowRight, Check } from 'lucide-react';
import Header from '../components/layout/Header';

const FONT_OPTIONS = [
    { label: 'Rajdhani', value: 'Rajdhani' },
    { label: 'Orbitron', value: 'Orbitron' },
    { label: 'Montserrat', value: 'Montserrat' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Roboto', value: 'Roboto' },
];

export default function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [logoPreview, setLogoPreview] = useState(null);
    const DEFAULT_PALETTE = {
        primary: '#B8B5FF',
        secondary: '#FFB6C1',
        accent: '#98D8C8',
        background: '#1A1A2E',
    };
    const [palette, setPalette] = useState(DEFAULT_PALETTE);
    const [headingFont, setHeadingFont] = useState('Rajdhani');
    const [bodyFont, setBodyFont] = useState('Montserrat');
    const [loading, setLoading] = useState(true);

    // Load existing brand on mount (so revisiting doesn't show empty)
    useEffect(() => {
        const loadExisting = async () => {
            try {
                const { brand } = await api.getBrand();
                if (brand) {
                    const tokens = brand.designTokens || {};
                    if (brand.logoPath) setLogoPreview(brand.logoPath);
                    if (tokens.colors && Object.keys(tokens.colors).length > 0) {
                        setPalette(tokens.colors);
                    }
                    if (tokens.typography?.headings?.family) setHeadingFont(tokens.typography.headings.family);
                    if (tokens.typography?.body?.family) setBodyFont(tokens.typography.body.family);
                    // Jump to palette step if we already have data
                    if (brand.logoPath || (tokens.colors && Object.keys(tokens.colors).length > 0)) {
                        setStep(2);
                    }
                }
            } catch (e) {
                // No brand yet, stay on step 1
            } finally {
                setLoading(false);
            }
        };
        loadExisting();
    }, []);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        try {
            const data = await api.uploadLogo(file);
            setLogoPreview(data.logoPath);
            setPalette(data.suggestedPalette);

            // Set suggested fonts if available
            if (data.suggestedTypography) {
                setHeadingFont(data.suggestedTypography.heading);
                setBodyFont(data.suggestedTypography.body);
            }

            setStep(2);
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTokens = async () => {
        setLoading(true);
        try {
            await api.updateBrand({
                colors: palette,
                typography: {
                    headings: { family: headingFont },
                    body: { family: bodyFont },
                },
            });
            navigate('/');
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    {/* Progress */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s ? 'bg-gradient-to-r from-sl-magenta to-sl-cyan text-white' : 'bg-sl-bg-alt text-gray-500 border border-sl-border'
                                }`}>
                                {step > s ? <Check className="w-5 h-5" /> : s}
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        {/* Step 1: Logo Upload */}
                        {step === 1 && (
                            <div className="text-center">
                                <Upload className="w-12 h-12 text-sl-cyan mx-auto mb-4" />
                                <h2 className="text-2xl font-heading font-bold mb-2">Sube tu Logo</h2>
                                <p className="text-sl-text-muted mb-6">Extraeremos los colores automáticamente</p>
                                <label className="block cursor-pointer">
                                    <div className="border-2 border-dashed border-sl-border rounded-xl p-12 hover:border-sl-cyan transition-colors">
                                        <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                        <span className="text-sm text-gray-500">Click para subir (PNG, JPG, SVG)</span>
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                </label>
                                {loading && <p className="text-sl-cyan mt-4">Procesando...</p>}
                                <button onClick={() => setStep(2)} className="mt-4 text-sm text-gray-500 hover:text-sl-cyan">
                                    Saltar →
                                </button>
                            </div>
                        )}

                        {/* Step 2: Color Palette */}
                        {step === 2 && (
                            <div>
                                <Palette className="w-12 h-12 text-sl-magenta mx-auto mb-4" />
                                <h2 className="text-2xl font-heading font-bold text-center mb-6">Tu Paleta</h2>

                                {logoPreview && (
                                    <div className="text-center mb-6">
                                        <img src={getUploadUrl(logoPreview)} alt="Logo" className="min-w-[200px] max-h-32 object-contain mx-auto rounded mb-3" />
                                        <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-sl-cyan hover:text-white transition-colors border border-sl-cyan/40 hover:border-sl-cyan rounded-full px-3 py-1">
                                            <Upload className="w-3 h-3" />
                                            Cambiar logo
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                        </label>
                                    </div>
                                )}
                                {!logoPreview && (
                                    <div className="text-center mb-6">
                                        <label className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-sl-cyan hover:text-white transition-colors border border-sl-cyan/40 hover:border-sl-cyan rounded-full px-4 py-2">
                                            <Upload className="w-4 h-4" />
                                            Subir logo
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                        </label>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {palette && Object.entries(palette).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-3">
                                            <input type="color" value={value}
                                                onChange={(e) => setPalette({ ...palette, [key]: e.target.value })}
                                                className="w-10 h-10 rounded border-0 cursor-pointer" />
                                            <div>
                                                <div className="text-xs text-sl-cyan uppercase">{key}</div>
                                                <div className="text-sm text-sl-text-muted">{value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => setStep(3)} className="btn-primary w-full flex items-center justify-center gap-2">
                                    Siguiente <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Step 3: Typography */}
                        {step === 3 && (
                            <div>
                                <Type className="w-12 h-12 text-sl-accent mx-auto mb-4" />
                                <h2 className="text-2xl font-heading font-bold text-center mb-6">Tipografías</h2>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="label">Fuente Títulos</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {FONT_OPTIONS.map((f) => (
                                                <button key={f.value} onClick={() => setHeadingFont(f.value)}
                                                    className={`p-3 rounded-lg border text-sm transition-all ${headingFont === f.value
                                                        ? 'border-sl-cyan bg-sl-cyan/10 text-sl-cyan'
                                                        : 'border-sl-border text-sl-text-muted hover:border-gray-500'
                                                        }`}
                                                    style={{ fontFamily: f.value }}>
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Fuente Cuerpo</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {FONT_OPTIONS.map((f) => (
                                                <button key={f.value} onClick={() => setBodyFont(f.value)}
                                                    className={`p-3 rounded-lg border text-sm transition-all ${bodyFont === f.value
                                                        ? 'border-sl-magenta bg-sl-magenta/10 text-sl-magenta'
                                                        : 'border-sl-border text-sl-text-muted hover:border-gray-500'
                                                        }`}
                                                    style={{ fontFamily: f.value }}>
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleSaveTokens} disabled={loading} className="btn-primary w-full">
                                    {loading ? 'Guardando...' : '🚀 Finalizar Setup'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
