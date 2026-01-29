// User types
export interface User {
    id: string;
    username: string;
    email: string;
    password?: string; // Only on backend
    role: string;
    status: 'pending' | 'approved' | 'rejected' | 'inactive';
    avatar: string;
    createdAt: string;
}

export interface Role {
    id: string;
    value: string;
    label: string;
    isActive: boolean;
}

// Project types
export interface Project {
    id: string;
    code: string;
    name: string;
    icon?: string;
    description?: string;
    priority: 'Low' | 'Medium' | 'High';
    status: string;
    archived: boolean;
    pics?: PIC[];
    pic?: PIC; // Legacy support
    phases: Phase[];
    documents?: Document[];
    notes?: string;
    createdAt?: string;
}

export interface PIC {
    id?: string;
    name: string;
    role?: string;
    avatar?: string;
}

export interface Document {
    name: string;
    url: string;
}

export interface Phase {
    id: string;
    name?: string;
    startDate: string;
    endDate: string;
    progress: number;
    status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

// Message types
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

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Auth types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: Omit<User, 'password'>;
    token: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    role: string;
}
