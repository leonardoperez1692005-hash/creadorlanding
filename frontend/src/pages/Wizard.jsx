import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, ArrowRight, Check, Video, FileText, BookOpen, Save, Eye, Palette, Layout, Rocket, LogOut } from 'lucide-react';
import AIAssistant from '../components/AIAssistant';
import WizardPreview from '../components/WizardPreview';
import { api } from '../lib/api';
import Header from '../components/layout/Header';

const STRUCTURE_TYPES = [
    {
        id: 'vsl',
        label: 'Video Sales Letter',
        description: 'Página centrada en video de alta conversión',
        icon: Video,
        sections: [
            { id: 'hero', label: 'Sección Hero' },
            { id: 'benefits', label: 'Beneficios' },
            { id: 'urgency', label: 'Urgencia' },
            { id: 'countdown', label: 'Contador' },
            { id: 'offer', label: 'Oferta' },
            { id: 'lead_capture', label: 'Captura de Leads' },
            { id: 'faq', label: 'Preguntas Frecuentes' }
        ]
    },
    {
        id: 'webinar',
        label: 'Registro a Webinar',
        description: 'Ideal para eventos en vivo o masterclasses',
        icon: FileText,
        sections: [
            { id: 'hero', label: 'Sección Hero' },
            { id: 'speaker', label: 'Presentador' },
            { id: 'learning', label: 'Lo que aprenderás' },
            { id: 'target', label: '¿Para quién es?' },
            { id: 'urgency', label: 'Urgencia' },
            { id: 'countdown', label: 'Contador' },
            { id: 'offer', label: 'Oferta' },
            { id: 'lead_capture', label: 'Captura de Leads' },
            { id: 'faq', label: 'Preguntas Frecuentes' }
        ]
    },
    {
        id: 'long_letter',
        label: 'Carta de Ventas',
        description: 'Persuasión escrita detallada y estructurada',
        icon: BookOpen,
        sections: [
            { id: 'hero', label: 'Sección Hero' },
            { id: 'story', label: 'Historia' },
            { id: 'solution', label: 'Solución' },
            { id: 'benefits', label: 'Beneficios' },
            { id: 'testimonials', label: 'Testimonios' },
            { id: 'urgency', label: 'Urgencia' },
            { id: 'offer', label: 'Oferta' },
            { id: 'lead_capture', label: 'Contacto / Consultas' },
            { id: 'faq', label: 'Preguntas Frecuentes' }
        ]
    }
];

const WIZARD_STEPS = {
    vsl: ['type', 'hero', 'benefits', 'urgency', 'countdown', 'offer', 'lead_capture', 'faq', 'tracking', 'review'],
    webinar: ['type', 'hero', 'speaker', 'learning', 'target', 'urgency', 'countdown', 'offer', 'lead_capture', 'faq', 'tracking', 'review'],
    long_letter: ['type', 'hero', 'story', 'solution', 'benefits', 'testimonials', 'urgency', 'offer', 'lead_capture', 'faq', 'tracking', 'review']
};

