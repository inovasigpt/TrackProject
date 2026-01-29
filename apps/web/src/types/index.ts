// Centralized TypeScript Types for PMO Application

export interface Pic {
    name: string;
    role?: string;
    avatar?: string;
}

export interface Phase {
    id: string;
    name?: string;
    startDate: string; // ISO 8601 date string YYYY-MM-DD
    endDate: string;   // ISO 8601 date string YYYY-MM-DD
    progress: number;
}

export interface Document {
    name: string;
    url: string;
}

export interface Project {
    id: string;
    name: string;
    code: string;
    icon?: string;
    description?: string;
    priority?: string;
    status: string;
    pics?: Pic[];
    pic?: Pic; // Legacy support if needed, but prefer pics array
    phases: Phase[];
    documents?: Document[];
    notes?: string;
    archived?: boolean;
}

export interface Parameter {
    id: string;
    category: string;
    label: string;
    color: string;
}

// User & Auth Types
export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    avatar: string;
    createdAt: string;
}

export interface Role {
    label: string;
    value: string;
}

export interface AuditLog {
    id: string;
    user: string;
    action: string;
    details: string;
    timestamp: string;
}

export interface Message {
    id: string;
    from: {
        name: string;
        avatar: string;
        role: string;
    };
    subject: string;
    body: string;
    timestamp: string | number;
    isRead: boolean;
    preview: string;
}
