const API_URL = '/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('sl_token');
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        if (options.body && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Error de servidor');
    }

    return data;
}

export const api = {
    // Auth
    login: (body) => request('/auth/login', { method: 'POST', body }),
    register: (body) => request('/auth/register', { method: 'POST', body }),
    getMe: () => request('/auth/me'),

    // Projects
    getProjects: () => request('/projects'),
    getProject: (id) => request(`/projects/${id}`),
    createProject: (body) => request('/projects', { method: 'POST', body }),
    updateProject: (id, body) => request(`/projects/${id}`, { method: 'PUT', body }),
    deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

    // Brand
    getBrand: () => request('/brand'),
    updateBrand: (body) => request('/brand', { method: 'PUT', body }),

    // Upload
    uploadLogo: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return request('/uploads/logo', { method: 'POST', body: formData });
    },

    // Leads
    getLeads: (projectId) => request(`/leads/project/${projectId}`),
    exportLeads: (projectId) => `${API_URL}/leads/project/${projectId}/export`,

    // Export HTML
    generateHTML: (projectId) => request(`/export/${projectId}`),

    // Preview
    getPreview: (body) => request('/preview', { method: 'POST', body }),

    // AI
    askAI: (body) => request('/ai/ask', { method: 'POST', body }),

    // Strategy (ZentrixOs)
    analyzeStrategy: (body) => request('/strategy/analyze', { method: 'POST', body }),
    tacticalOp: (body) => request('/strategy/tactical', { method: 'POST', body }),

    // Admin
    getStats: () => request('/admin/stats'),

    // Admin — Users
    getUsers: () => request('/admin/users'),
    getUser: (id) => request(`/admin/users/${id}`),
    createUser: (body) => request('/admin/users', { method: 'POST', body }),
    updateUser: (id, body) => request(`/admin/users/${id}`, { method: 'PUT', body }),
    suspendUser: (id) => request(`/admin/users/${id}/suspend`, { method: 'PUT' }),
    reactivateUser: (id) => request(`/admin/users/${id}/reactivate`, { method: 'PUT' }),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

    // Admin — Licenses
    getLicenses: () => request('/admin/licenses'),
    createLicense: (body) => request('/admin/licenses', { method: 'POST', body }),
    updateLicense: (id, body) => request(`/admin/licenses/${id}`, { method: 'PUT', body }),
    revokeLicense: (id) => request(`/admin/licenses/${id}/revoke`, { method: 'PUT' }),
    deleteLicense: (id) => request(`/admin/licenses/${id}`, { method: 'DELETE' }),

    // Admin — Plans
    getPlans: () => request('/admin/plans'),
    createPlan: (body) => request('/admin/plans', { method: 'POST', body }),
    updatePlan: (id, body) => request(`/admin/plans/${id}`, { method: 'PUT', body }),
    deletePlan: (id) => request(`/admin/plans/${id}`, { method: 'DELETE' }),

    // Admin — Memberships
    getMemberships: () => request('/admin/memberships'),
    createMembership: (body) => request('/admin/memberships', { method: 'POST', body }),
    updateMembership: (id, body) => request(`/admin/memberships/${id}`, { method: 'PUT', body }),
    deleteMembership: (id) => request(`/admin/memberships/${id}`, { method: 'DELETE' }),
};
