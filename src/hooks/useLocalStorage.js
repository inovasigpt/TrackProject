import { useState, useEffect, useMemo } from 'react';
import { INITIAL_PROJECTS } from '../data/initialProjects';
import { INITIAL_MESSAGES } from '../data/initialMessages';

const STORAGE_KEY = 'pmo-projects';
const MESSAGES_STORAGE_KEY = 'pmo-messages';

/**
 * Custom hook for persisting projects and messages to localStorage
 */
export const useLocalStorage = () => {
    const [projects, setProjects] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            // Load projects
            const storedProjects = localStorage.getItem(STORAGE_KEY);
            if (storedProjects) {
                const parsed = JSON.parse(storedProjects);
                setProjects(parsed);
            } else {
                setProjects(INITIAL_PROJECTS);
            }

            // Load messages
            const storedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
            if (storedMessages) {
                const parsed = JSON.parse(storedMessages);
                setMessages(parsed);
            } else {
                setMessages(INITIAL_MESSAGES);
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            setProjects(INITIAL_PROJECTS);
            setMessages(INITIAL_MESSAGES);
        }
        setIsLoaded(true);
    }, []);

    // Save projects to localStorage whenever they change
    useEffect(() => {
        if (isLoaded && projects.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
            } catch (error) {
                console.error('Error saving projects to localStorage:', error);
            }
        }
    }, [projects, isLoaded]);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (isLoaded && messages.length > 0) {
            try {
                localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error('Error saving messages to localStorage:', error);
            }
        }
    }, [messages, isLoaded]);

    const addProject = (project) => {
        setProjects(prev => [...prev, project]);
    };

    const updateProject = (projectId, updates) => {
        setProjects(prev =>
            prev.map(p => p.id === projectId ? { ...p, ...updates } : p)
        );
    };

    const updatePhase = (projectId, phaseId, updates) => {
        setProjects(prev =>
            prev.map(p => {
                if (p.id === projectId) {
                    return {
                        ...p,
                        phases: p.phases.map(phase =>
                            phase.id === phaseId ? { ...phase, ...updates } : phase
                        )
                    };
                }
                return p;
            })
        );
    };

    const deleteProject = (projectId) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
    };

    // Message functions
    const markMessageAsRead = (messageId) => {
        setMessages(prev =>
            prev.map(msg => msg.id === messageId ? { ...msg, isRead: true } : msg)
        );
    };

    const unreadCount = useMemo(() => {
        return messages.filter(msg => !msg.isRead).length;
    }, [messages]);

    return {
        projects,
        messages,
        unreadCount,
        isLoaded,
        addProject,
        updateProject,
        updatePhase,
        deleteProject,
        markMessageAsRead,
    };
};