export default function Wizard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const strategyData = location.state?.strategyData;
    const aiContent = location.state?.aiContent;
    const aiGenerated = location.state?.aiGenerated;

    // State
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(!!id);
    const [structureType, setStructureType] = useState('vsl');
    const [projectName, setProjectName] = useState('');
    const [visualModel, setVisualModel] = useState('dark');
    const [sections, setSections] = useState([]);
    const [customColors, setCustomColors] = useState({});
    const [meta, setMeta] = useState({});

    // Load brand defaults on mount so colors are always pre-populated
    useEffect(() => {
        api.getBrand().then(({ brand }) => {
            if (!brand) return;
            const tokens = brand.designTokens || {};
            if (tokens.colors && Object.keys(tokens.colors).length > 0) {
                // Only apply if Wizard hasn't already loaded project-specific colors
                setCustomColors(prev => Object.keys(prev).length === 0 ? tokens.colors : prev);
            }
        }).catch(() => { }); // Silently ignore if no brand yet
    }, []);

    // Auto-set template type when coming from strategy dashboard
    useEffect(() => {
        if (location.state?.templateType) {
            setStructureType(location.state.templateType);
        }
        if (location.state?.fromStrategy && strategyData?.brandName) {
            setProjectName(`Landing - ${strategyData.brandName}`);
        }
    }, [location.state?.templateType, location.state?.fromStrategy, strategyData?.brandName]);

    // Apply Strategy Data if available (from navigation)
    // TIMING FIX: sections.length as dependency ensures we run AFTER sections are initialized
    useEffect(() => {
        if (sections.length === 0) return;

        // PATH 1: AI-generated content (from strategy dashboard with content generation)
        if (aiContent && aiGenerated) {
            console.log('[Wizard] Aplicando contenido generado por IA a', sections.length, 'secciones');
            setSections(prev => prev.map(s => {
                const aiSectionContent = aiContent[s.id];
                if (aiSectionContent) {
                    return { ...s, content: { ...s.content, ...aiSectionContent } };
                }
                return s;
            }));
            return; // AI content is authoritative, don't fall through to heuristic
        }

        // PATH 2: Fallback heuristic (for backward compatibility - strategy without AI gen)
        if (!strategyData || !strategyData.salesAngles) return;

        console.log('[Wizard] Fallback: aplicando heuristica de estrategia a', sections.length, 'secciones');

        const angles = strategyData.salesAngles || [];
        const blueprint = strategyData.landingBlueprint;
        const primaryAngle = angles[0];
        const blueprintSections = blueprint?.sections || [];

        const findContent = (keywords) => {
            const kw = keywords.map(k => k.toLowerCase());
            const sec = blueprintSections.find(s => {
                const text = `${s.name} ${s.purpose || ''} ${s.suggestedContent || ''}`.toLowerCase();
                return kw.some(k => text.includes(k));
            });
            return sec?.suggestedContent || '';
        };

        setSections(prev => prev.map(s => {
            switch (s.id) {
                case 'hero': {
                    const headline = primaryAngle?.adVariants?.[0]?.headline || primaryAngle?.hook || '';
                    const subheadline = primaryAngle?.description || findContent(['problema', 'dolor', 'presentaci']);
                    return { ...s, content: { ...s.content, headline, subheadline } };
                }
                case 'benefits': {
                    const benefitContent = findContent(['beneficio', 'caracter', 'soluci', 'ventaja', 'feature']);
                    const items = benefitContent
                        ? [{ title: 'Beneficio Principal', description: benefitContent }]
                        : angles.slice(0, 3).map(a => ({ title: a.name, description: a.description || a.hook }));
                    return { ...s, content: { ...s.content, items } };
                }
                case 'story': {
                    const storyContent = findContent(['historia', 'problema', 'contexto', 'dolor']);
                    return { ...s, content: { ...s.content, text: storyContent } };
                }
                case 'solution': {
                    const solutionContent = findContent(['soluci', 'respuesta', 'producto', 'servicio']);
                    return { ...s, content: { ...s.content, title: strategyData.brandName, text: solutionContent } };
                }
                case 'urgency': {
                    const urgencyContent = findContent(['urgencia', 'llamado', 'acci', 'limitado', 'cta']);
                    return { ...s, content: { ...s.content, text: urgencyContent || `${primaryAngle?.hook || 'OFERTA POR TIEMPO LIMITADO'}` } };
                }
                case 'offer': {
                    const offerContent = findContent(['oferta', 'precio', 'plan', 'inversi']);
                    return { ...s, content: { ...s.content, title: offerContent || `Oferta Especial ${strategyData.brandName || ''}` } };
                }
                case 'lead_capture': {
                    const ctaContent = findContent(['registro', 'captura', 'lead', 'formulario']);
                    return { ...s, content: { ...s.content, headline: ctaContent || `Unete a ${strategyData.brandName || 'nosotros'}` } };
                }
                case 'testimonials': {
                    const socialContent = findContent(['social', 'prueba', 'testimonio', 'cliente']);
                    return { ...s, content: { ...s.content, items: socialContent ? [{ text: socialContent, author: 'Cliente' }] : [] } };
                }
                default:
                    return s;
            }
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aiContent, aiGenerated, strategyData, sections.length]);


    // UI State
    const [showMobilePreview, setShowMobilePreview] = useState(false);
    const [showPersonalization, setShowPersonalization] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Initial Load (New Project)
    useEffect(() => {
        if (!id) {
            const structure = STRUCTURE_TYPES.find(t => t.id === structureType);
            if (structure) {
                // Initialize sections based on structure type if empty or switching type
                // Careful not to overwrite if user just switched back and forth without saving? 
                // For now, simple initialization logic:
                const initialSections = structure.sections.map((s, i) => ({
                    id: s.id,
                    type: s.id,
                    content: {},
                    isVisible: true,
                    order: i
                }));
                // Only set if sections are empty or if strictly new project logic needed
                // But for "type" step, we usually reset.
                setSections(initialSections);
            }
        }
    }, [structureType, id]);

    // Fetch Project (Edit Mode)
    useEffect(() => {
        if (id) {
            const fetchProject = async () => {
                try {
                    const data = await api.getProject(id);
                    // Unwrap project data
                    const project = data.project || data;
                    setProjectName(project.name);
                    setProjectName(project.name);
                    setStructureType(project.structureType || project.type || 'vsl');
                    setVisualModel(project.visualModel || project.theme || 'dark');

                    // Parse contentData
                    let content = {};
                    try {
                        content = typeof project.contentData === 'string'
                            ? JSON.parse(project.contentData)
                            : project.contentData || {};
                    } catch (e) {
                        console.error("Error parsing contentData", e);
                        content = {};
                    }

                    // Legacy normalization for old structureType names if any?
                    // Assuming 'vsl', 'webinar', 'long_letter' are consistent identifiers.

                    // Normalize sections for backward compatibility
                    let normalizedSections = content.sections || project.sections || []; // Fallback to project.sections just in case
                    normalizedSections = normalizedSections.map(s => {
                        let newId = s.id;
                        // Map legacy IDs to new generic IDs
                        if (s.id === 'hero_webinar' || s.id === 'hero_letter' || s.id === 'hero_vsl') newId = 'hero';
                        if (s.id === 'learning_points') newId = 'learning';
                        if (s.id === 'target_audience') newId = 'target';
                        if (s.id === 'benefits_letter' || s.id === 'benefits_vsl') newId = 'benefits';
                        if (s.id === 'offer_letter' || s.id === 'offer_vsl') newId = 'offer';

                        return {
                            ...s,
                            id: newId,
                            isVisible: s.isVisible !== undefined ? s.isVisible : true,
                            order: s.order !== undefined ? s.order : 0
                        };
                    });

                    // Re-initialize sections if empty or broken
                    // MERGE STRATEGY: Ensure all required sections for the structure type exist
                    // Use 'vsl' as fallback if type is unknown or missing
                    const structure = STRUCTURE_TYPES.find(t => t.id === (project.structureType || project.type)) || STRUCTURE_TYPES[0];
                    let finalSections = normalizedSections;

                    if (structure) {
                        // Create a map of existing sections for quick lookup
                        const existingMap = new Map(normalizedSections.map(s => [s.id, s]));

                        // Map over default structure to ensure all exist
                        finalSections = structure.sections.map((def, index) => {
                            const existing = existingMap.get(def.id);
                            if (existing) {
                                // Keep existing data but ensure ID match
                                return existing;
                            }
                            // Create missing section
                            return {
                                id: def.id,
                                type: def.id,
                                content: {},
                                isVisible: true,
                                order: index
                            };
                        });
                    }

                    if (finalSections.length === 0 && normalizedSections.length > 0) {
                        // Fallback if structure not found but we have data (shouldn't happen with valid types)
                        finalSections = normalizedSections;
                    }

                    setSections(finalSections);
                    // Project-specific colors take priority over brand defaults
                    const projectColors = content.colors || project.colors || null;
                    if (projectColors && Object.keys(projectColors).length > 0) {
                        setCustomColors(projectColors);
                    }
                    setMeta(content.meta || project.meta || {});
                    setStep(1); // Go directly to editor, skip blueprint step
                } catch (error) {
                    console.error('Error fetching project:', error);
                    alert('Error al cargar proyecto');
                    navigate('/');
                } finally {
                    setLoading(false);
                }
            };
            fetchProject();
        }
    }, [id, navigate]);

    // Live Preview
    const fetchPreview = useCallback(async () => {
        if (!sections.length) return;
        setIsPreviewLoading(true);
        try {
            const response = await api.getPreview({
                structureType: structureType,
                visualModel: visualModel,
                brand: {
                    colors: customColors,
                    typography: {}, // Add empty typography to match expected structure
                },
                sections: sections.filter(s => s.isVisible).sort((a, b) => a.order - b.order),
                meta
            });
            if (response && response.html) {
                setPreviewHtml(response.html);
            } else if (typeof response === 'string') {
                setPreviewHtml(response);
            }
        } catch (error) {
            console.error('Preview error:', error);
        } finally {
            setIsPreviewLoading(false);
        }
    }, [structureType, visualModel, customColors, sections, meta]);

    // Debounce preview update
    useEffect(() => {
        const timeout = setTimeout(fetchPreview, 1000);
        return () => clearTimeout(timeout);
    }, [fetchPreview]);

    // Helpers
    const getSection = (id) => {
        return sections.find(s => s.id === id) || { id, content: {} };
    };

    const updateSection = (id, content) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, content } : s));
    };

    const toggleSectionVisibility = (id) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
    };

    const moveSection = (fromIndex, toIndex) => {
        // Simple reorder implementation
        // This might need drag and drop lib logic, but for now assuming direct call
        const newSections = [...sections];
        const [moved] = newSections.splice(fromIndex, 1);
        newSections.splice(toIndex, 0, moved);
        // Correct order property
        const reordered = newSections.map((s, i) => ({ ...s, order: i }));
        setSections(reordered);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                name: projectName || 'Nuevo Proyecto',
                structureType: structureType,
                visualModel: visualModel,
                contentData: JSON.stringify({
                    sections,
                    colors: customColors,
                    meta
                })
            };

            if (id) {
                await api.updateProject(id, payload);
                navigate(`/deploy-success/${id}`);
            } else {
                const newProject = await api.createProject(payload);
                navigate(`/deploy-success/${newProject.project.id}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Error al guardar proyecto');
        } finally {
            setLoading(false);
        }
    };

    // Calculate Current Step
    const currentSteps = WIZARD_STEPS[structureType] || WIZARD_STEPS.vsl;
    // Filter out 'type' if editing (id exists)
    const steps = id ? currentSteps.filter(s => s !== 'type') : currentSteps;

    const currentStep = steps[step];

    if (loading) return <div className="min-h-screen flex items-center justify-center text-sl-cyan">Cargando...</div>;

    return (
        <div className="min-h-screen flex flex-col overflow-hidden bg-sl-bg">
            {currentStep === 'type' ? (
                /* --- TYPE SELECTION STEP (Blueprint) --- */
                <>
                    <Header />
                    <main className="flex-1 overflow-y-auto px-4 py-8">
                        <StepType
                            structureType={structureType}
                            setStructureType={setStructureType}
                            projectName={projectName}
                            setProjectName={setProjectName}
                            visualModel={visualModel}
                            setVisualModel={setVisualModel}
                            onSave={() => {
                                if (!projectName || !projectName.trim()) {
                                    alert('Por favor, ingresa un nombre para el proyecto.');
                                    return;
                                }
                                setStep(1);
                            }}
                        // handleSave would create project.
                        // If we want workflow: Type -> (Create Project?) -> Editor.
                        // Or Type -> Editor -> Save.
                        // The provided screenshot showed "Comenzar Proyecto >" button.
                        // Let's assume it advances step.
                        // But if we want to save initially?
                        // Let's stick to setStep(1) for smoother flow, or handleSave if creation is needed.
                        // Given "handleSave" was passed in previous code, I'll pass handleSave for now, but 
                        // check if 'handleSave' creates project and redirects.
                        // If it creates project, it redirects to /wizard/:id.
                        // Then step resets to 0? No, step state is local.
                        // I'll use setStep(1) to proceed to editor. 
                        // Actually, let's keep it simple: next step.
                        />
                    </main>
                </>
            ) : (
                /* --- WIZARD EDITOR STEPS --- */
                <>
                    <AIAssistant context={{
                        step: currentStep,
                        structureType,
                        strategyData: strategyData?.fullStrategy || null,
                        currentSection: getSection(currentStep),
                    }} />
                    <Header
                        projectName={projectName}
                        setProjectName={setProjectName}
                        showPersonalization={showPersonalization}
                        setShowPersonalization={setShowPersonalization}
                        showMobilePreview={showMobilePreview}
                        setShowMobilePreview={setShowMobilePreview}
                        handleSave={handleSave}
                        loading={loading}
                    />

                    <div className="flex-1 flex overflow-hidden">
                        {/* --- EDITOR COLUMN --- */}
                        <div className={`flex-1 flex flex-col h-full overflow-y-auto transition-all duration-300 ${showMobilePreview ? 'hidden lg:flex' : 'flex'}`}>

                            {/* Progress Bar */}
                            <div className="px-4 py-3 border-b border-sl-border overflow-x-auto bg-sl-bg/80 backdrop-blur sticky top-0 z-10">
                                <div className="flex gap-1 min-w-max">
                                    {steps.map((s, i) => {
                                        if (s === 'type') return null;
                                        return (
                                            <button key={s} onClick={() => setStep(i)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${i === step ? 'bg-sl-cyan/10 border-sl-cyan text-sl-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]' : i < step ? 'bg-sl-cyan/5 border-sl-cyan/30 text-sl-cyan/70' : 'bg-sl-bg-alt border-transparent text-gray-500 hover:text-gray-300'
                                                    }`}>
                                                {i < step && <Check className="w-3 h-3 inline mr-1" />}
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Form Content */}
                            <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 pb-24">
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {currentStep === 'hero' && (
                                        <StepGeneric title="Hero Section" section={getSection('hero')} onUpdate={(c) => updateSection('hero', c)}
                                            fields={[
                                                { key: 'headline', label: 'Título Principal', type: 'text' },
                                                { key: 'subheadline', label: 'Subtítulo', type: 'text' },
                                                ...(structureType === 'vsl' ? [{ key: 'video_url', label: 'URL del Video (YouTube)', type: 'text' }] : []),
                                                ...(structureType === 'webinar' ? [{ key: 'date', label: 'Fecha del Evento', type: 'text' }, { key: 'cta_text', label: 'Texto del Botón', type: 'text' }] : []),
                                                ...(structureType === 'long_letter' ? [{ key: 'eyebrow', label: 'Eyebrow (texto superior)', type: 'text' }, { key: 'lead', label: 'Lead (párrafo gancho)', type: 'textarea' }] : []),
                                            ]} />
                                    )}

                                    {currentStep === 'benefits' && (
                                        <StepList title="Beneficios" section={getSection('benefits')} onUpdate={(c) => updateSection('benefits', c)}
                                            itemFields={['title', 'description']} />
                                    )}
                                    {currentStep === 'urgency' && (
                                        <StepGeneric title="Banner de Urgencia" section={getSection('urgency')} onUpdate={(c) => updateSection('urgency', c)}
                                            fields={[{ key: 'text', label: 'Texto de urgencia', type: 'text', placeholder: '⚡ OFERTA POR TIEMPO LIMITADO ⚡' }]} />
                                    )}
                                    {currentStep === 'countdown' && (
                                        <StepGeneric title="Contador Regresivo" section={getSection('countdown')} onUpdate={(c) => updateSection('countdown', c)}
                                            fields={[
                                                { key: 'headline', label: 'Texto sobre el contador', type: 'text', placeholder: 'La oferta expira en:' },
                                                { key: 'end_date', label: 'Fecha de Fin', type: 'datetime-local' },
                                                { key: 'cta_text', label: 'Texto del Botón', type: 'text' },
                                                { key: 'cta_url', label: 'URL del Botón', type: 'text' },
                                            ]} />
                                    )}
                                    {currentStep === 'offer' && (
                                        <StepGeneric title="Oferta / Pricing" section={getSection('offer')} onUpdate={(c) => updateSection('offer', c)}
                                            fields={[
                                                { key: 'title', label: 'Título', type: 'text' },
                                                { key: 'price_current', label: 'Precio', type: 'text' },
                                                { key: 'cta_text', label: 'Texto del Botón', type: 'text' },
                                                { key: 'cta_url', label: 'URL del Botón', type: 'text' },
                                            ]} />
                                    )}
                                    {currentStep === 'lead_capture' && (
                                        <StepGeneric title={structureType === 'long_letter' ? 'Contacto / Consultas' : 'Captura de Leads'}
                                            section={getSection('lead_capture')} onUpdate={(c) => updateSection('lead_capture', c)}
                                            fields={[
                                                { key: 'headline', label: 'Título del Formulario', type: 'text', placeholder: 'Únete a la lista de espera' },
                                                { key: 'subheadline', label: 'Subtítulo', type: 'text', placeholder: 'Recibe noticias exclusivas' },
                                                ...(structureType === 'long_letter' ? [{ key: 'message_placeholder', label: 'Placeholder Campo Mensaje', type: 'text', placeholder: 'Escribe tu consulta aquí...' }] : []),
                                                { key: 'cta_text', label: 'Texto del Botón', type: 'text', placeholder: structureType === 'long_letter' ? 'ENVIAR CONSULTA' : 'REGISTRARME AHORA' },
                                                { key: 'success_message', label: 'Mensaje de Éxito', type: 'text', placeholder: '¡Gracias por contactarnos!' },
                                            ]} />
                                    )}
                                    {currentStep === 'faq' && (
                                        <StepList title="Preguntas Frecuentes" section={getSection('faq')} onUpdate={(c) => updateSection('faq', c)}
                                            itemFields={['question', 'answer']} />
                                    )}
                                    {currentStep === 'speaker' && (
                                        <StepGeneric title="Speaker / Presentador" section={getSection('speaker')} onUpdate={(c) => updateSection('speaker', c)}
                                            fields={[
                                                { key: 'name', label: 'Nombre', type: 'text' },
                                                { key: 'bio', label: 'Biografía', type: 'textarea' },
                                                { key: 'photo', label: 'URL Foto', type: 'text' },
                                            ]} />
                                    )}
                                    {currentStep === 'learning' && (
                                        <StepSimpleList title="Lo que aprenderás" section={getSection('learning_points')} onUpdate={(c) => updateSection('learning_points', c)} />
                                    )}
                                    {currentStep === 'target' && (
                                        <StepList title="¿Para quién es?" section={getSection('target_audience')} onUpdate={(c) => updateSection('target_audience', c)}
                                            itemFields={['title', 'description']} />
                                    )}
                                    {currentStep === 'story' && (
                                        <StepGeneric title="Tu Historia" section={getSection('story')} onUpdate={(c) => updateSection('story', c)}
                                            fields={[{ key: 'text', label: 'Contenido (acepta HTML)', type: 'textarea' }]} />
                                    )}
                                    {currentStep === 'solution' && (
                                        <StepGeneric title="La Solución" section={getSection('solution')} onUpdate={(c) => updateSection('solution', c)}
                                            fields={[
                                                { key: 'title', label: 'Título', type: 'text' },
                                                { key: 'text', label: 'Contenido (acepta HTML)', type: 'textarea' },
                                            ]} />
                                    )}
                                    {currentStep === 'testimonials' && (
                                        <StepList title="Testimonios" section={getSection('testimonials')} onUpdate={(c) => updateSection('testimonials', c)}
                                            itemFields={['text', 'author']} />
                                    )}
                                    {currentStep === 'tracking' && (
                                        <div>
                                            <h2 className="text-2xl font-heading font-bold mb-6 bg-gradient-to-r from-sl-magenta to-sl-cyan bg-clip-text text-transparent">
                                                Tracking & Analytics
                                            </h2>
                                            <div className="space-y-4">
                                                {['facebook_pixel_id', 'google_analytics_id', 'google_ads_id'].map((key) => (
                                                    <div key={key}>
                                                        <label className="label">{key.replace(/_/g, ' ')}</label>
                                                        <input value={meta[key] || ''} onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
                                                            placeholder={`Tu ${key.replace(/_/g, ' ')}`} className="input-field" />
                                                    </div>
                                                ))}
                                                <div>
                                                    <label className="label">SEO Title</label>
                                                    <input value={meta.seo_title || ''} onChange={(e) => setMeta({ ...meta, seo_title: e.target.value })}
                                                        className="input-field" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {currentStep === 'review' && (
                                        <div className="text-center py-10">
                                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50 shadow-[0_0_20px_rgba(74,222,128,0.2)]">
                                                <Check className="w-10 h-10 text-green-400" />
                                            </div>
                                            <h2 className="text-3xl font-heading font-bold mb-2 text-white">¡Todo Listo!</h2>
                                            <p className="text-sl-text-muted mb-8 text-lg">Tu landing page está configurada y lista para despegar.</p>
                                            <div className="flex gap-4 justify-center">
                                                <button onClick={handleSave} className="btn-primary text-lg px-8 py-3 shadow-neon-magenta hover:scale-105 transition-transform">
                                                    Guardar y Salir
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </main>

                            {/* Floating Navigation */}
                            <footer className="absolute bottom-0 left-0 right-0 lg:right-1/2 border-t border-sl-border px-6 py-4 flex justify-between bg-sl-bg/95 backdrop-blur z-20">
                                <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                                    className="flex items-center gap-2 text-gray-400 hover:text-sl-cyan disabled:opacity-30 transition-colors">
                                    <ArrowLeft className="w-5 h-5" /> Anterior
                                </button>
                                <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1}
                                    className="flex items-center gap-2 text-sl-cyan hover:text-white disabled:opacity-30 font-bold transition-all hover:translate-x-1">
                                    Siguiente <ArrowRight className="w-5 h-5" />
                                </button>
                            </footer>
                        </div>

                        {/* --- PREVIEW COLUMN --- */}
                        <div className={`flex-1 bg-black border-l border-sl-border relative ${showMobilePreview ? 'block fixed inset-0 z-50 lg:static lg:block' : 'hidden lg:block'}`}>
                            {showMobilePreview && (
                                <button
                                    onClick={() => setShowMobilePreview(false)}
                                    className="absolute top-4 right-4 z-50 bg-sl-bg border border-sl-border p-2 rounded-full lg:hidden"
                                >
                                    <ArrowLeft className="w-6 h-6 text-white" />
                                </button>
                            )}
                            <WizardPreview html={previewHtml} isLoading={isPreviewLoading} />
                        </div>
                    </div>

                    {showPersonalization && (
                        <PersonalizationSidebar
                            visualModel={visualModel}
                            setVisualModel={setVisualModel}
                            customColors={customColors}
                            setCustomColors={setCustomColors}
                            sections={sections}
                            toggleVisibility={toggleSectionVisibility}
                            moveSection={moveSection}
                            onClose={() => setShowPersonalization(false)}
                            structureType={structureType}
                            projectName={projectName}
                        />
                    )}
                </>
            )}
        </div>
    );
}

