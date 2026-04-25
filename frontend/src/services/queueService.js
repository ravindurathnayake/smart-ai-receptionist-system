import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/queue';

const queueService = {
    checkIn: async (patientId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/check-in`, { patient_id: patientId });
            return response.data;
        } catch (error) {
            console.error('Error in express check-in:', error);
            throw error.response?.data || error.message;
        }
    },

    manualCheckIn: async (identifier) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/manual-check-in`, { identifier });
            return response.data;
        } catch (error) {
            console.error('Error in manual check-in:', error);
            throw error.response?.data || error.message;
        }
    },

    checkOut: async (patientId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/check-out`, { patient_id: patientId });
            return response.data;
        } catch (error) {
            console.error('Error in check-out:', error);
            throw error.response?.data || error.message;
        }
    }
};

export default queueService;
