import { useMemo, useState, useEffect } from 'react';
import {
    X, Calendar, Clock,
    Database, Folder, Box, Cpu, Globe, Server, Shield, Zap, Cloud, Code
} from 'lucide-react';
import { TODAY } from '../../data/constants';
import api from '../../services/api';
import { Project, Parameter } from '../../types';

const ICON_MAP: Record<string, any> = {
    database: Database, folder: Folder, box: Box, cpu: Cpu, globe: Globe,
    server: Server, shield: Shield, zap: Zap, cloud: Cloud, code: Code,
};

// Helper to get hex color/class from color name (or return default style)
const getColorClasses = (colorName: string) => {
    // Default fallback
    if (!colorName) return 'border-slate-500/50 text-slate-400 bg-slate-500/10';

    return `border-${colorName}-500/50 text-${colorName}-400 bg-${colorName}-500/10`;
};

interface DailyOverviewSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
}

interface ProjectWithPhase extends Project {
    todayPhase?: any; // Avoiding circular dependency or complex import issues, casting explicitly
}

const DailyOverviewSlideOver: React.FC<DailyOverviewSlideOverProps> = ({ isOpen, onClose, projects }) => {
    const [phases, setPhases] = useState<Parameter[]>([]);
    const [statuses, setStatuses] = useState<Parameter[]>([]);
    const [priorities, setPriorities] = useState<Parameter[]>([]);

    useEffect(() => {
        const fetchParameters = async () => {
            if (isOpen) {
                try {
                    const data = await api.getParameters();
                    setPhases(data.filter((p: Parameter) => p.category === 'phase'));
                    setStatuses(data.filter((p: Parameter) => p.category === 'status'));
                    setPriorities(data.filter((p: Parameter) => p.category === 'priority'));
                } catch (error) {
                    console.error('Failed to fetch params:', error);
                }
            }
        };
        fetchParameters();
    }, [isOpen]);

    // Helpers using fetched data
    const getPhaseLabel = (phaseId: string) => phases.find(p => p.id === phaseId)?.label || phaseId;
    const getPhaseColor = (phaseId: string) => phases.find(p => p.id === phaseId)?.color || 'slate';

    const getStatusStyle = (statusLabel: string) => {
        const found = statuses.find(s => s.label === statusLabel);
        return getColorClasses(found?.color || 'slate');
    };

    const getPriorityStyle = (priorityLabel: string) => {
        const found = priorities.find(p => p.label === priorityLabel);
        return getColorClasses(found?.color || 'slate');
    };

    // Get today's date formatted
    const todayFormatted = useMemo(() => {
        return TODAY.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }, []);

    // Calculate today's active phase for each project
    const projectsWithTodayPhase = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return projects.map(project => {
            const todayPhase = project.phases?.find(phase => {
                const start = new Date(phase.startDate);
                const end = new Date(phase.endDate);
                if (!start || !end) return false;
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                return today >= start && today <= end;
            });

            return {
                ...project,
                todayPhase
            };
        }).filter(p => p.todayPhase); // Only keep projects with active phase today
    }, [projects]);

    return (
        <aside
            className={`
                bg-[#0f172a]/95 backdrop-blur-xl border-l border-[#1e293b] 
                flex flex-col shrink-0 z-50 transition-all duration-300 
                fixed top-16 bottom-0 right-0 
                ${isOpen ? 'w-80' : 'w-0 opacity-0 pointer-events-none'}
            `}
        >
            {/* Header */}
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#26b9f7]" />
                    <div>
                        <h3 className="text-white text-[10px] font-black uppercase tracking-widest">
                            Ringkasan Hari Ini
                        </h3>
                        <p className="text-[8px] text-slate-500 font-medium">
                            {todayFormatted}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* Projects Section */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={12} className="text-[#26b9f7]" />
                        <h4 className="text-[9px] font-black text-[#26b9f7] uppercase tracking-widest">
                            Status Proyek ({projects.length})
                        </h4>
                    </div>

                    {projectsWithTodayPhase.length === 0 ? (
                        <p className="text-center text-slate-600 text-[10px] py-4">
                            Tidak ada proyek aktif
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {(projectsWithTodayPhase as ProjectWithPhase[]).map(project => {
                                const ProjectIcon = ICON_MAP[project.icon || 'database'] || Database;
                                const phaseColor = project.todayPhase
                                    ? getPhaseColor(project.todayPhase.id)
                                    : 'slate';

                                return (
                                    <div
                                        key={project.id}
                                        className="p-3 bg-[#020617]/60 rounded-lg border border-[#1e293b]"
                                    >
                                        <div className="flex items-start gap-2 mb-2">
                                            <div className="h-7 w-7 rounded bg-[#1e293b] flex items-center justify-center text-[#26b9f7] shrink-0">
                                                <ProjectIcon size={14} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white text-[10px] font-black uppercase tracking-tight truncate">
                                                    {project.name}
                                                </p>
                                                <p className="text-[#26b9f7] text-[8px] font-mono tracking-wider">
                                                    {project.code}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className={`text-[7px] font-black px-1 py-0.5 rounded border ${getPriorityStyle(project.priority || 'Medium')}`}>
                                                {(project.priority || 'Medium').toUpperCase()}
                                            </span>
                                            <span className={`text-[7px] font-black px-1 py-0.5 rounded border ${getStatusStyle(project.status)}`}>
                                                {project.status?.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Today's Phase */}
                                        {project.todayPhase ? (
                                            <div className="pt-2 border-t border-[#1e293b]">
                                                <div className="flex items-center justify-between mb-1">
                                                    {project.todayPhase.name}
                                                    <span className="text-[8px] font-mono text-slate-400">
                                                        {project.todayPhase.progress}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1 bg-[#1e293b] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full bg-${phaseColor}-500`}
                                                        style={{ width: `${project.todayPhase.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pt-2 border-t border-[#1e293b]">
                                                <p className="text-[8px] text-slate-600 italic">
                                                    Tidak ada fase aktif hari ini
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default DailyOverviewSlideOver;
