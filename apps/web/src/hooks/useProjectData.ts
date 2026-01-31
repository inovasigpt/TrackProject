import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import type { Project, Message, Parameter } from '../types';

/**
 * Custom hook for persisting projects, messages, and parameters via API
 * Replaces the old useLocalStorage hook.
 */
export const useProjectData = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data fetching function
    const fetchData = useCallback(async () => {
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

            // Fetch parameters
            const paramsData = await api.getParameters();
            if (Array.isArray(paramsData)) {
                setParameters(paramsData);
            }

        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Gagal memuat data dari server');
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        // Only fetch if authenticated (token exists)
        if (api.getToken()) {
            fetchData();
        } else {
            setIsLoaded(true);
        }
    }, [fetchData]);

    // Derived state for parameters
    const statuses = useMemo(() => parameters.filter(p => p.category === 'status'), [parameters]);
    const priorities = useMemo(() => parameters.filter(p => p.category === 'priority'), [parameters]);
    const phases = useMemo(() => parameters.filter(p => p.category === 'phase'), [parameters]);
    const streams = useMemo(() => parameters.filter(p => p.category === 'stream'), [parameters]);

    const addProject = useCallback(async (projectData: any) => {
        try {
            const response = await api.createProject(projectData);
            if (response.success && response.data) {
                setProjects(prev => [...prev, response.data]);
                return { success: true, data: response.data };
            }
            const msg = 'Gagal membuat proyek';
            setError(msg);
            return { success: false, error: msg };
        } catch (err: any) {
            console.error('Add project error:', err);
            const msg = err.message || 'Terjadi kesalahan saat membuat proyek';
            setError(msg);
            return { success: false, error: msg };
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
            const msg = 'Gagal memperbarui proyek';
            setError(msg);
            return { success: false, error: msg };
        } catch (err: any) {
            console.error('Update project error:', err);
            const msg = err.message || 'Terjadi kesalahan saat memperbarui proyek';
            setError(msg);
            return { success: false, error: msg };
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
                                phases: p.phases?.map((phase: any) =>
                                    phase.id === phaseId ? response.data : phase
                                ) || []
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
        parameters,
        statuses,
        priorities,
        phases,
        streams,
        unreadCount,
        isLoaded,
        error,
        addProject,
        updateProject,
        updatePhase,
        deleteProject,
        markMessageAsRead,
        refreshProjects: fetchData,
    };
};
