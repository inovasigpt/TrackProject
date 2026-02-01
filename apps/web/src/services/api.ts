const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiOptions {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        // Load token from localStorage on init
        this.token = localStorage.getItem('pmo-token');
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('pmo-token', token);
        } else {
            localStorage.removeItem('pmo-token');
        }
    }

    getToken() {
        return this.token;
    }

    async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const config: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        if (this.token) {
            (config.headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }

    // Auth
    async login(email: string, password: string) {
        const data = await this.request<{ success: boolean; user: any; token: string }>('/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async register(userData: { username: string; email: string; password: string; role: string }) {
        return this.request<{ success: boolean; user: any; message: string }>('/auth/register', {
            method: 'POST',
            body: userData,
        });
    }

    async forgotPassword(email: string) {
        return this.request<{ success: boolean; message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: { email },
        });
    }

    async resetPassword(token: string, newPassword: string) {
        return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
            method: 'POST',
            body: { token, newPassword },
        });
    }

    logout() {
        this.setToken(null);
    }

    // Projects
    async getProjects() {
        return this.request<{ success: boolean; data: any[] }>('/projects');
    }

    async createProject(project: any) {
        return this.request<{ success: boolean; data: any }>('/projects', {
            method: 'POST',
            body: project,
        });
    }

    async updateProject(id: string, updates: any) {
        return this.request<{ success: boolean; data: any }>(`/projects/${id}`, {
            method: 'PUT',
            body: updates,
        });
    }

    async updatePhase(projectId: string, phaseId: string, updates: any) {
        return this.request<{ success: boolean; data: any }>(`/projects/${projectId}/phases/${phaseId}`, {
            method: 'PUT',
            body: updates,
        });
    }

    async deleteProject(id: string) {
        return this.request<{ success: boolean }>(`/projects/${id}`, {
            method: 'DELETE',
        });
    }

    // Users
    async getCurrentUser() {
        return this.request<{ success: boolean; data: any }>('/users/me');
    }

    async getUsers() {
        return this.request<{ success: boolean; data: any[] }>('/users/admin/list');
    }

    async updateUserStatus(id: string, status: string) {
        return this.request<{ success: boolean; data: any }>(`/users/admin/${id}/status`, {
            method: 'PUT',
            body: { status },
        });
    }

    async deleteUser(id: string) {
        return this.request<{ success: boolean }>(`/users/admin/${id}`, {
            method: 'DELETE',
        });
    }

    async getAllUsers() {
        return this.request<{ success: boolean; data: any[] }>('/users/list');
    }

    async adminCreateUser(userData: any) {
        return this.request<{ success: boolean; message: string; data: any }>('/users/admin/create', {
            method: 'POST',
            body: userData,
        });
    }

    async getRoles() {
        return this.request<{ success: boolean; data: any[] }>('/users/admin/roles');
    }

    // Messages
    async getMessages() {
        return this.request<{ success: boolean; data: any[] }>('/messages');
    }

    async markMessageAsRead(id: string) {
        return this.request<{ success: boolean; data: any }>(`/messages/${id}/read`, {
            method: 'PUT',
        });
    }

    // Parameters
    async getParameters(category?: string) {
        const query = category ? `?category=${category}` : '';
        return this.request<any[]>(`/parameters${query}`);
    }

    async createParameter(parameter: any) {
        return this.request<any>('/parameters', {
            method: 'POST',
            body: parameter,
        });
    }

    async updateParameter(id: string, updates: any) {
        return this.request<any>(`/parameters/${id}`, {
            method: 'PUT',
            body: updates,
        });
    }

    async deleteParameter(id: string) {
        return this.request<{ message: string }>(`/parameters/${id}`, {
            method: 'DELETE',
        });
    }

    // Bugs
    async getBugs() {
        return this.request<{ success: boolean; data: any[] }>('/bugs');
    }

    async createBug(bug: any) {
        return this.request<{ success: boolean; data: any }>('/bugs', {
            method: 'POST',
            body: bug,
        });
    }

    async updateBug(id: string, updates: any) {
        return this.request<{ success: boolean; data: any }>(`/bugs/${id}`, {
            method: 'PUT',
            body: updates,
        });
    }

    async deleteImage(url: string) {
        return this.request<{ success: boolean; result?: any; error?: string }>('/upload/delete', {
            method: 'POST',
            body: { url },
        });
    }

    async getAuditLogs() {
        return this.request('/audit');
    }

    async getUploadSignature() {
        return this.request<{ signature: string, timestamp: number, cloudName: string, apiKey: string }>('/upload/signature');
    }

    async deleteImage(url: string) {
        return this.request('/upload/delete', {
            method: 'POST',
            body: { url }
        });
    }
}

export const api = new ApiClient(API_URL);
export default api;