const PRESET_COLORS = ['#FF007F', '#00F0FF', '#7000FF', '#000000', '#FFFFFF', '#1A1A1A', '#F5F5F5', '#FF4D4D', '#4DFF4D', '#4D4DFF'];

// --- Sub-Components ---

function StepType({ structureType, setStructureType, projectName, setProjectName, visualModel, setVisualModel, onSave }) {
    const [expanded, setExpanded] = useState(null);

    return (
        <div className="max-w-5xl mx-auto pt-10">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-heading font-bold mb-4 bg-gradient-to-r from-sl-cyan to-white bg-clip-text text-transparent">
                    Elige tu Estrategia
                </h2>
                <p className="text-sl-text-muted text-lg">
                    Selecciona la estructura (Blueprint) y el estilo visual para tu landing page.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Project Name */}
                <div>
                    <label className="text-xs font-bold text-sl-magenta uppercase tracking-wider mb-2 block">
                        NOMBRE DEL PROYECTO
                    </label>
                    <input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Ej: Lanzamiento Enero 2026"
                        className="w-full bg-sl-bg-alt/50 border border-sl-border rounded-lg px-4 py-3 text-white focus:border-sl-cyan focus:ring-1 focus:ring-sl-cyan outline-none transition-all placeholder:text-gray-600"
                    />
                </div>

                {/* Visual Model */}
                <div>
                    <label className="text-xs font-bold text-sl-magenta uppercase tracking-wider mb-2 block">
                        MODELO VISUAL
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setVisualModel('dark')}
                            className={`px-4 py-3 rounded-lg border transition-all text-center ${visualModel === 'dark'
                                ? 'bg-sl-cyan/10 border-sl-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                                : 'bg-sl-bg-alt/30 border-sl-border hover:border-gray-500'
                                }`}
                        >
                            <span className={`block font-bold ${visualModel === 'dark' ? 'text-sl-cyan' : 'text-gray-400'}`}>Cyber Dark</span>
                            <span className="text-[10px] uppercase text-sl-text-muted">Futurista y Premium</span>
                        </button>
                        <button
                            onClick={() => setVisualModel('light')}
                            className={`px-4 py-3 rounded-lg border transition-all text-center ${visualModel === 'light'
                                ? 'bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                : 'bg-sl-bg-alt/30 border-sl-border hover:border-gray-500'
                                }`}
                        >
                            <span className={`block font-bold ${visualModel === 'light' ? 'text-white' : 'text-gray-400'}`}>Clean Light</span>
                            <span className="text-[10px] uppercase text-sl-text-muted">Elegante y Claro</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {STRUCTURE_TYPES.map((type) => (
                    <div
                        key={type.id}
                        onClick={() => setStructureType(type.id)}
                        className={`relative group cursor-pointer border rounded-xl p-6 transition-all duration-300 ${structureType === type.id
                            ? 'bg-sl-bg-alt border-sl-magenta shadow-[0_0_30px_rgba(255,0,128,0.3)] scale-105'
                            : 'bg-sl-bg-alt/40 border-sl-border hover:border-gray-500 hover:bg-sl-bg-alt/60'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${structureType === type.id ? 'bg-sl-magenta text-white' : 'bg-sl-bg border border-sl-border text-gray-400 group-hover:text-white'
                            }`}>
                            <type.icon className="w-6 h-6" />
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${structureType === type.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                            {type.label}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4">
                            {type.description}
                        </p>
                        <ul className="space-y-2">
                            {(expanded === type.id ? type.sections : type.sections.slice(0, 4)).map(s => (
                                <li key={s.id} className="text-xs text-gray-500 flex items-center gap-2">
                                    <div className={`w-1 h-1 rounded-full ${structureType === type.id ? 'bg-sl-cyan' : 'bg-gray-600'}`}></div>
                                    {s.label}
                                </li>
                            ))}
                            {type.sections.length > 4 && (
                                <li
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpanded(expanded === type.id ? null : type.id);
                                    }}
                                    className="text-xs text-sl-cyan pl-3 cursor-pointer hover:underline"
                                >
                                    {expanded === type.id ? 'Ver menos' : `+ ${type.sections.length - 4} más...`}
                                </li>
                            )}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex justify-center pb-20">
                <button
                    onClick={onSave}
                    disabled={!projectName || !projectName.trim()}
                    className={`bg-gradient-to-r from-sl-magenta to-sl-cyan text-white font-bold text-lg py-4 px-12 rounded-lg shadow-[0_0_30px_rgba(255,0,128,0.4)] transition-all uppercase tracking-widest ${!projectName || !projectName.trim() ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-[0_0_50px_rgba(0,240,255,0.6)] hover:scale-105'}`}
                >
                    Comenzar Proyecto {'>'}
                </button>
            </div>
        </div>
    );
}

