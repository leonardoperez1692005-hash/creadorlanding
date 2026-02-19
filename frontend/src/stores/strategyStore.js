import { create } from 'zustand';
import { api } from '../lib/api';

export const useStrategyStore = create((set, get) => ({
    // --- State ---
    step: 'brief', // 'brief' | 'processing' | 'dashboard'
    loading: false,
    error: null,
    processingStatus: '',

    briefData: {
        brandName: '',
        sector: '',
        brandValues: '',
        targetAudience: '',
        objectives: '',
        designSystem: '',
        competitors: '',
        country: 'Argentina',
        missionType: 'ventas',
    },

    strategy: null,
    meta: null,

    // Tactical overlay
    tacticalOverlay: null, // { type: 'objections' | 'content', salesAngle, data }

    // --- Actions ---
    setBriefField: (field, value) =>
        set((state) => ({
            briefData: { ...state.briefData, [field]: value },
        })),

    setBriefData: (data) =>
        set((state) => ({
            briefData: { ...state.briefData, ...data },
        })),

    setStep: (step) => set({ step }),

    fillDemoData: () =>
        set({
            briefData: {
                brandName: 'ZER0_TRUST',
                sector: 'Ciberseguridad para PYMEs',
                brandValues: 'Protección sin complejidad, transparencia, tecnología accesible',
                targetAudience: 'Dueños de PYMEs de 10-50 empleados que no tienen equipo de IT',
                objectives: 'Generar leads calificados y cerrar ventas de plan mensual',
                designSystem: 'Dark mode, colores neon, tipografía técnica, estética cyberpunk',
                competitors: 'https://www.crowdstrike.com\nhttps://www.sentinelone.com\nhttps://www.bitdefender.com',
                country: 'México',
                missionType: 'ventas',
            },
        }),

    runAnalysis: async () => {
        const { briefData } = get();
        set({ loading: true, error: null, step: 'processing', processingStatus: 'INICIALIZANDO PROTOCOLO ZENTRIX...' });

        try {
            set({ processingStatus: 'ESCANEANDO COMPETIDORES (FIRECRAWL)...' });
            console.log('[StrategyStore] Iniciando análisis estratégico...');
            const result = await api.analyzeStrategy(briefData);
            console.log('[StrategyStore] Análisis completado con éxito:', result);

            set({
                strategy: result.strategy,
                meta: result.meta,
                step: 'dashboard',
                loading: false,
                processingStatus: 'ANÁLISIS COMPLETO',
            });

            return result;
        } catch (error) {
            set({
                error: error.message || 'Error en el análisis estratégico',
                loading: false,
                step: 'brief',
                processingStatus: '',
            });
            throw error;
        }
    },

    runTacticalOp: async (type, salesAngle) => {
        const { briefData } = get();

        try {
            const result = await api.tacticalOp({
                type,
                salesAngle,
                brandName: briefData.brandName,
                sector: briefData.sector,
            });

            set({ tacticalOverlay: { type, salesAngle, data: result.data } });
            return result.data;
        } catch (error) {
            console.error('[Strategy] Error táctico:', error);
            throw error;
        }
    },

    closeTacticalOverlay: () => set({ tacticalOverlay: null }),

    resetStrategy: () =>
        set({
            step: 'brief',
            loading: false,
            error: null,
            processingStatus: '',
            strategy: null,
            meta: null,
            tacticalOverlay: null,
        }),
}));
