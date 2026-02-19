import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Download, Users, Mail, Phone, Clock } from 'lucide-react';

export default function ProjectLeads() {
    const { id } = useParams();
    const [leads, setLeads] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeads();
    }, [id]);

    const loadLeads = async () => {
        try {
            const data = await api.getLeads(id);
            setLeads(data.leads);
            setTotal(data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const token = localStorage.getItem('sl_token');
        window.open(`/api/leads/project/${id}/export?token=${token}`, '_blank');
    };

    return (
        <div className="min-h-screen">
            <header className="border-b border-sl-border px-4 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to="/" className="text-gray-400 hover:text-sl-cyan flex items-center gap-2 text-sm">
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <button onClick={handleExport} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-heading font-bold">
                        <Users className="w-6 h-6 inline mr-2 text-sl-accent" />
                        Leads Capturados
                    </h1>
                    <span className="text-sl-cyan font-heading text-xl font-bold">{total} total</span>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-sl-text-muted">Cargando...</div>
                ) : leads.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-heading font-bold mb-2">Sin leads aún</h2>
                        <p className="text-sl-text-muted">Los contactos de tu landing aparecerán aquí</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-sl-border text-left">
                                    <th className="py-3 px-4 text-xs text-sl-cyan uppercase tracking-wider">#</th>
                                    <th className="py-3 px-4 text-xs text-sl-cyan uppercase tracking-wider">Nombre</th>
                                    <th className="py-3 px-4 text-xs text-sl-cyan uppercase tracking-wider">Email</th>
                                    <th className="py-3 px-4 text-xs text-sl-cyan uppercase tracking-wider">Teléfono</th>
                                    <th className="py-3 px-4 text-xs text-sl-cyan uppercase tracking-wider">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((lead, i) => (
                                    <tr key={lead.id} className="border-b border-sl-border/50 hover:bg-sl-bg-alt/50 transition-colors">
                                        <td className="py-3 px-4 text-sm text-gray-500">{i + 1}</td>
                                        <td className="py-3 px-4 text-sm font-medium">{lead.name || '—'}</td>
                                        <td className="py-3 px-4 text-sm">
                                            <Mail className="w-3 h-3 inline mr-1 text-sl-cyan" />{lead.email}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-sl-text-muted">
                                            {lead.phone ? <><Phone className="w-3 h-3 inline mr-1" />{lead.phone}</> : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-sl-text-muted">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            {new Date(lead.createdAt).toLocaleString('es')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
