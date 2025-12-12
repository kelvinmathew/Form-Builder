import axios from 'axios';

// Create a single axios instance with common settings
// Ensure this matches your Django URL
const apiClient = axios.create({
    baseURL: "http://127.0.0.1:8000/api", 
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor to handle errors globally (Professional Practice)
apiClient.interceptors.response.use(
    (response) => response, 
    (error) => {
        console.error("API Error:", error.response ? error.response.data : error.message);
        return Promise.reject(error);
    }
);

export const apiService = {
    // 1. Get All Entries
    fetchEntries: async () => {
        const response = await apiClient.get('/entries');
        return response.data.data; // Access the 'data' key from Django response
    },

    // 2. Create Entry (Draft)
    createEntry: async (data) => {
        // Axios automatically converts JS objects to JSON
        const response = await apiClient.post('/entries', { ...data, status: 0 });
        return response.data.data;
    },

    // 3. Update Entry
    updateEntry: async (id, data) => {
        const response = await apiClient.put(`/entries/${id}`, data);
        return response.data.data;
    },

    // 4. Delete Entry
    deleteEntry: async (id) => {
        const response = await apiClient.delete(`/entries/${id}`);
        return response.data;
    },

    // 5. Submit All Drafts
    submitAllDrafts: async () => {
        const response = await apiClient.post('/entries/submit-all');
        return response.data;
    }
};