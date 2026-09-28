import axios from 'axios';
import { properties } from '../Properties/Properties';

const promptApi = axios.create({
    baseURL: properties.Port,
    headers: {
        'Content-Type': 'application/json'
    }
});

promptApi.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('jwtToken');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

const endpoints = {
    schemaPrompts: {
        getAll: 'api/prompts/getall',
        create: 'api/prompts/createPrompt',
        update: (id) => `api/prompts/updatePrompt/${id}`,
        delete: (id) => `api/prompts/deletePrompt/${id}`
    },
    mainPrompts: {
        getAll: 'api/mainprompt/getall',
        create: 'api/mainprompt/create',
        update: (id) => `api/mainprompt/update/${id}`,
        delete: (id) => `api/mainprompt/delete/${id}`
    }
};

export const promptManagementApi = {
    getSchemaPrompts: async () => {
        const response = await promptApi.get(endpoints.schemaPrompts.getAll);
        return response.data;
    },

    createSchemaPrompt: async (payload) => {
        const response = await promptApi.post(endpoints.schemaPrompts.create, payload);
        return response.data;
    },

    updateSchemaPrompt: async (id, payload) => {
        const response = await promptApi.put(endpoints.schemaPrompts.update(id), payload);
        return response.data;
    },

    deleteSchemaPrompt: async (id) => {
        const response = await promptApi.delete(endpoints.schemaPrompts.delete(id));
        return response.data;
    },

    getMainPrompts: async () => {
        const response = await promptApi.get(endpoints.mainPrompts.getAll);
        return response.data;
    },

    createMainPrompt: async (payload) => {
        const response = await promptApi.post(endpoints.mainPrompts.create, payload);
        return response.data;
    },

    updateMainPrompt: async (id, payload) => {
        const response = await promptApi.put(endpoints.mainPrompts.update(id), payload);
        return response.data;
    },

    deleteMainPrompt: async (id) => {
        const response = await promptApi.delete(endpoints.mainPrompts.delete(id));
        return response.data;
    }
};

export default promptManagementApi;
