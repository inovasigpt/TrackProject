import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import type { User, Role } from '@pmo/shared';

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [resetToken, setResetToken] = useState<any>(null); // TODO: Implement reset password via API

    // Load current user and initial data on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = api.getToken();
            if (token) {
                try {
                    const response = await api.getCurrentUser();
                    if (response.success && response.data) {
                        setCurrentUser(response.data);
                    } else {
                        // Token invalid/expired
                        api.logout();
                        setCurrentUser(null);
                    }
                } catch (error) {
                    console.error('Session check failed:', error);
                    api.logout();
                    setCurrentUser(null);
                }
            }
            setIsLoaded(true);
        };

        checkAuth();
        fetchRoles(); // Fetch roles on mount for RegisterPage
        void resetToken;
    }, [resetToken]);

    // Load users list if admin
    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchUsers();
        }
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            const response = await api.getUsers();
            if (response.success && response.data) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchRoles = async () => {
        try {
            // Fetch roles from parameters (category='role')
            const data = await api.getParameters('role');
            if (data && Array.isArray(data)) {
                // Map parameter to Role type
                const mappedRoles: Role[] = data.map((p: any) => ({
                    id: p.id,
                    value: p.value,
                    label: p.label,
                    isActive: p.isActive !== false // Default to true if undefined
                }));
                setRoles(mappedRoles);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    // Login
    const login = useCallback(async (email: string, password: string) => {
        try {
            const response = await api.login(email, password);
            if (response.success && response.user) {
                setCurrentUser(response.user);
                return { success: true, user: response.user };
            }
            return { success: false, error: (response as any).error || 'Login failed' };
        } catch (error: any) {
            return { success: false, error: error.message || 'Login error' };
        }
    }, []);

    // Logout
    const logout = useCallback(() => {
        api.logout();
        setCurrentUser(null);
        setUsers([]);
    }, []);

    // Register
    const register = useCallback(async (userData: any) => {
        try {
            const response = await api.register(userData);
            if (response.success) {
                return { success: true, user: response.user, message: response.message };
            }
            return { success: false, error: (response as any).error || 'Registration failed' };
        } catch (error: any) {
            return { success: false, error: error.message || 'Registration error' };
        }
    }, []);

    // Update user status (admin)
    const updateUserStatus = useCallback(async (userId: string, newStatus: string) => {
        try {
            const response = await api.updateUserStatus(userId, newStatus);
            if (response.success) {
                // Optimistic update
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
            }
        } catch (error) {
            console.error('Update status error:', error);
        }
    }, []);

    // Delete user (admin)
    const deleteUser = useCallback(async (userId: string) => {
        try {
            const response = await api.deleteUser(userId);
            if (response.success) {
                setUsers(prev => prev.filter(u => u.id !== userId));
            }
        } catch (error) {
            console.error('Delete user error:', error);
        }
    }, []);

    // TODO: Implement Role management API
    const toggleRoleActive = useCallback((roleId: string) => {
        // Temporary optimistic update until API endpoint exists
        setRoles(prev => prev.map(r => r.id === roleId ? { ...r, isActive: !r.isActive } : r));
    }, []);

    const addRole = useCallback((roleData: any) => {
        // Temporary
        const newRole = { id: `role-${Date.now()}`, ...roleData, isActive: true };
        setRoles(prev => [...prev, newRole]);
        return { success: true, role: newRole };
    }, []);

    const deleteRole = useCallback((roleId: string) => {
        setRoles(prev => prev.filter(r => r.id !== roleId));
    }, []);

    const requestPasswordReset = useCallback(async (email: string) => {
        try {
            const response = await api.forgotPassword(email);
            if (response.success) {
                return { success: true, message: response.message };
            }
            return { success: false, error: 'Gagal mengirim permintaan reset password' };
        } catch (error: any) {
            return { success: false, error: error.message || 'Terjadi kesalahan' };
        }
    }, []);

    const resetPassword = useCallback(async (token: string, newPassword: string) => {
        try {
            const response = await api.resetPassword(token, newPassword);
            if (response.success) {
                return { success: true, message: response.message };
            }
            return { success: false, error: 'Gagal mereset password' };
        } catch (error: any) {
            return { success: false, error: error.message || 'Terjadi kesalahan' };
        }
    }, []);

    const changePassword = useCallback((_currentPassword: string, _newPassword: string) => {
        // Placeholder - requires separate API endpoint
        return { success: false, error: 'Fitur belum tersedia' };
    }, []);

    // Computed properties
    const isAuthenticated = useMemo(() => !!currentUser, [currentUser]);
    const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);
    const pendingUsers = useMemo(() => users.filter(u => u.status === 'pending'), [users]);
    const activeRoles = useMemo(() => roles.filter(r => r.isActive), [roles]);

    return {
        currentUser,
        users,
        roles,
        activeRoles,
        isLoaded,
        isAuthenticated,
        isAdmin,
        pendingUsers,
        resetToken,
        login,
        logout,
        register,
        updateUserStatus,
        deleteUser,
        toggleRoleActive,
        addRole,
        deleteRole,
        requestPasswordReset,
        resetPassword,
        changePassword,
        refreshUsers: fetchUsers,
        setResetToken // Expose setter
    };
};
