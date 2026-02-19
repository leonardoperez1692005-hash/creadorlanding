import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import Header from '../components/layout/Header';
import {
    Users, Key, CreditCard, Crown, Plus, Trash2, Edit3, Ban,
    CheckCircle, XCircle, RefreshCcw, Search, X, Shield, ShieldOff, Loader2
} from 'lucide-react';

// =============================================
//  STATUS BADGES
// =============================================
function StatusBadge({ status }) {
    const map = {
        active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        suspended: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
        revoked: 'bg-red-500/20 text-red-400 border-red-500/30',
        expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border ${map[status] || map.inactive}`}>
            {status}
        </span>
    );
}

function RoleBadge({ role }) {
    const map = {
        superadmin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        user: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border ${map[role] || map.user}`}>
            {role}
        </span>
    );
}

// =============================================
//  MODAL
// =============================================
function AdminModal({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#111827] border border-sl-border rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-sl-border">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <AdminModal title="Confirmar Acción" onClose={onCancel}>
            <p className="text-gray-300 mb-4">{message}</p>
            <div className="flex gap-3 justify-end">
                <button onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
                <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">Confirmar</button>
            </div>
        </AdminModal>
    );
}

// =============================================
//  INPUT HELPERS
// =============================================
function FormField({ label, children }) {
    return (
        <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">{label}</label>
            {children}
        </div>
    );
}

const inputClass = "w-full bg-[#0d1117] border border-sl-border text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-sl-cyan";
const selectClass = inputClass + " appearance-none";

// =============================================
//  TABS CONFIG
// =============================================
const TABS = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'plans', label: 'Planes', icon: CreditCard },
    { id: 'memberships', label: 'Membresías', icon: Crown },
    { id: 'licenses', label: 'Licencias', icon: Key },
];

