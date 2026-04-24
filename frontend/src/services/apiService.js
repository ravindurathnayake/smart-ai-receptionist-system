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

    // Appointments
    getSpecialists: async () => {
        const response = await api.get('/specialists');
        return response.data;
    },
    book_appointment: async (data) => {
        const response = await api.post('/book-appointment', data);
        return response.data;
    },
    getAllAppointments: async () => {
        const response = await api.get('/appointments');
        return response.data;
    },

    // Queue
    getQueueStatus: async () => {
        const response = await api.get('/queue-status');
        return response.data;
    },
    updateQueueStatus: async (id, action) => {
        // action can be 'complete' or 'cancel'
        const endpoint = action === 'complete' ? `/complete-queue/${id}` : `/cancel-appointment/${id}`;
        const response = await api.patch(endpoint);
        return response.data;
    },

    // Recommendations
    recommendSpecialist: async (message) => {
        const response = await api.post('/recommend/chat', { message });
        return response.data;
    },
    
    // AI Chat (Conversational)
    chatAI: async (message) => {
        const response = await api.post('/chat', { message });
        return response.data;
    }
};

export default apiService;
