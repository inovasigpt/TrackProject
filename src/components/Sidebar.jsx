import { useMemo, useState, useEffect } from 'react';
import {
    Database, Plus, Settings, Filter, Archive,
    Folder, Box, Cpu, Globe, Server, Shield, Zap, Cloud, Code
} from 'lucide-react';

// Icon mapping
const ICON_MAP = {
    database: Database,
    folder: Folder,
    box: Box,
    cpu: Cpu,
    globe: Globe,
    server: Server,
    shield: Shield,
    zap: Zap,
    cloud: Cloud,
    code: Code,
};

// Helper to get hex color
const getColorHex = (colorName) => {
    const colors = {
        emerald: '#10b981',
        blue: '#3b82f6',
        indigo: '#6366f1',
        amber: '#f59e0b',
        rose: '#f43f5e',
        purple: '#a855f7',
        cyan: '#06b6d4',
        pink: '#ec4899',
        teal: '#14b8a6',
        orange: '#f97316',
        slate: '#64748b',
    };
    return colors[colorName] || colors.blue;
};

// Default settings
const DEFAULT_STATUSES = [
    { id: 'pending', label: 'Pending', color: 'slate' },
    { id: 'on_progress', label: 'On Progress', color: 'blue' },
    { id: 'on_track', label: 'On Track', color: 'emerald' },
    { id: 'behind_schedule', label: 'Behind Schedule', color: 'amber' },
    { id: 'at_risk', label: 'At Risk', color: 'rose' },
    { id: 'done', label: 'Done', color: 'purple' },
];

const DEFAULT_PRIORITIES = [
    { id: 'high', label: 'High', color: 'rose' },
    { id: 'medium', label: 'Medium', color: 'amber' },
    { id: 'low', label: 'Low', color: 'emerald' },
];

// Calculate row assignments for overlapping phases (same logic as Timeline)
const calculatePhaseRows = (phases) => {
    const sortedPhases = [...phases].sort((a, b) =>
        new Date(a.startDate) - new Date(b.startDate)
    );

    const rowEndDates = [];

    sortedPhases.forEach(phase => {
        const phaseStart = new Date(phase.startDate);
        const phaseEnd = new Date(phase.endDate);

        let assignedRow = -1;
        for (let i = 0; i < rowEndDates.length; i++) {
            if (rowEndDates[i] < phaseStart) {
                assignedRow = i;
                rowEndDates[i] = phaseEnd;
                break;
            }
        }

        if (assignedRow === -1) {
            rowEndDates.push(phaseEnd);
        }
    });

    return Math.max(rowEndDates.length, 1);
};