// =============================================
//  MAIN COMPONENT
// =============================================
export default function AdminPanel() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [tab, setTab] = useState('users');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);

    // Data states
    const [users, setUsers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [licenses, setLicenses] = useState([]);

    // Modal states
    const [modal, setModal] = useState(null); // { type: 'createUser' | 'editUser' | ... , data?: ... }
    const [confirm, setConfirm] = useState(null); // { message, onConfirm }

    // Redirect if not admin
    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'superadmin') navigate('/');
    }, [user, navigate]);

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // =============================================
    //  DATA FETCHING
    // =============================================
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [u, p, m, l] = await Promise.all([
                api.getUsers(), api.getPlans(), api.getMemberships(), api.getLicenses()
            ]);
            setUsers(u.users || []);
            setPlans(p.plans || []);
            setMemberships(m.memberships || []);
            setLicenses(l.licenses || []);
        } catch (err) {
            showToast('Error cargando datos: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    // Filter function
    const filterBySearch = (items, keys) => {
        if (!search.trim()) return items;
        const q = search.toLowerCase();
        return items.filter(item => keys.some(k => {
            const val = k.includes('.') ? k.split('.').reduce((o, p) => o?.[p], item) : item[k];
            return String(val || '').toLowerCase().includes(q);
        }));
    };

    // =============================================
    //  USERS TAB
    // =============================================
    function UsersTab() {
        const filtered = filterBySearch(users, ['email', 'name', 'role', 'status']);

        const handleCreate = async (data) => {
            try {
                await api.createUser(data);
                showToast('Usuario creado');
                setModal(null);
                loadData();
            } catch (e) { showToast(e.message, 'error'); }
        };

        const handleUpdate = async (id, data) => {
            try {
                await api.updateUser(id, data);
                showToast('Usuario actualizado');
                setModal(null);
                loadData();
            } catch (e) { showToast(e.message, 'error'); }
        };

        const handleSuspend = async (id) => {
            try { await api.suspendUser(id); showToast('Usuario suspendido'); loadData(); }
            catch (e) { showToast(e.message, 'error'); }
        };

        const handleReactivate = async (id) => {
            try { await api.reactivateUser(id); showToast('Usuario reactivado'); loadData(); }
            catch (e) { showToast(e.message, 'error'); }
        };

        const handleDelete = (id, email) => {
            setConfirm({
                message: `¿Eliminar al usuario "${email}" y TODOS sus datos? Esta acción no se puede deshacer.`,
                onConfirm: async () => {
                    try { await api.deleteUser(id); showToast('Usuario eliminado'); setConfirm(null); loadData(); }
                    catch (e) { showToast(e.message, 'error'); setConfirm(null); }
                }
            });
        };

        return (
            <>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 text-sm">{filtered.length} usuarios</span>
                    {user.role === 'superadmin' && (
                        <button onClick={() => setModal({ type: 'createUser' })} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Nuevo Usuario
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-sl-border text-gray-500 text-left">
                                <th className="pb-2 pr-3">Email</th>
                                <th className="pb-2 pr-3">Nombre</th>
                                <th className="pb-2 pr-3">Rol</th>
                                <th className="pb-2 pr-3">Status</th>
                                <th className="pb-2 pr-3">Plan</th>
                                <th className="pb-2 pr-3">Proyectos</th>
                                <th className="pb-2 pr-3">Registro</th>
                                <th className="pb-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => {
                                const activeMembership = u.memberships?.find(m => m.status === 'active');
                                return (
                                    <tr key={u.id} className="border-b border-sl-border/50 hover:bg-white/[0.02]">
                                        <td className="py-2 pr-3 text-white">{u.email}</td>
                                        <td className="py-2 pr-3 text-gray-300">{u.name || '—'}</td>
                                        <td className="py-2 pr-3"><RoleBadge role={u.role} /></td>
                                        <td className="py-2 pr-3"><StatusBadge status={u.status} /></td>
                                        <td className="py-2 pr-3 text-gray-400">{activeMembership?.plan?.name || '—'}</td>
                                        <td className="py-2 pr-3 text-gray-400">{u._count?.projects ?? 0}</td>
                                        <td className="py-2 pr-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="py-2">
                                            <div className="flex gap-1">
                                                <button onClick={() => setModal({ type: 'editUser', data: u })} title="Editar" className="p-1 text-gray-400 hover:text-sl-cyan"><Edit3 className="w-3.5 h-3.5" /></button>
                                                {u.status === 'active' && u.role !== 'superadmin' && (
                                                    <button onClick={() => handleSuspend(u.id)} title="Suspender" className="p-1 text-gray-400 hover:text-amber-400"><Ban className="w-3.5 h-3.5" /></button>
                                                )}
                                                {u.status === 'suspended' && (
                                                    <button onClick={() => handleReactivate(u.id)} title="Reactivar" className="p-1 text-gray-400 hover:text-emerald-400"><RefreshCcw className="w-3.5 h-3.5" /></button>
                                                )}
                                                {user.role === 'superadmin' && u.role !== 'superadmin' && (
                                                    <button onClick={() => handleDelete(u.id, u.email)} title="Eliminar" className="p-1 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Create User Modal */}
                {modal?.type === 'createUser' && (
                    <UserFormModal title="Crear Usuario" onSubmit={handleCreate} onClose={() => setModal(null)} />
                )}
                {modal?.type === 'editUser' && (
                    <UserFormModal title="Editar Usuario" initial={modal.data} onSubmit={(d) => handleUpdate(modal.data.id, d)} onClose={() => setModal(null)} />
                )}
            </>
        );
    }

    // =============================================
    //  PLANS TAB
    // =============================================
    function PlansTab() {
        const filtered = filterBySearch(plans, ['name', 'slug', 'status']);

        const handleCreate = async (data) => {
            try { await api.createPlan(data); showToast('Plan creado'); setModal(null); loadData(); }
            catch (e) { showToast(e.message, 'error'); }
        };

        const handleUpdate = async (id, data) => {
            try { await api.updatePlan(id, data); showToast('Plan actualizado'); setModal(null); loadData(); }
            catch (e) { showToast(e.message, 'error'); }
        };

        const handleDelete = (plan) => {
            setConfirm({
                message: `¿Eliminar el plan "${plan.name}"? Solo se puede si no tiene membresías activas.`,
                onConfirm: async () => {
                    try { await api.deletePlan(plan.id); showToast('Plan eliminado'); setConfirm(null); loadData(); }
                    catch (e) { showToast(e.message, 'error'); setConfirm(null); }
                }
            });
        };

        return (
            <>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 text-sm">{filtered.length} planes</span>
                    {user.role === 'superadmin' && (
                        <button onClick={() => setModal({ type: 'createPlan' })} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Nuevo Plan
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(p => (
                        <div key={p.id} className="bg-[#111827] border border-sl-border rounded-xl p-4 hover:border-sl-cyan/30 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-white font-bold">{p.name}</h4>
                                    <span className="text-gray-500 text-xs">{p.slug}</span>
                                </div>
                                <StatusBadge status={p.status} />
                            </div>
                            <div className="text-2xl font-bold text-sl-cyan mb-3">
                                ${p.price}<span className="text-sm text-gray-500">/{p.currency}</span>
                            </div>
                            <div className="text-xs text-gray-400 space-y-1 mb-4">
                                <div>📁 Hasta {p.maxProjects} proyectos</div>
                                <div>👥 Hasta {p.maxLeads} leads</div>
                                <div>🎫 {p._count?.memberships || 0} membresías</div>
                            </div>
                            {user.role === 'superadmin' && (
                                <div className="flex gap-2 pt-3 border-t border-sl-border/50">
                                    <button onClick={() => setModal({ type: 'editPlan', data: p })} className="text-xs text-gray-400 hover:text-sl-cyan flex items-center gap-1">
                                        <Edit3 className="w-3 h-3" /> Editar
                                    </button>
                                    <button onClick={() => handleDelete(p)} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1">
                                        <Trash2 className="w-3 h-3" /> Eliminar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {modal?.type === 'createPlan' && (
                    <PlanFormModal title="Crear Plan" onSubmit={handleCreate} onClose={() => setModal(null)} />
                )}
                {modal?.type === 'editPlan' && (
                    <PlanFormModal title="Editar Plan" initial={modal.data} onSubmit={(d) => handleUpdate(modal.data.id, d)} onClose={() => setModal(null)} />
                )}
            </>
        );
    }

    // =============================================
    //  MEMBERSHIPS TAB
    // =============================================
    function MembershipsTab() {
        const filtered = filterBySearch(memberships, ['user.email', 'user.name', 'plan.name', 'status']);

        const handleCreate = async (data) => {
            try { await api.createMembership(data); showToast('Membresía creada'); setModal(null); loadData(); }
            catch (e) { showToast(e.message, 'error'); }
        };

        const handleUpdate = async (id, data) => {
            try { await api.updateMembership(id, data); showToast('Membresía actualizada'); setModal(null); loadData(); }
            catch (e) { showToast(e.message, 'error'); }
        };

        const handleDelete = (m) => {
            setConfirm({
                message: `¿Eliminar la membresía de "${m.user?.email}" (plan: ${m.plan?.name})?`,
                onConfirm: async () => {
                    try { await api.deleteMembership(m.id); showToast('Membresía eliminada'); setConfirm(null); loadData(); }
                    catch (e) { showToast(e.message, 'error'); setConfirm(null); }
                }
            });
        };

        return (
            <>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 text-sm">{filtered.length} membresías</span>
                    <button onClick={() => setModal({ type: 'createMembership' })} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Asignar Plan
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-sl-border text-gray-500 text-left">
                                <th className="pb-2 pr-3">Usuario</th>
                                <th className="pb-2 pr-3">Plan</th>
                                <th className="pb-2 pr-3">Status</th>
                                <th className="pb-2 pr-3">Inicio</th>
                                <th className="pb-2 pr-3">Expiración</th>
                                <th className="pb-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(m => (
                                <tr key={m.id} className="border-b border-sl-border/50 hover:bg-white/[0.02]">
                                    <td className="py-2 pr-3 text-white">{m.user?.email || '—'}</td>
                                    <td className="py-2 pr-3 text-sl-cyan">{m.plan?.name || '—'}</td>
                                    <td className="py-2 pr-3"><StatusBadge status={m.status} /></td>
                                    <td className="py-2 pr-3 text-gray-500 text-xs">{new Date(m.startDate).toLocaleDateString()}</td>
                                    <td className="py-2 pr-3 text-gray-500 text-xs">{m.expiresAt ? new Date(m.expiresAt).toLocaleDateString() : '∞'}</td>
                                    <td className="py-2">
                                        <div className="flex gap-1">
                                            <button onClick={() => setModal({ type: 'editMembership', data: m })} title="Editar" className="p-1 text-gray-400 hover:text-sl-cyan"><Edit3 className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(m)} title="Eliminar" className="p-1 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {modal?.type === 'createMembership' && (
                    <MembershipFormModal title="Asignar Plan" users={users} plans={plans} onSubmit={handleCreate} onClose={() => setModal(null)} />
                )}
                {modal?.type === 'editMembership' && (
                    <MembershipFormModal title="Editar Membresía" initial={modal.data} users={users} plans={plans} onSubmit={(d) => handleUpdate(modal.data.id, d)} onClose={() => setModal(null)} />
                )}
            </>
        );
    }

    // =============================================
    //  LICENSES TAB
    // =============================================
    function LicensesTab() {
        const filtered = filterBySearch(licenses, ['key', 'domain', 'status', 'user.email']);

        const handleCreate = async (data) => {
            try { await api.createLicense(data); showToast('Licencia creada'); setModal(null); loadData(); }
            catch (e) { showToast(e.message, 'error'); }
        };

        const handleUpdate = async (id, data) => {
            try { await api.updateLicense(id, data); showToast('Licencia actualizada'); setModal(null); loadData(); }
            catch (e) { showToast(e.message, 'error'); }
        };

        const handleRevoke = async (id) => {
            try { await api.revokeLicense(id); showToast('Licencia revocada'); loadData(); }
            catch (e) { showToast(e.message, 'error'); }
        };

        const handleDelete = (l) => {
            setConfirm({
                message: `¿Eliminar la licencia "${l.key}"?`,
                onConfirm: async () => {
                    try { await api.deleteLicense(l.id); showToast('Licencia eliminada'); setConfirm(null); loadData(); }
                    catch (e) { showToast(e.message, 'error'); setConfirm(null); }
                }
            });
        };

        return (
            <>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 text-sm">{filtered.length} licencias</span>
                    <button onClick={() => setModal({ type: 'createLicense' })} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Nueva Licencia
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-sl-border text-gray-500 text-left">
                                <th className="pb-2 pr-3">Key</th>
                                <th className="pb-2 pr-3">Usuario</th>
                                <th className="pb-2 pr-3">Dominio</th>
                                <th className="pb-2 pr-3">Status</th>
                                <th className="pb-2 pr-3">Expiración</th>
                                <th className="pb-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(l => (
                                <tr key={l.id} className="border-b border-sl-border/50 hover:bg-white/[0.02]">
                                    <td className="py-2 pr-3 font-mono text-sl-cyan text-xs">{l.key}</td>
                                    <td className="py-2 pr-3 text-gray-300">{l.user?.email || '—'}</td>
                                    <td className="py-2 pr-3 text-gray-400">{l.domain || '—'}</td>
                                    <td className="py-2 pr-3"><StatusBadge status={l.status} /></td>
                                    <td className="py-2 pr-3 text-gray-500 text-xs">{l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : '∞'}</td>
                                    <td className="py-2">
                                        <div className="flex gap-1">
                                            <button onClick={() => setModal({ type: 'editLicense', data: l })} title="Editar" className="p-1 text-gray-400 hover:text-sl-cyan"><Edit3 className="w-3.5 h-3.5" /></button>
                                            {l.status === 'active' && (
                                                <button onClick={() => handleRevoke(l.id)} title="Revocar" className="p-1 text-gray-400 hover:text-amber-400"><ShieldOff className="w-3.5 h-3.5" /></button>
                                            )}
                                            <button onClick={() => handleDelete(l)} title="Eliminar" className="p-1 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {modal?.type === 'createLicense' && (
                    <LicenseFormModal title="Crear Licencia" users={users} onSubmit={handleCreate} onClose={() => setModal(null)} />
                )}
                {modal?.type === 'editLicense' && (
                    <LicenseFormModal title="Editar Licencia" initial={modal.data} users={users} onSubmit={(d) => handleUpdate(modal.data.id, d)} onClose={() => setModal(null)} />
                )}
            </>
        );
    }

    // =============================================
    //  RENDER
    // =============================================
    return (
        <div className="min-h-screen bg-sl-bg text-sl-text">
            <Header />

            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg text-sm shadow-lg border ${toast.type === 'error' ? 'bg-red-900/80 border-red-600 text-red-200' : 'bg-emerald-900/80 border-emerald-600 text-emerald-200'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Confirm Modal */}
            {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Title */}
                <div className="mb-6">
                    <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-sl-magenta to-sl-cyan bg-clip-text text-transparent mb-1">
                        Panel de Administración
                    </h1>
                    <p className="text-gray-500 text-sm">Gestión completa de usuarios, planes, membresías y licencias</p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-sl-border mb-6">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => { setTab(t.id); setSearch(''); }}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-all border-b-2 -mb-px ${tab === t.id ? 'border-sl-cyan text-sl-cyan' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-4 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full bg-[#111827] border border-sl-border text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-sl-cyan"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-sl-cyan animate-spin" />
                    </div>
                ) : (
                    <>
                        {tab === 'users' && <UsersTab />}
                        {tab === 'plans' && <PlansTab />}
                        {tab === 'memberships' && <MembershipsTab />}
                        {tab === 'licenses' && <LicensesTab />}
                    </>
                )}
            </div>
        </div>
    );
}

// =============================================
//  FORM MODALS
// =============================================
function UserFormModal({ title, initial, onSubmit, onClose }) {
    const [form, setForm] = useState({
        email: initial?.email || '',
        name: initial?.name || '',
        role: initial?.role || 'user',
        status: initial?.status || 'active',
        password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...form };
        if (!initial && !data.password) return;
        if (initial) delete data.password; // Don't send password on edit unless changed
        if (initial && form.password) data.password = form.password;
        onSubmit(data);
    };

    return (
        <AdminModal title={title} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <FormField label="Email">
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} required />
                </FormField>
                <FormField label="Nombre">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
                </FormField>
                {!initial && (
                    <FormField label="Contraseña">
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} required />
                    </FormField>
                )}
                <FormField label="Rol">
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={selectClass}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                    </select>
                </FormField>
                {initial && (
                    <FormField label="Status">
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectClass}>
                            <option value="active">active</option>
                            <option value="suspended">suspended</option>
                            <option value="cancelled">cancelled</option>
                        </select>
                    </FormField>
                )}
                <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary px-4 py-2 text-sm">{initial ? 'Guardar' : 'Crear'}</button>
                </div>
            </form>
        </AdminModal>
    );
}

function PlanFormModal({ title, initial, onSubmit, onClose }) {
    const [form, setForm] = useState({
        name: initial?.name || '',
        price: initial?.price || 0,
        currency: initial?.currency || 'USD',
        maxProjects: initial?.maxProjects || 5,
        maxLeads: initial?.maxLeads || 500,
        status: initial?.status || 'active',
    });

    return (
        <AdminModal title={title} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
                <FormField label="Nombre del Plan">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="Precio">
                        <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} className={inputClass} />
                    </FormField>
                    <FormField label="Moneda">
                        <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={selectClass}>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="MXN">MXN</option>
                        </select>
                    </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="Máx. Proyectos">
                        <input type="number" value={form.maxProjects} onChange={(e) => setForm({ ...form, maxProjects: parseInt(e.target.value) })} className={inputClass} />
                    </FormField>
                    <FormField label="Máx. Leads">
                        <input type="number" value={form.maxLeads} onChange={(e) => setForm({ ...form, maxLeads: parseInt(e.target.value) })} className={inputClass} />
                    </FormField>
                </div>
                {initial && (
                    <FormField label="Status">
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectClass}>
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                        </select>
                    </FormField>
                )}
                <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary px-4 py-2 text-sm">{initial ? 'Guardar' : 'Crear'}</button>
                </div>
            </form>
        </AdminModal>
    );
}

