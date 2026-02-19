import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { Plus, Rocket, Users, LogOut, Trash2, Eye, BarChart3, FileText, Brain, Crown } from 'lucide-react';

import Header from '../components/layout/Header';
import Modal from '../components/Modal';

export default function Dashboard() {
    const { user, plan, hasFeature } = useAuthStore();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await api.getProjects();
            setProjects(data.projects);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewProject = () => {
        navigate('/wizard');
    };

    const confirmDelete = (project) => {
        setProjectToDelete(project);
        setDeleteModalOpen(true);
    }

    const handleDelete = async () => {
        if (!projectToDelete || deleting) return;
        setDeleting(true);
        try {
            await api.deleteProject(projectToDelete.id);
            setProjects(projects.filter((p) => p.id !== projectToDelete.id));
            setDeleteModalOpen(false);
            setProjectToDelete(null);
        } catch (err) {
            console.error(err);
            alert('Error al eliminar el proyecto: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleGenerate = async (id) => {
        try {
            const data = await api.generateHTML(id);
            const blob = new Blob([data.html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const typeLabels = { vsl: 'VSL', webinar: 'Webinar', long_letter: 'Long Letter' };

    return (
        <div className="min-h-screen">
            <Header />


            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Plan Badge */}
                {/* STANDALONE: Plan Badge removed
                {plan && (
                    <div className="mb-4 flex items-center gap-2 text-sm">
                        <span className="text-white/40">Plan:</span>
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 rounded-full font-semibold">
                            {plan.name}
                        </span>
                        <span className="text-white/30">
                            • {plan.maxProjects} proyectos • {plan.maxAIAnalysis} análisis AI/mes
                        </span>
                    </div>
                )}
                */}

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-heading font-bold">Mis Landing Pages</h1>
                    <div className="flex gap-3">
                        {/* ZentrixOs - solo si tiene la feature */}
                        {hasFeature && hasFeature('zentrix_os') ? (
                            <button
                                onClick={() => navigate('/strategy')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sl-cyan/20 to-sl-cyan/10 border border-sl-cyan/30 text-sl-cyan rounded-lg font-heading font-semibold tracking-wider hover:from-sl-cyan/30 hover:to-sl-cyan/20 transition-all text-sm"
                            >
                                <Brain className="w-5 h-5" /> ZentrixOs
                            </button>
                        ) : null
                        /* STANDALONE: Upgrade button removed
                        (
                            <button
                                onClick={() => navigate('/pricing')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg font-heading font-semibold tracking-wider hover:from-amber-500/30 hover:to-amber-500/20 transition-all text-sm"
                            >
                                <Crown className="w-5 h-5" /> Upgrade
                            </button>
                        )
                        */}
                        <button onClick={handleNewProject} className="btn-primary flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Nueva Landing
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-sl-text-muted">Cargando...</div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-heading font-bold mb-2">Sin proyectos aún</h2>
                        <p className="text-sl-text-muted mb-6">Crea tu primera landing page en minutos</p>
                        <button onClick={handleNewProject} className="btn-primary">
                            <Plus className="w-5 h-5 inline mr-2" /> Crear Mi Primera Landing
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((p) => (
                            <div key={p.id} className="card group">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs uppercase tracking-wider text-sl-cyan font-semibold bg-sl-cyan/10 px-2 py-1 rounded">
                                        {typeLabels[p.structureType] || p.structureType}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(p.updatedAt).toLocaleDateString('es')}
                                    </span>
                                </div>
                                <h3 className="text-lg font-heading font-bold mb-2">{p.name}</h3>
                                <p className="text-sm text-sl-text-muted mb-4">/{p.slug}</p>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm text-sl-text-muted mb-4">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" /> {p._count?.leads || 0} leads
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button onClick={() => navigate(`/wizard/${p.id}`)}
                                        className="flex-1 btn-secondary text-sm py-2">
                                        Editar
                                    </button>
                                    <button onClick={() => handleGenerate(p.id)}
                                        className="p-2 border border-sl-border rounded-lg hover:border-sl-cyan transition-colors"
                                        title="Preview">
                                        <Eye className="w-4 h-4 text-sl-cyan" />
                                    </button>
                                    <Link to={`/project/${p.id}/leads`}
                                        className="p-2 border border-sl-border rounded-lg hover:border-sl-accent transition-colors"
                                        title="Leads">
                                        <BarChart3 className="w-4 h-4 text-sl-accent" />
                                    </Link>
                                    <button onClick={() => confirmDelete(p)}
                                        className="p-2 border border-sl-border rounded-lg hover:border-red-500 transition-colors"
                                        title="Eliminar">
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="¿Eliminar Proyecto?"
            >
                <div className="space-y-4">
                    <p className="text-sl-text-muted">
                        Estás a punto de eliminar <strong>{projectToDelete?.name}</strong>.
                        Esta acción no se puede deshacer y perderás todos los leads asociados.
                    </p>
                    <div className="flex justify-end gap-3 pt-4 border-t border-sl-border">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="text-gray-400 hover:text-white px-4 py-2"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className={`${deleting ? 'bg-red-500/50 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-colors flex items-center gap-2`}
                        >
                            {deleting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Eliminando...
                                </>
                            ) : 'Sí, Eliminar'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