const Sidebar = ({
    projects,
    isOpen,
    onProjectClick,
    onAddProject,
    onOpenSettings,
    onOpenFilter,
    onOpenArchived,
    hasActiveFilters = false
}) => {
    const BAR_HEIGHT = 36;
    const ROW_PADDING = 12;
    const BASE_TOP_OFFSET = 10;

    const [statuses, setStatuses] = useState([]);
    const [priorities, setPriorities] = useState([]);

    // Load settings from localStorage
    useEffect(() => {
        const savedStatuses = localStorage.getItem('pmo_statuses');
        const savedPriorities = localStorage.getItem('pmo_priorities');

        setStatuses(savedStatuses ? JSON.parse(savedStatuses) : DEFAULT_STATUSES);
        setPriorities(savedPriorities ? JSON.parse(savedPriorities) : DEFAULT_PRIORITIES);
    }, []);

    // Get style for status based on settings
    const getStatusStyle = (statusLabel) => {
        const status = statuses.find(s => s.label.toLowerCase() === statusLabel?.toLowerCase());
        if (status) {
            return {
                borderColor: `${getColorHex(status.color)}80`,
                color: getColorHex(status.color),
                backgroundColor: `${getColorHex(status.color)}1a`
            };
        }
        return {
            borderColor: '#64748b80',
            color: '#64748b',
            backgroundColor: '#64748b1a'
        };
    };

    // Get style for priority based on settings
    const getPriorityStyle = (priorityLabel) => {
        const priority = priorities.find(p => p.label.toLowerCase() === priorityLabel?.toLowerCase());
        if (priority) {
            return {
                borderColor: `${getColorHex(priority.color)}80`,
                color: getColorHex(priority.color),
                backgroundColor: `${getColorHex(priority.color)}1a`
            };
        }
        return {
            borderColor: '#3b82f680',
            color: '#3b82f6',
            backgroundColor: '#3b82f61a'
        };
    };

    // Calculate dynamic row height for each project to match Timeline
    const getProjectRowHeight = (phases) => {
        const totalRows = calculatePhaseRows(phases);
        return BASE_TOP_OFFSET + (totalRows * (BAR_HEIGHT + ROW_PADDING)) + ROW_PADDING;
    };

    // Get icon component for project
    const getProjectIcon = (iconId) => {
        return ICON_MAP[iconId] || Database;
    };

    return (
        <aside
            className={`
        bg-[#0f172a] border-r border-[#1e293b] flex flex-col shrink-0 z-40 
        transition-all duration-300 ease-in-out overflow-hidden 
        ${isOpen ? 'w-72' : 'w-20'}
      `}
        >
            {/* Header */}
            <div className="p-4 h-16 border-b border-[#1e293b] bg-[#020617]/40 flex items-center justify-between">
                {isOpen ? (
                    <>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                            Proyek
                        </h3>
                        <div className="flex items-center gap-2">
                            {/* Filter Button */}
                            <button
                                onClick={onOpenFilter}
                                className={`w-7 h-7 rounded flex items-center justify-center transition-all ${hasActiveFilters
                                    ? 'bg-[#26b9f7] text-[#020617]'
                                    : 'bg-[#1e293b]/50 text-slate-400 hover:bg-[#1e293b] hover:text-white'
                                    }`}
                                title="Filter"
                            >
                                <Filter size={14} />
                            </button>
                            {/* Add Project Button */}
                            <button
                                onClick={onAddProject}
                                className="px-3 py-1.5 rounded bg-[#26b9f7]/10 text-[#26b9f7] hover:bg-[#26b9f7] hover:text-[#020617] flex items-center gap-1.5 transition-all text-[9px] font-bold uppercase tracking-wider"
                            >
                                <Plus size={12} strokeWidth={3} />
                                Add Project
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 w-full">
                        <button
                            onClick={onAddProject}
                            className="w-10 h-10 rounded-lg bg-[#26b9f7]/10 text-[#26b9f7] hover:bg-[#26b9f7] hover:text-[#020617] flex items-center justify-center transition-all"
                            title="Add Project"
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>
                )}
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                {projects.length === 0 ? (
                    <div className="p-4 text-center">
                        <p className="text-[10px] text-slate-600 italic">Tidak ada proyek</p>
                    </div>
                ) : (
                    projects.map(project => {
                        const rowHeight = getProjectRowHeight(project.phases);
                        const ProjectIcon = getProjectIcon(project.icon);
                        const statusStyle = getStatusStyle(project.status);
                        const priorityStyle = getPriorityStyle(project.priority);

                        return (
                            <div
                                key={project.id}
                                className={`
                  border-b border-[#1e293b] 
                  hover:bg-[#020617]/30 transition-all cursor-pointer 
                  flex flex-col justify-center 
                  border-l-2 border-l-transparent hover:border-l-[#26b9f7] px-4
                `}
                                style={{ height: `${rowHeight}px` }}
                                onClick={() => onProjectClick(project)}
                            >
                                {isOpen ? (
                                    <>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 rounded bg-[#020617] border border-[#1e293b] flex items-center justify-center text-[#26b9f7] shrink-0">
                                                <ProjectIcon size={16} />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-white text-[11px] font-black uppercase tracking-tight truncate">
                                                    {project.name}
                                                </p>
                                                <p className="text-[#26b9f7] text-[9px] font-mono tracking-wider">
                                                    {project.code}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            {/* Priority Badge */}
                                            <span
                                                className="text-[8px] font-black px-1.5 py-0.5 rounded border"
                                                style={priorityStyle}
                                            >
                                                {(project.priority || 'Medium').toUpperCase()}
                                            </span>
                                            {/* Status Badge */}
                                            <span
                                                className="text-[8px] font-black px-1.5 py-0.5 rounded border"
                                                style={statusStyle}
                                            >
                                                {project.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <ProjectIcon size={16} className="text-[#26b9f7]" />
                                        <span className="text-[8px] font-mono font-bold text-[#26b9f7] text-center leading-tight max-w-[50px] truncate">
                                            {project.code}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Archive & Settings Buttons at Bottom */}
            <div className="p-3 border-t border-[#1e293b] shrink-0 space-y-2">
                <button
                    onClick={onOpenArchived}
                    className={`
                        w-full flex items-center gap-2 p-2.5 rounded-lg 
                        bg-[#020617]/50 border border-[#1e293b] 
                        text-slate-400 hover:text-white hover:border-slate-600
                        transition-all
                        ${isOpen ? 'justify-start' : 'justify-center'}
                    `}
                >
                    <Archive size={16} />
                    {isOpen && (
                        <span className="text-[10px] font-bold uppercase tracking-wider">Arsip</span>
                    )}
                </button>
                <button
                    onClick={onOpenSettings}
                    className={`
                        w-full flex items-center gap-2 p-2.5 rounded-lg 
                        bg-[#020617]/50 border border-[#1e293b] 
                        text-slate-400 hover:text-white hover:border-slate-600
                        transition-all
                        ${isOpen ? 'justify-start' : 'justify-center'}
                    `}
                >
                    <Settings size={16} />
                    {isOpen && (
                        <span className="text-[10px] font-bold uppercase tracking-wider">Pengaturan</span>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
