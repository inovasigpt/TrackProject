// Default admin and sample users for the PMO system
export const INITIAL_USERS = [
    {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@trackproject.com',
        password: 'admin123',
        role: 'admin',
        status: 'approved',
        avatar: 'https://i.pravatar.cc/100?u=admin',
        createdAt: '2024-01-01T00:00:00.000Z'
    }
];

// Default role options (can be customized by admin)
export const INITIAL_ROLES = [
    { id: 'role-1', value: 'user', label: 'User', isActive: true },
    { id: 'role-2', value: 'project_manager', label: 'Project Manager', isActive: true },
    { id: 'role-3', value: 'admin', label: 'Administrator', isActive: false } // Admin role disabled by default for registration
];

// Status definitions
export const USER_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    INACTIVE: 'inactive'
};

// Legacy export for backward compatibility
export const USER_ROLES = INITIAL_ROLES.filter(r => r.isActive).map(r => ({ value: r.value, label: r.label }));