function StepGeneric({ title, section, onUpdate, fields }) {
    const content = section.content || {};
    const update = (key, value) => onUpdate({ ...content, [key]: value });

    return (
        <div>
            <h2 className="text-2xl font-heading font-bold mb-6 bg-gradient-to-r from-sl-magenta to-sl-cyan bg-clip-text text-transparent">
                {title}
            </h2>
            <div className="space-y-4">
                {fields.map((f) => (
                    <div key={f.key}>
                        <label className="label">{f.label}</label>
                        {f.type === 'textarea' ? (
                            <textarea value={content[f.key] || ''} onChange={(e) => update(f.key, e.target.value)}
                                placeholder={f.placeholder || ''} rows={5} className="input-field resize-y" />
                        ) : (
                            <input value={content[f.key] || ''} onChange={(e) => update(f.key, e.target.value)}
                                placeholder={f.placeholder || ''} type={f.type === 'datetime-local' ? 'datetime-local' : 'text'} className="input-field" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function StepList({ title, section, onUpdate, itemFields }) {
    const content = section.content || {};
    const items = content.items || [];

    const addItem = () => {
        const newItem = {};
        itemFields.forEach((f) => (newItem[f] = ''));
        onUpdate({ ...content, items: [...items, newItem] });
    };

    const updateItem = (index, field, value) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate({ ...content, items: updated });
    };

    const removeItem = (index) => {
        onUpdate({ ...content, items: items.filter((_, i) => i !== index) });
    };

    return (
        <div>
            <h2 className="text-2xl font-heading font-bold mb-6 bg-gradient-to-r from-sl-magenta to-sl-cyan bg-clip-text text-transparent">
                {title}
            </h2>
            <div className="space-y-4">
                {items.map((item, i) => (
                    <div key={i} className="card relative group">
                        <button onClick={() => removeItem(i)}
                            className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                            ✕
                        </button>
                        {itemFields.map((field) => (
                            <div key={field} className="mb-2">
                                <label className="text-xs text-sl-cyan uppercase">{field}</label>
                                <input value={item[field] || ''} onChange={(e) => updateItem(i, field, e.target.value)}
                                    className="input-field mt-1" />
                            </div>
                        ))}
                    </div>
                ))}
                <button onClick={addItem} className="btn-secondary w-full">+ Agregar</button>
            </div>
        </div>
    );
}

function StepSimpleList({ title, section, onUpdate }) {
    const content = section.content || {};
    const items = content.items || [];

    const addItem = () => onUpdate({ ...content, items: [...items, ''] });
    const updateItem = (i, v) => {
        const updated = [...items];
        updated[i] = v;
        onUpdate({ ...content, items: updated });
    };
    const removeItem = (i) => onUpdate({ ...content, items: items.filter((_, idx) => idx !== i) });

    return (
        <div>
            <h2 className="text-2xl font-heading font-bold mb-6 bg-gradient-to-r from-sl-magenta to-sl-cyan bg-clip-text text-transparent">
                {title}
            </h2>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                        <input value={item} onChange={(e) => updateItem(i, e.target.value)} className="input-field flex-1" />
                        <button onClick={() => removeItem(i)} className="text-red-400 px-2">✕</button>
                    </div>
                ))}
                <button onClick={addItem} className="btn-secondary w-full">+ Agregar</button>
            </div>
        </div>
    );
}

function PersonalizationSidebar({
    visualModel,
    setVisualModel,
    customColors,
    setCustomColors,
    onClose,
    sections,
    toggleVisibility,
    moveSection,
    structureType,
    projectName
}) {
    const activeStructure = STRUCTURE_TYPES.find(t => t.id === structureType) || STRUCTURE_TYPES[0];
    const sectionDefs = activeStructure.sections || [];

    const getLabel = (id) => {
        const def = sectionDefs.find(d => d.id === id);
        return def ? def.label : id;
    };

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-sl-bg border-l border-sl-border shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300 custom-scrollbar">
            <div className="p-4 border-b border-sl-border flex justify-between items-center bg-sl-bg-alt/50 backdrop-blur sticky top-0 z-10">
                <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-sl-magenta" /> Personalizar
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
            </div>

            <div className="p-4 space-y-8">
                {/* Visual Model */}
                <section>
                    <label className="text-xs font-bold text-sl-cyan uppercase tracking-wider mb-3 block">Estilo Visual</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setVisualModel('dark')}
                            className={`p-2 rounded border text-sm transition-all ${visualModel === 'dark' ? 'bg-sl-cyan/10 border-sl-cyan text-sl-cyan' : 'bg-sl-bg-alt border-sl-border text-gray-400'}`}>
                            Cyber Dark
                        </button>
                        <button onClick={() => setVisualModel('light')}
                            className={`p-2 rounded border text-sm transition-all ${visualModel === 'light' ? 'bg-white/10 border-white text-white' : 'bg-sl-bg-alt border-sl-border text-gray-400'}`}>
                            Clean Light
                        </button>
                    </div>
                </section>

                {/* Colors */}
                <section>
                    <label className="text-xs font-bold text-sl-cyan uppercase tracking-wider mb-3 block">Colores de Marca</label>
                    <div className="space-y-6">
                        {[
                            { k: 'primary', l: 'Primario (Botones)' },
                            { k: 'secondary', l: 'Secundario (Fondos)' },
                            { k: 'accent', l: 'Acento (Detalles)' },
                            { k: 'background', l: 'Fondo Página' },
                            { k: 'text', l: 'Texto Principal' },
                        ].map((c) => (
                            <div key={c.k} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-300 uppercase tracking-wide">{c.l}</span>
                                    <div className="w-6 h-6 rounded border border-sl-border" style={{ backgroundColor: customColors[c.k] || '#000000' }}></div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {PRESET_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setCustomColors({ ...customColors, [c.k]: color })}
                                            className={`w-5 h-5 rounded-full border transition-all ${customColors[c.k] === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-110'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <label className="w-5 h-5 rounded-full border border-sl-border bg-gradient-to-br from-white to-black cursor-pointer hover:scale-110 transition-transform relative overflow-hidden">
                                        <input
                                            type="color"
                                            value={customColors[c.k] || '#000000'}
                                            onChange={(e) => setCustomColors({ ...customColors, [c.k]: e.target.value })}
                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sections */}
                <section>
                    <label className="text-xs font-bold text-sl-cyan uppercase tracking-wider mb-3 block">Secciones</label>
                    <div className="space-y-2">
                        {[...sections].sort((a, b) => a.order - b.order).map((s, index) => (
                            <div key={s.id} className="flex items-center gap-2 p-2 bg-sl-bg-alt border border-sl-border rounded group">
                                <div className="flex flex-col gap-0.5 text-gray-600 cursor-grab">
                                    {/* Handle icons simulation */}
                                    <div className="flex gap-0.5"><div className="w-0.5 h-0.5 bg-current rounded-full"></div><div className="w-0.5 h-0.5 bg-current rounded-full"></div></div>
                                    <div className="flex gap-0.5"><div className="w-0.5 h-0.5 bg-current rounded-full"></div><div className="w-0.5 h-0.5 bg-current rounded-full"></div></div>
                                    <div className="flex gap-0.5"><div className="w-0.5 h-0.5 bg-current rounded-full"></div><div className="w-0.5 h-0.5 bg-current rounded-full"></div></div>
                                </div>
                                <span className={`text-sm flex-1 ${s.isVisible ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                                    {getLabel(s.id)}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => toggleVisibility(s.id)} className={`p-1 hover:text-white ${s.isVisible ? 'text-sl-cyan' : 'text-gray-600'}`}>
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <div className="flex flex-col">
                                        <button onClick={() => index > 0 && moveSection(index, index - 1)} disabled={index === 0} className="text-gray-500 hover:text-white disabled:opacity-30 text-[10px]">▲</button>
                                        <button onClick={() => index < sections.length - 1 && moveSection(index, index + 1)} disabled={index === sections.length - 1} className="text-gray-500 hover:text-white disabled:opacity-30 text-[10px]">▼</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
