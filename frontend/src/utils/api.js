const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Auth APIs
export const authAPI = {
  register: async (email, password, role = 'user') => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }
    
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    const data = await response.json();
    // Store token and user info in localStorage
    localStorage.setItem('access_token', data.access_token);
    
    // Store user info (decode from token or get from response)
    // For now, store basic info - you might want to decode JWT
    authAPI.setCurrentUser({ 
      email: email,
      role: data.role || 'user' // Assuming backend returns role
    });
    
    return data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
  },

  getToken: () => {
    return localStorage.getItem('access_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setCurrentUser: (user) => {
    localStorage.setItem('current_user', JSON.stringify(user));
  },

  getUserRole: () => {
    const user = authAPI.getCurrentUser();
    return user?.role || null;
  },
};

// Incident APIs
export const incidentAPI = {
  create: async (incidentData) => {
    const token = authAPI.getToken();
    const response = await fetch(`${API_BASE_URL}/incidents/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(incidentData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create incident');
    }
    
    return response.json();
  },

  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${API_BASE_URL}/incidents/?${queryParams}` : `${API_BASE_URL}/incidents/`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch incidents');
    }
    
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/incidents/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch incident');
    }
    
    return response.json();
  },

  update: async (id, updateData) => {
    const token = authAPI.getToken();
    const response = await fetch(`${API_BASE_URL}/incidents/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update incident');
    }
    
    return response.json();
  },

  uploadImage: async (file) => {
    const token = authAPI.getToken();
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/incidents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload image');
    }

    return response.json();
  },

  addComment: async (id, text) => {
    const token = authAPI.getToken();
    const response = await fetch(`${API_BASE_URL}/incidents/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add comment');
    }
    
    return response.json();
  },

  delete: async (id) => {
    const token = authAPI.getToken();
    const response = await fetch(`${API_BASE_URL}/incidents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete incident');
    }
    
    return response.json();
  },

  // Validation endpoints
  validateAdmin: async (id, validationNotes = '') => {
    const token = authAPI.getToken();
    const response = await fetch(`${API_BASE_URL}/incidents/${id}/validate/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ validation_notes: validationNotes }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to validate incident');
    }
    
    return response.json();
  },

  validateNGO: async (id, validationNotes = '') => {
    const token = authAPI.getToken();
    const response = await fetch(`${API_BASE_URL}/incidents/${id}/validate/ngo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ validation_notes: validationNotes }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to validate incident');
    }
    
    return response.json();
  },

  removeAdminValidation: async (id) => {
    const token = authAPI.getToken();
    const response = await fetch(`${API_BASE_URL}/incidents/${id}/validate/admin`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to remove validation');
    }
    
    return response.json();
  },

  removeNGOValidation: async (id) => {
    const token = authAPI.getToken();
    const response = await fetch(`${API_BASE_URL}/incidents/${id}/validate/ngo`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to remove validation');
    }
    
    return response.json();
  },
};

// Region APIs
export const regionAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/incidents/regions`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch regions');
    }
    
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/incidents/regions/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch region');
    }
    
    return response.json();
  },

  getIncidents: async (id) => {
    const response = await fetch(`${API_BASE_URL}/incidents/regions/${id}/incidents`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch region incidents');
    }
    
    return response.json();
  },

  addComment: async (id, text) => {
    const token = authAPI.getToken();
    const response = await fetch(`${API_BASE_URL}/incidents/regions/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add comment');
    }
    
    return response.json();
  },
};
