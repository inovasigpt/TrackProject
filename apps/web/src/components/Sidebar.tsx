import { useState, useEffect, useRef } from 'react';
import {
    Database, Plus, Filter, Archive,
    Folder, Box, Cpu, Globe, Server, Shield, Zap, Cloud, Code,
    ArrowUpDown, ChevronDown, LucideIcon
} from 'lucide-react';
import api from '../services/api';
import { Project, Phase } from '../types';

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
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
const getColorHex = (colorName: string) => {
    const colors: Record<string, string> = {
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

// Calculate row assignments for overlapping phases (same logic as Timeline)
const calculatePhaseRows = (phases: Phase[]) => {
    const sortedPhases = [...phases].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const rowEndDates: Date[] = [];

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

interface SidebarProps {
    projects: Project[];
    isOpen: boolean;
    onProjectClick: (project: Project) => void;
    onAddProject: () => void;
    onOpenFilter: () => void;
    onOpenArchived: () => void;
    onOpenSettings: () => void;
    hasActiveFilters?: boolean;
    sortBy?: string;
    onSortChange: (sortId: string) => void;
    scrollRef?: React.RefObject<HTMLDivElement | null>;
    statuses: any[];
    priorities: any[];
    streams: any[];
}

const Sidebar = ({
    projects,
    isOpen,
    onProjectClick,
    onAddProject,
    onOpenFilter,
    onOpenArchived,
    hasActiveFilters = false,
    sortBy = 'code_asc',
    onSortChange,
    scrollRef,
    statuses,
    priorities,
    streams
}: SidebarProps) => {
    const BAR_HEIGHT = 36;
    const ROW_PADDING = 12;
    const BASE_TOP_OFFSET = 10;



    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    const SORT_OPTIONS = [
        { id: 'code_asc', label: 'Code A-Z' },
        { id: 'code_desc', label: 'Code Z-A' },
        { id: 'priority_high', label: 'Priority High-Low' },
        { id: 'priority_low', label: 'Priority Low-High' },
        { id: 'status', label: 'Status' },
        { id: 'stream', label: 'Stream' },
    ];

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setShowSortDropdown(false);
            }
        };
        if (showSortDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSortDropdown]);

    // Get style for status based on settings
    const getStatusStyle = (statusLabel: string) => {
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
    const getPriorityStyle = (priorityLabel: string) => {
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

    // Get style for stream based on settings
    const getStreamStyle = (streamLabel: string) => {
        const stream = streams.find(s => s.label.toLowerCase() === streamLabel?.toLowerCase());
        if (stream) {
            return {
                borderColor: `${getColorHex(stream.color)}80`,
                color: getColorHex(stream.color),
                backgroundColor: `${getColorHex(stream.color)}1a`
            };
        }
        return {
            borderColor: '#06b6d480',
            color: '#06b6d4',
            backgroundColor: '#06b6d41a'
        };
    };

    // Calculate dynamic row height for each project to match Timeline
    const getProjectRowHeight = (phases: any[]) => {
        const totalRows = calculatePhaseRows(phases);
        return BASE_TOP_OFFSET + (totalRows * (BAR_HEIGHT + ROW_PADDING)) + ROW_PADDING;
    };

    // Get icon component for project
    const getProjectIcon = (iconId: string) => {
        const Icon = ICON_MAP[iconId as keyof typeof ICON_MAP];
        return Icon || Database;
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
            <div className="p-3 h-16 border-b border-[#1e293b] bg-[#020617]/40 flex items-center justify-between gap-2">
                {isOpen ? (
                    <>
                        {/* Left: Add Project */}
                        <button
                            onClick={onAddProject}
                            className="px-2.5 py-1.5 rounded bg-[#26b9f7]/10 text-[#26b9f7] hover:bg-[#26b9f7] hover:text-[#020617] flex items-center gap-1.5 transition-all text-[9px] font-bold uppercase tracking-wider shrink-0"
                        >
                            <Plus size={12} strokeWidth={3} />
                            Add
                        </button>

                        {/* Right: Filter & Sort */}
                        <div className="flex items-center gap-1.5">
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

                            {/* Sort Dropdown */}
                            <div className="relative" ref={sortDropdownRef}>
                                <button
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    className={`h-7 px-2 rounded flex items-center gap-1 transition-all ${sortBy !== 'code_asc'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-[#1e293b]/50 text-slate-400 hover:bg-[#1e293b] hover:text-white'
                                        }`}
                                    title="Sort"
                                >
                                    <ArrowUpDown size={12} />
                                    <span className="text-[9px] font-bold uppercase">
                                        {SORT_OPTIONS.find(o => o.id === sortBy)?.label.split(' ')[0] || 'Sort'}
                                    </span>
                                    <ChevronDown size={10} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showSortDropdown && (
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                                        {SORT_OPTIONS.map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => {
                                                    onSortChange(option.id);
                                                    setShowSortDropdown(false);
                                                }}
                                                className={`w-full px-3 py-2 text-left text-[10px] font-bold transition-colors flex items-center justify-between ${sortBy === option.id
                                                    ? 'bg-[#26b9f7]/10 text-[#26b9f7]'
                                                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'
                                                    }`}
                                            >
                                                {option.label}
                                                {sortBy === option.id && <span className="text-[#26b9f7]">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                {projects.length === 0 ? (
                    <div className="p-4 text-center">
                        <p className="text-[10px] text-slate-600 italic">Tidak ada proyek</p>
                    </div>
                ) : (
                    projects.map(project => {
                        const rowHeight = getProjectRowHeight(project.phases);
                        const ProjectIcon = getProjectIcon(project.icon || 'database');
                        const statusStyle = getStatusStyle(project.status);
                        const priorityStyle = getPriorityStyle(project.priority || 'Medium');

                        return (
                            <div
                                key={project.id}
                                className={`
                  border-b border-[#1e293b]/20
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
                                            {/* Stream Badge */}
                                            {/* Stream Badge */}
                                            {project.stream && (Array.isArray(project.stream) ? project.stream : [project.stream]).map((s, idx) => (
                                                <span
                                                    key={`${project.id}-stream-${idx}`}
                                                    className="text-[8px] font-black px-1.5 py-0.5 rounded border"
                                                    style={getStreamStyle(String(s))}
                                                >
                                                    {String(s).toUpperCase()}
                                                </span>
                                            ))}
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


            </div>
        </aside>
    );
};

export default Sidebar;
