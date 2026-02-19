import { create } from 'zustand';
import { api } from '../lib/api';

export const useAuthStore = create((set) => ({
    user: null,
    membership: null,
    plan: null,
    token: localStorage.getItem('sl_token') || null,
    isLoading: true,

    login: async (email, password) => {
        const data = await api.login({ email, password });
        localStorage.setItem('sl_token', data.token);
        set({
            user: data.user,
            membership: data.user.membership,
            plan: data.user.membership?.plan,
            token: data.token
        });
        return data;
    },

    register: async (email, password, name) => {
        const data = await api.register({ email, password, name });
        localStorage.setItem('sl_token', data.token);
        set({
            user: data.user,
            membership: data.user.membership,
            plan: data.user.membership?.plan,
            token: data.token
        });
        return data;
    },

    checkAuth: async () => {
        const token = localStorage.getItem('sl_token');
        if (!token) {
            set({ isLoading: false });
            return;
        }
        try {
            const data = await api.getMe();
            set({
                user: data.user,
                membership: data.user.membership,
                plan: data.user.membership?.plan,
                token,
                isLoading: false
            });
        } catch {
            localStorage.removeItem('sl_token');
            set({ user: null, membership: null, plan: null, token: null, isLoading: false });
        }
    },

    logout: () => {
        localStorage.removeItem('sl_token');
        set({ user: null, membership: null, plan: null, token: null });
    },

    // Helper para verificar features
    hasFeature: (feature) => {
        const { plan } = useAuthStore.getState();
        if (!plan) return false;
        try {
            const features = JSON.parse(plan.features || '[]');
            return features.includes('*') || features.includes(feature);
        } catch {
            return false;
        }
    },
}));
