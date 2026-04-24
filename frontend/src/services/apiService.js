import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const apiService = {
    // Auth
    login: async (username, password) => {
        const response = await api.post('/login', { username, password });
        return response.data;
    },

    // Admin Stats
    getAdminStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data.data;
    },

    // Specialists & Departments
    getSpecialists: async () => {
        const response = await api.get('/specialists/');
        return response.data.data;
    },
    getSpecialistDetails: async (id) => {
        const response = await api.get(`/specialists/${id}`);
        return response.data.data;
    },
    getDepartments: async () => {
        const response = await api.get('/departments/');
        return response.data.data;
    },
    addSpecialist: async (data) => {
        const response = await api.post('/specialists/', data);
        return response.data.data;
    },
    updateSpecialist: async (id, data) => {
        const response = await api.put(`/specialists/${id}`, data);
        return response.data.data;
    },
    deleteSpecialist: async (id) => {
        const response = await api.delete(`/specialists/${id}`);
        return response.data.data;
    },

    // Appointments
    bookAppointment: async (data) => {
        const response = await api.post('/book-appointment', data);
        return response.data.data;
    },
    getAllAppointments: async () => {
        const response = await api.get('/appointments');
        return response.data.data;
    },

    // Queue
    getQueueStatus: async () => {
        const response = await api.get('/queue-status');
        return response.data.data;
    },
    updateQueueStatus: async (id, action) => {
        const endpoint = action === 'complete' ? `/complete-queue/${id}` : `/cancel-appointment/${id}`;
        const response = await api.patch(endpoint);
        return response.data.data;
    },

    // Recommendations (Uses standard jsonify in recommend_routes.py)
    recommendSpecialist: async (message) => {
        const response = await api.post('/recommend/chat', { message });
        return response.data;
    },
    
    // AI Chat (Uses standard jsonify in chat_routes.py)
    chatAI: async (message) => {
        const response = await api.post('/chat', { message });
        return response.data;
    }
};

export default apiService;
