import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Rocket, LogOut, Palette, LayoutDashboard, ArrowLeft, Save, Eye, Layout } from 'lucide-react';

export default function Header({
    projectName,
    setProjectName,
    showPersonalization,
    setShowPersonalization,
    showMobilePreview,
    setShowMobilePreview,
    handleSave,
    loading
}) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isWizard = !!setProjectName;

    return (
        <header className="border-b border-sl-border bg-sl-bg-alt/50 backdrop-blur z-20">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Left Side: Logo or Dashboard Back Button */}
                <div className="flex items-center gap-4">
                    {isWizard ? (
                        <>
                            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-sl-cyan flex items-center gap-2 text-sm">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </button>
                            <div className="h-6 w-px bg-sl-border hidden sm:block"></div>
                            <input
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Nombre del proyecto"
                                className="bg-transparent border-none text-lg font-heading font-bold text-sl-text focus:outline-none w-48 sm:w-auto"
                            />
                        </>
                    ) : (
                        <Link to="/" className="flex items-center gap-3">
                            <Rocket className="w-7 h-7 text-sl-magenta" />
                            <span className="text-xl font-heading font-bold bg-gradient-to-r from-sl-magenta to-sl-cyan bg-clip-text text-transparent">
                                StaticLaunch
                            </span>
                        </Link>
                    )}
                </div>

                {/* Center: Main Navigation (Only if not in wizard full editor) */}
                {!isWizard && (
                    <nav className="flex items-center gap-6">
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="hidden md:inline">Mis Landings</span>
                        </Link>
                        <Link
                            to="/onboarding"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <Palette className="w-4 h-4 text-sl-cyan" />
                            <span className="hidden md:inline font-bold text-sl-cyan">Identidad Visual</span>
                        </Link>
                    </nav>
                )}

                {/* Right Side: Tools (Wizard) or User Info (Dashboard) */}
                <div className="flex items-center gap-4">
                    {isWizard ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPersonalization(!showPersonalization)}
                                className={`text-sm py-2 px-3 flex items-center gap-1 border transition-all ${showPersonalization ? 'bg-sl-cyan/20 border-sl-cyan text-sl-cyan' : 'btn-secondary text-gray-300'}`}
                            >
                                <Palette className="w-4 h-4" />
                                <span className="hidden sm:inline">Personalizar</span>
                            </button>

                            <button
                                onClick={() => setShowMobilePreview(!showMobilePreview)}
                                className="lg:hidden btn-secondary text-sm py-2 px-3 flex items-center gap-1"
                            >
                                {showMobilePreview ? <Layout className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                <span className="hidden sm:inline">{showMobilePreview ? 'Editor' : 'Preview'}</span>
                            </button>

                            <button onClick={handleSave} disabled={loading} className="btn-primary text-sm py-2 px-4 flex items-center gap-1 shadow-neon-magenta hover:shadow-neon-cyan transition-shadow">
                                <Save className="w-4 h-4" />
                                <span className="hidden sm:inline">Guardar</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <span className="text-sl-text-muted text-sm hidden lg:inline">
                                {user?.email}
                            </span>
                            {(user?.role === 'admin' || user?.role === 'superadmin') && (
                                <Link to="/admin" className="text-sl-accent text-sm hover:underline">Admin</Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="text-gray-400 hover:text-sl-magenta transition-colors flex items-center gap-2"
                                title="Cerrar Sesión"
                            >
                                <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                                <span className="hidden sm:inline text-sm">Cerrar Sesión</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
