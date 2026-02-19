import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Rocket, Mail, Lock, User } from 'lucide-react';

export default function Login() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegister) {
                await register(email, password, name);
                navigate('/onboarding');
            } else {
                await login(email, password);
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-sl-bg via-sl-bg-alt to-sl-bg" />

            {/* Decorative grid */}
            <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <Rocket className="w-10 h-10 text-sl-magenta" />
                        <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-sl-magenta to-sl-cyan bg-clip-text text-transparent">
                            StaticLaunch
                        </h1>
                    </div>
                    <p className="text-sl-text-muted text-sm">Tu fábrica de Landing Pages de alto rendimiento</p>
                </div>

                {/* Form Card */}
                <div className="card">
                    <h2 className="text-xl font-heading font-bold text-center mb-6">
                        {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <div>
                                <label className="label"><User className="w-3 h-3 inline mr-1" />Nombre</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder="Tu nombre" className="input-field" />
                            </div>
                        )}
                        <div>
                            <label className="label"><Mail className="w-3 h-3 inline mr-1" />Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com" required className="input-field" />
                        </div>
                        <div>
                            <label className="label"><Lock className="w-3 h-3 inline mr-1" />Contraseña</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••" required className="input-field" />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                            {loading ? 'Procesando...' : isRegister ? 'Crear Cuenta' : 'Acceder'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
                            className="text-sl-cyan text-sm hover:underline">
                            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
