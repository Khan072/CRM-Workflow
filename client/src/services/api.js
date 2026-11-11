const API_BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('wpg_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !url.includes('/auth/login')) {
        localStorage.removeItem('wpg_token');
        localStorage.removeItem('wpg_user');
        window.location.href = '/login';
      }
      throw new Error(data.error || data.messages?.join(', ') || 'Request failed');
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () =>
    request('/auth/me'),

  // Leads
  createLead: (data) =>
    request('/leads', { method: 'POST', body: JSON.stringify(data) }),

  getLeads: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request(`/leads${query ? `?${query}` : ''}`);
  },

  getLead: (id) =>
    request(`/leads/${id}`),

  updateLead: (id, data) =>
    request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  addMessage: (id, data) =>
    request(`/leads/${id}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  sendReply: (id, replyText) =>
    request(`/leads/${id}/reply`, { method: 'POST', body: JSON.stringify({ replyText }) }),

  checkDuplicate: (params) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request(`/leads/check-duplicate?${query}`);
  },

  // Analytics
  getAnalytics: () =>
    request('/analytics/summary'),
};
