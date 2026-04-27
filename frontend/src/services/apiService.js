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
    confirmPayment: async (data) => {
        const response = await api.post('/confirm-payment', data);
        return response.data;
    },
    getAllAppointments: async () => {
        const response = await api.get('/appointments');
        return response.data.data;
    },

    // Patients
    getPatients: async () => {
        const response = await api.get('/patients/');
        return response.data.data;
    },
    createPatient: async (data) => {
        const response = await api.post('/patients/', data);
        return response.data.data;
    },
    updatePatient: async (id, data) => {
        const response = await api.put(`/patients/${id}`, data);
        return response.data.data;
    },
    getPatientHistory: async (id) => {
        const response = await api.get(`/patients/${id}/history`);
        return response.data.data;
    },
    findPatientByNic: async (nic) => {
        const response = await api.get(`/patients/find-by-nic/${nic}`);
        return response.data;
    },
    loginByNic: async (nic) => {
        const response = await api.get(`/patients/nic-login/${nic}`);
        return response.data;
    },
    deletePatient: async (id) => {
        const response = await api.delete(`/patients/${id}`);
        return response.data.data;
    },

    // Queue
    getQueueStatus: async () => {
        const response = await api.get('/queue-status');
        return response.data.data;
    },
    getPatientQueueStatus: async (patientId) => {
        const response = await api.get(`/queue-status/patient/${patientId}`);
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
    chatAI: async (message, patientId = null) => {
        const response = await api.post('/chat', { message, patient_id: patientId });
        return response.data;
    },
    checkInPatient: async (patientId) => {
        const response = await api.post(`/check-in/${patientId}`);
        return response.data.data;
    },
    checkOutPatient: async (patientId) => {
        const response = await api.post(`/check-out/${patientId}`);
        return response.data.data;
    },
    cancelAppointment: async (appointmentId) => {
        const response = await api.patch(`/cancel-appointment/${appointmentId}`);
        return response.data.data;
    },
    rescheduleAppointment: async (appointmentId, newDate, sessionId = null) => {
        const response = await api.post(`/move-appointment/${appointmentId}`, {
            new_date: newDate,
            session_id: sessionId
        });
        return response.data.data;
    },
    faceCheckIn: async (faceImage, patientId = null) => {
        const response = await api.post('/queue/face-check-in', { face_image: faceImage, patient_id: patientId });
        return response.data;
    },
    loginPatientWithFace: async (faceImage) => {
        const response = await api.post('/patients/login-face', { face_image: faceImage });
        return response.data;
    },

    // Notifications & Alerts
    createNotification: async (data) => {
        const response = await api.post('/notifications/', data);
        return response.data.data;
    },
    getNotifications: async () => {
        const response = await api.get('/notifications/');
        return response.data.data;
    },
    markNotificationAsRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data.data;
    }
};

export default apiService;
