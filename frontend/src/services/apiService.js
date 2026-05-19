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
    const token = localStorage.getItem('admin_token') || localStorage.getItem('doctor_token');
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
        const data = response.data.data || [];
        return data.map(specialist => {
            if (specialist.sessions) {
                specialist.sessions = specialist.sessions.map(sess => {
                    let day = sess.day_of_week;
                    if (!day && sess.session_date) {
                        try {
                            const dObj = new Date(sess.session_date);
                            if (!isNaN(dObj.getTime())) {
                                day = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dObj);
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    return {
                        ...sess,
                        day_of_week: day || 'Session'
                    };
                });
            }
            return specialist;
        });
    },
    getSpecialistDetails: async (id) => {
        const response = await api.get(`/specialists/${id}`);
        const specialist = response.data.data;
        if (specialist && specialist.sessions) {
            specialist.sessions = specialist.sessions.map(sess => {
                let day = sess.day_of_week;
                if (!day && sess.session_date) {
                    try {
                        const dObj = new Date(sess.session_date);
                        if (!isNaN(dObj.getTime())) {
                            day = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dObj);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
                return {
                    ...sess,
                    day_of_week: day || 'Session'
                };
            });
        }
        return specialist;
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
    getPayHereHash: async (appointmentId, amount) => {
        const response = await api.post('/payment/payhere-hash', { appointment_id: appointmentId, amount });
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
    checkInPatient: async (patientId, appointmentId = null) => {
        const response = await api.post(`/check-in/${patientId}`, { appointment_id: appointmentId });
        return response.data.data;
    },
    checkOutPatient: async (patientId, appointmentId = null) => {
        const response = await api.post(`/check-out/${patientId}`, { appointment_id: appointmentId });
        return response.data.data;
    },
    cancelAppointment: async (appointmentId) => {
        const response = await api.patch(`/cancel-appointment/${appointmentId}`);
        return response.data.data;
    },
    rescheduleAppointment: async (appointmentId, newDate, sessionId = null) => {
        const response = await api.post(`/move-appointment/${appointmentId}`, {
            new_date: newDate,
            doctor_session_id: sessionId
        });
        return response.data.data;
    },
    getSpecialistAvailability: async (specialistId, date) => {
        const response = await api.get(`/availability/${specialistId}`, { params: { date } });
        return response.data.data;
    },
    faceCheckIn: async (faceImage, patientId = null, appointmentId = null) => {
        try {
            const response = await api.post('/queue/face-check-in', { 
                face_image: faceImage, 
                patient_id: patientId,
                appointment_id: appointmentId
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Face check-in failed.' };
        }
    },
    loginPatientWithFace: async (faceImage) => {
        const response = await api.post('/patients/login-face', { face_image: faceImage });
        return response.data;
    },
    getAllQueuesStatus: async () => {
        const response = await api.get('/queue/status');
        return response.data;
    },
    getSessionsQueues: async (specialistId = null) => {
        const response = await api.get('/queue/sessions-queues', {
            params: specialistId ? { specialist_id: specialistId } : undefined
        });
        return response.data;
    },
    callNextPatient: async (sessionId) => {
        const response = await api.post(`/queue/call-next/${sessionId}`);
        return response.data;
    },
    startSession: async (sessionId) => {
        const response = await api.post(`/queue/session/${sessionId}/start`);
        return response.data;
    },
    toggleSessionPause: async (sessionId) => {
        const response = await api.post(`/queue/toggle-pause/${sessionId}`);
        return response.data;
    },
    endSession: async (sessionId) => {
        const response = await api.post(`/queue/end-session/${sessionId}`);
        return response.data;
    },
    skipPatient: async (queueId) => {
        const response = await api.post(`/queue/skip/${queueId}`);
        return response.data;
    },

    // Notifications & Alerts
    createNotification: async (data) => {
        const response = await api.post('/notifications/', data);
        return response.data.data;
    },
    getNotifications: async (patientId) => {
        const response = await api.get(`/notifications/`, { params: { patient_id: patientId } });
        return response.data.data;
    },
    markNotificationAsRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data.data;
    },

    // Reviews & Complaints
    submitReview: async (data) => {
        const response = await api.post('/reviews/', data);
        return response.data;
    },
    getAllReviews: async () => {
        const response = await api.get('/reviews/');
        return response.data;
    },
    respondToReview: async (reviewId, data) => {
        const response = await api.patch(`/reviews/${reviewId}/respond`, data);
        return response.data;
    },

    // System Health
    getSystemHealth: async (isDiagnostic = false) => {
        const response = await api.get(`/system/health${isDiagnostic ? '?diagnostic=true' : ''}`);
        return response.data.data;
    },

    // Medical Records
    getPrescriptions: async (patientId) => {
        const response = await api.get('/medical/prescriptions', { params: { patient_id: patientId } });
        return response.data.data;
    },
    getLabReports: async (patientId) => {
        const response = await api.get('/medical/lab-reports', { params: { patient_id: patientId } });
        return response.data.data;
    },
    getMedicalSummary: async (patientId) => {
        const response = await api.get(`/medical/summary/${patientId}`);
        return response.data.data;
    },
    addPrescription: async (data) => {
        const response = await api.post('/medical/prescriptions', data);
        return response.data;
    },
    addLabReport: async (data) => {
        const response = await api.post('/medical/lab-reports', data);
        return response.data;
    },

    // Doctor Portal
    getDoctorProfile: async (specialistId) => {
        const response = await api.get('/doctor/profile', { params: { specialist_id: specialistId } });
        return response.data.data;
    },
    getDoctorDashboard: async (specialistId) => {
        const response = await api.get('/doctor/dashboard', { params: { specialist_id: specialistId } });
        return response.data.data;
    },
    getDoctorSessionRequests: async (specialistId) => {
        const response = await api.get('/doctor/session-requests', { params: { specialist_id: specialistId } });
        return response.data.data;
    },
    createDoctorSessionRequest: async (specialistId, data) => {
        const response = await api.post(`/doctor/session-requests?specialist_id=${specialistId}`, data);
        return response.data.data;
    },
    getDoctorPatientRecords: async (patientId, specialistId) => {
        const response = await api.get(`/doctor/patients/${patientId}/records`, { params: { specialist_id: specialistId } });
        return response.data.data;
    },
    addDoctorPrescription: async (patientId, specialistId, data) => {
        const response = await api.post(`/doctor/patients/${patientId}/prescriptions?specialist_id=${specialistId}`, data);
        return response.data.data;
    },
    addVitalRecord: async (patientId, specialistId, data) => {
        const response = await api.post(`/doctor/patients/${patientId}/vitals?specialist_id=${specialistId}`, data);
        return response.data.data;
    },
    getDoctorQueue: async (specialistId) => {
        const response = await api.get('/doctor/queue', { params: { specialist_id: specialistId } });
        return response.data.data;
    },
    startDoctorQueueSession: async (sessionId, specialistId) => {
        const response = await api.post(`/doctor/queue/${sessionId}/start?specialist_id=${specialistId}`);
        return response.data.data;
    },
    callNextDoctorPatient: async (sessionId, specialistId) => {
        const response = await api.post(`/doctor/queue/${sessionId}/call-next?specialist_id=${specialistId}`);
        return response.data.data;
    },
    toggleDoctorQueuePause: async (sessionId, specialistId) => {
        const response = await api.post(`/doctor/queue/${sessionId}/toggle-pause?specialist_id=${specialistId}`);
        return response.data.data;
    },
    endDoctorQueueSession: async (sessionId, specialistId) => {
        const response = await api.post(`/doctor/queue/${sessionId}/end?specialist_id=${specialistId}`);
        return response.data.data;
    },
    skipDoctorQueuePatient: async (queueId, specialistId) => {
        const response = await api.post(`/doctor/queue/patients/${queueId}/skip?specialist_id=${specialistId}`);
        return response.data.data;
    },
    getAdminDoctorRequests: async (status = null) => {
        const response = await api.get('/admin/doctor-requests', {
            params: status ? { status } : undefined
        });
        return response.data.data;
    },
    reviewDoctorRequest: async (requestId, data) => {
        const response = await api.patch(`/admin/doctor-requests/${requestId}`, data);
        return response.data.data;
    },
    
    // Analytics
    getHospitalAnalytics: async () => {
        const response = await api.get('/admin/analytics/summary');
        return response.data.data;
    }
};

export default apiService;
