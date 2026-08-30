const API_BASE = '/api';

async function request(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
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
