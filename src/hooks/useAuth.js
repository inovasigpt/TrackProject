import { useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_USERS, INITIAL_ROLES, USER_STATUS } from '../data/initialUsers';

const AUTH_STORAGE_KEY = 'pmo-auth';
const USERS_STORAGE_KEY = 'pmo-users';
const ROLES_STORAGE_KEY = 'pmo-roles';
const RESET_TOKEN_KEY = 'pmo-reset-token';

/**
 * Custom hook for managing authentication state with localStorage persistence
 */
export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [resetToken, setResetToken] = useState(null);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            // Load users
            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            if (storedUsers) {
                setUsers(JSON.parse(storedUsers));
            } else {
                setUsers(INITIAL_USERS);
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
            }

            // Load roles
            const storedRoles = localStorage.getItem(ROLES_STORAGE_KEY);
            if (storedRoles) {
                setRoles(JSON.parse(storedRoles));
            } else {
                setRoles(INITIAL_ROLES);
                localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(INITIAL_ROLES));
            }

            // Load current auth session
            const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
            if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                setCurrentUser(authData);
            }

            // Load reset token if any
            const storedToken = localStorage.getItem(RESET_TOKEN_KEY);
            if (storedToken) {
                setResetToken(JSON.parse(storedToken));
            }
        } catch (error) {
            console.error('Error loading auth from localStorage:', error);
            setUsers(INITIAL_USERS);
            setRoles(INITIAL_ROLES);
        }
        setIsLoaded(true);
    }, []);

    // Save users to localStorage whenever they change
    useEffect(() => {
        if (isLoaded && users.length > 0) {
            try {
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
            } catch (error) {
                console.error('Error saving users to localStorage:', error);
            }
        }
    }, [users, isLoaded]);

    // Save roles to localStorage whenever they change
    useEffect(() => {
        if (isLoaded && roles.length > 0) {
            try {
                localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
            } catch (error) {
                console.error('Error saving roles to localStorage:', error);
            }
        }
    }, [roles, isLoaded]);

    // Login function
    const login = useCallback((emailOrUsername, password) => {
        const user = users.find(
            u => (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password
        );

        if (!user) {
            return { success: false, error: 'Email/username atau password salah' };
        }

        if (user.status === USER_STATUS.PENDING) {
            return { success: false, error: 'Akun Anda masih menunggu persetujuan admin' };
        }

        if (user.status === USER_STATUS.REJECTED) {
            return { success: false, error: 'Akun Anda telah ditolak. Silakan hubungi admin' };
        }

        if (user.status === USER_STATUS.INACTIVE) {
            return { success: false, error: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin' };
        }

        // Set current user and persist
        setCurrentUser(user);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        return { success: true, user };
    }, [users]);

    // Logout function
    const logout = useCallback(() => {
        setCurrentUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }, []);

    // Register new user
    const register = useCallback((userData) => {
        // Check if email or username already exists
        const existingEmail = users.find(u => u.email === userData.email);
        if (existingEmail) {
            return { success: false, error: 'Email sudah terdaftar' };
        }

        const existingUsername = users.find(u => u.username === userData.username);
        if (existingUsername) {
            return { success: false, error: 'Username sudah digunakan' };
        }

        const newUser = {
            id: `user-${Date.now()}`,
            username: userData.username,
            email: userData.email,
            password: userData.password,
            role: userData.role || 'user',
            status: USER_STATUS.PENDING,
            avatar: `https://i.pravatar.cc/100?u=${userData.username}`,
            createdAt: new Date().toISOString()
        };

        setUsers(prev => [...prev, newUser]);
        return { success: true, user: newUser };
    }, [users]);

    // Update user status (for admin approval/deactivation)
    const updateUserStatus = useCallback((userId, newStatus) => {
        setUsers(prev =>
            prev.map(u => u.id === userId ? { ...u, status: newStatus } : u)
        );
    }, []);

    // Delete user (for admin)
    const deleteUser = useCallback((userId) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    }, []);

    // Toggle role active status (for admin)
    const toggleRoleActive = useCallback((roleId) => {
        setRoles(prev =>
            prev.map(r => r.id === roleId ? { ...r, isActive: !r.isActive } : r)
        );
    }, []);

    // Add new role (for admin)
    const addRole = useCallback((roleData) => {
        const existingRole = roles.find(r => r.value === roleData.value);
        if (existingRole) {
            return { success: false, error: 'Role dengan value tersebut sudah ada' };
        }

        const newRole = {
            id: `role-${Date.now()}`,
            value: roleData.value,
            label: roleData.label,
            isActive: true
        };

        setRoles(prev => [...prev, newRole]);
        return { success: true, role: newRole };
    }, [roles]);

    // Delete role (for admin)
    const deleteRole = useCallback((roleId) => {
        setRoles(prev => prev.filter(r => r.id !== roleId));
    }, []);

    // Request password reset (generates token)
    const requestPasswordReset = useCallback((email) => {
        const user = users.find(u => u.email === email);
        if (!user) {
            return { success: false, error: 'Email tidak ditemukan' };
        }

        const token = {
            userId: user.id,
            email: email,
            token: Math.random().toString(36).substring(2, 15),
            expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
        };

        setResetToken(token);
        localStorage.setItem(RESET_TOKEN_KEY, JSON.stringify(token));
        return { success: true, message: 'Link reset password telah dikirim ke email Anda' };
    }, [users]);

    // Reset password with token
    const resetPassword = useCallback((newPassword) => {
        if (!resetToken) {
            return { success: false, error: 'Token reset tidak valid' };
        }

        if (Date.now() > resetToken.expiresAt) {
            localStorage.removeItem(RESET_TOKEN_KEY);
            setResetToken(null);
            return { success: false, error: 'Token reset telah kedaluwarsa' };
        }

        // Update user password
        setUsers(prev =>
            prev.map(u => u.id === resetToken.userId ? { ...u, password: newPassword } : u)
        );

        // Clear reset token
        localStorage.removeItem(RESET_TOKEN_KEY);
        setResetToken(null);

        return { success: true, message: 'Password berhasil diubah' };
    }, [resetToken]);

    // Change password (for logged-in user)
    const changePassword = useCallback((currentPassword, newPassword) => {
        if (!currentUser) {
            return { success: false, error: 'Anda harus login terlebih dahulu' };
        }

        // Find user in users array and verify current password
        const user = users.find(u => u.id === currentUser.id);
        if (!user || user.password !== currentPassword) {
            return { success: false, error: 'Password saat ini tidak valid' };
        }

        // Update password in users array
        const updatedUser = { ...user, password: newPassword };
        setUsers(prev =>
            prev.map(u => u.id === currentUser.id ? updatedUser : u)
        );

        // Update current user session
        setCurrentUser(updatedUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));

        return { success: true, message: 'Password berhasil diubah' };
    }, [currentUser, users]);

    // Computed properties
    const isAuthenticated = useMemo(() => !!currentUser, [currentUser]);
    const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);
    const pendingUsers = useMemo(() => users.filter(u => u.status === USER_STATUS.PENDING), [users]);
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
        changePassword
    };
};
