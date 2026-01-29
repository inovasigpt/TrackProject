import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import type { Project, Message } from '@pmo/shared';

/**
 * Custom hook for persisting projects and messages via API
 * (Kept name as useLocalStorage for backward compatibility during migration)
 */
export const useLocalStorage = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch projects
                const projectsRes = await api.getProjects();
                if (projectsRes.success && projectsRes.data) {
                    setProjects(projectsRes.data);
                }

                // Fetch messages
                const messagesRes = await api.getMessages();
                if (messagesRes.success && messagesRes.data) {
                    setMessages(messagesRes.data);
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Gagal memuat data dari server');
            } finally {
                setIsLoaded(true);
            }
        };

        // Only fetch if authenticated (token exists)
        if (api.getToken()) {
            fetchData();
        } else {
            setIsLoaded(true);
        }
    }, []);

    const addProject = useCallback(async (projectData: any) => {
        try {
            const response = await api.createProject(projectData);
            if (response.success && response.data) {
                setProjects(prev => [...prev, response.data]);
                return { success: true, data: response.data };
            }
            return { success: false, error: 'Gagal membuat proyek' };
        } catch (err) {
            console.error('Add project error:', err);
            return { success: false, error: 'Terjadi kesalahan saat membuat proyek' };
        }
    }, []);

    const updateProject = useCallback(async (projectId: string, updates: any) => {
        try {
            const response = await api.updateProject(projectId, updates);
            if (response.success && response.data) {
                setProjects(prev =>
                    prev.map(p => p.id === projectId ? response.data : p)
                );
                return { success: true };
            }
        } catch (err) {
            console.error('Update project error:', err);
        }
        return { success: false };
    }, []);

    const updatePhase = useCallback(async (projectId: string, phaseId: string, updates: any) => {
        try {
            const response = await api.updatePhase(projectId, phaseId, updates);
            if (response.success && response.data) {
                setProjects(prev =>
                    prev.map(p => {
                        if (p.id === projectId) {
                            return {
                                ...p,
                                phases: p.phases.map(phase =>
                                    phase.id === phaseId ? response.data : phase
                                )
                            };
                        }
                        return p;
                    })
                );
                return { success: true };
            }
        } catch (err) {
            console.error('Update phase error:', err);
        }
        return { success: false };
    }, []);

    const deleteProject = useCallback(async (projectId: string) => {
        try {
            const response = await api.deleteProject(projectId);
            if (response.success) {
                setProjects(prev => prev.filter(p => p.id !== projectId));
                return { success: true };
            }
        } catch (err) {
            console.error('Delete project error:', err);
        }
        return { success: false };
    }, []);

    // Message functions
    const markMessageAsRead = useCallback(async (messageId: string) => {
        try {
            const response = await api.markMessageAsRead(messageId);
            if (response.success) {
                setMessages(prev =>
                    prev.map(msg => msg.id === messageId ? { ...msg, isRead: true } : msg)
                );
            }
        } catch (err) {
            console.error('Mark read error:', err);
        }
    }, []);

    const unreadCount = useMemo(() => {
        return messages.filter(msg => !msg.isRead).length;
    }, [messages]);

    return {
        projects,
        messages,
        unreadCount,
        isLoaded,
        error,
        addProject,
        updateProject,
        updatePhase,
        deleteProject,
        markMessageAsRead,
    };
};
