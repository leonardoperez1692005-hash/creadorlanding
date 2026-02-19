import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Wizard from './pages/Wizard';
import Onboarding from './pages/Onboarding';
import ProjectLeads from './pages/ProjectLeads';
import Success from './pages/Success';
import AdminPanel from './pages/AdminPanel';
import Strategy from './pages/Strategy';
import Pricing from './pages/Pricing';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }) {
    const { user, isLoading } = useAuthStore();
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-sl-cyan animate-spin" />
            </div>
        );
    }
    return user ? children : <Navigate to="/login" />;
}

export default function App() {
    const checkAuth = useAuthStore((s) => s.checkAuth);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/onboarding"
                element={
                    <ProtectedRoute>
                        <Onboarding />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/wizard/:id?"
                element={
                    <ProtectedRoute>
                        <Wizard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/strategy"
                element={
                    <ProtectedRoute>
                        <Strategy />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/project/:id/leads"
                element={
                    <ProtectedRoute>
                        <ProjectLeads />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/deploy-success/:id"
                element={
                    <ProtectedRoute>
                        <Success />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <AdminPanel />
                    </ProtectedRoute>
                }
            />
            {/* STANDALONE: Pricing route removed
            <Route
                path="/pricing"
                element={
                    <ProtectedRoute>
                        <Pricing />
                    </ProtectedRoute>
                }
            />
            */}
            <Route path=