function MembershipFormModal({ title, initial, users, plans, onSubmit, onClose }) {
    const [form, setForm] = useState({
        userId: initial?.userId || initial?.user?.id || '',
        planId: initial?.planId || initial?.plan?.id || '',
        status: initial?.status || 'active',
        expiresAt: initial?.expiresAt ? initial.expiresAt.split('T')[0] : '',
    });

    return (
        <AdminModal title={title} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, userId: parseInt(form.userId), planId: parseInt(form.planId), expiresAt: form.expiresAt || null }); }}>
                <FormField label="Usuario">
                    <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className={selectClass} required disabled={!!initial}>
                        <option value="">Seleccionar usuario...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.email} ({u.name || 'Sin nombre'})</option>)}
                    </select>
                </FormField>
                <FormField label="Plan">
                    <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className={selectClass} required>
                        <option value="">Seleccionar plan...</option>
                        {plans.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                    </select>
                </FormField>
                {initial && (
                    <FormField label="Status">
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectClass}>
                            <option value="active">active</option>
                            <option value="expired">expired</option>
                            <option value="cancelled">cancelled</option>
                        </select>
                    </FormField>
                )}
                <FormField label="Fecha de Expiración (opcional)">
                    <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} />
                </FormField>
                <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary px-4 py-2 text-sm">{initial ? 'Guardar' : 'Asignar'}</button>
                </div>
            </form>
        </AdminModal>
    );
}

function LicenseFormModal({ title, initial, users, onSubmit, onClose }) {
    const [form, setForm] = useState({
        userId: initial?.userId || initial?.user?.id || '',
        domain: initial?.domain || '',
        status: initial?.status || 'active',
        expiresAt: initial?.expiresAt ? initial.expiresAt.split('T')[0] : '',
    });

    return (
        <AdminModal title={title} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, userId: form.userId ? parseInt(form.userId) : null, expiresAt: form.expiresAt || null }); }}>
                <FormField label="Asignar a Usuario (opcional)">
                    <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className={selectClass}>
                        <option value="">Sin asignar</option>
                        {users?.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                    </select>
                </FormField>
                <FormField label="Dominio (opcional)">
                    <input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className={inputClass} placeholder="example.com" />
                </FormField>
                {initial && (
                    <FormField label="Status">
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectClass}>
                            <option value="active">active</option>
                            <option value="revoked">revoked</option>
                            <option value="expired">expired</option>
                        </select>
                    </FormField>
                )}
                <FormField label="Fecha de Expiración (opcional)">
                    <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} />
                </FormField>
                <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary px-4 py-2 text-sm">{initial ? 'Guardar' : 'Crear'}</button>
                </div>
            </form>
        </AdminModal>
    );
}
