import { useState, useEffect } from 'react';
import { X, Filter as FilterIcon, Check } from 'lucide-react';
import api from '../../services/api';
import { Project, Parameter } from '../../types';

// Helper to get hex color from color name
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

interface FilterState {
    pics: string[];
    priorities: string[];
    statuses: string[];
}

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    currentFilters?: FilterState;
    onApply: (filters: FilterState) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, projects, currentFilters, onApply }) => {
    const [filters, setFilters] = useState<FilterState>({
        pics: [],
        priorities: [],
        statuses: []
    });
    const [availableStatuses, setAvailableStatuses] = useState<Parameter[]>([]);
    const [availablePriorities, setAvailablePriorities] = useState<Parameter[]>([]);

    // Get unique PICs from projects
    const uniquePics = [...new Set(
        projects.flatMap(p =>
            p.pics ? p.pics.map(pic => pic.name) : p.pic ? [p.pic.name] : []
        )
    )].filter(Boolean);

    // Load settings from API on open
    useEffect(() => {
        const fetchParameters = async () => {
            try {
                const data = await api.getParameters();
                setAvailableStatuses(data.filter((p: Parameter) => p.category === 'status'));
                setAvailablePriorities(data.filter((p: Parameter) => p.category === 'priority'));
            } catch (error) {
                console.error('Failed to fetch parameters:', error);
            }
        };

        if (isOpen) {
            fetchParameters();
            if (currentFilters) {
                setFilters(currentFilters);
            }
        }
    }, [isOpen, currentFilters]);

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const toggleFilter = (type: keyof FilterState, value: string) => {
        setFilters(prev => {
            const current = prev[type];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [type]: updated };
        });
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        const emptyFilters = { pics: [], priorities: [], statuses: [] };
        setFilters(emptyFilters);
        onApply(emptyFilters);
        onClose();
    };

    const hasActiveFilters = filters.pics.length > 0 || filters.priorities.length > 0 || filters.statuses.length > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-md max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
                {/* Header */}
                <div className="bg-[#1e293b]/30 p-5 border-b border-[#1e293b] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#26b9f7]/20 flex items-center justify-center text-[#26b9f7]">
                            <FilterIcon size={22} />
                        </div>
                        <div>
                            <h3 className="text-white text-sm font-black uppercase tracking-widest">
                                Filter Proyek
                            </h3>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">
                                Filter berdasarkan PIC, Priority, Status
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#1e293b] rounded-lg text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                    {/* PIC Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                            PIC
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {uniquePics.length > 0 ? (uniquePics as string[]).map(pic => (
                                <button
                                    key={pic}
                                    onClick={() => toggleFilter('pics', pic)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1.5 ${filters.pics.includes(pic)
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-[#020617] border border-[#1e293b] text-slate-400 hover:border-purple-500/50'
                                        }`}
                                >
                                    {filters.pics.includes(pic) && <Check size={12} />}
                                    {pic}
                                </button>
                            )) : (
                                <span className="text-[10px] text-slate-600 italic">Tidak ada PIC tersedia</span>
                            )}
                        </div>
                    </div>

                    {/* Priority Filter - from settings */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                            Priority
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availablePriorities.map(priority => {
                                const isSelected = filters.priorities.includes(priority.label);
                                return (
                                    <button
                                        key={priority.id}
                                        onClick={() => toggleFilter('priorities', priority.label)}
                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1.5"
                                        style={{
                                            backgroundColor: isSelected ? getColorHex(priority.color) : '#020617',
                                            color: isSelected ? 'white' : '#94a3b8',
                                            border: isSelected ? 'none' : '1px solid #1e293b'
                                        }}
                                    >
                                        {isSelected && <Check size={12} />}
                                        {priority.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status Filter - from settings */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                            Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableStatuses.map(status => {
                                const isSelected = filters.statuses.includes(status.label);
                                return (
                                    <button
                                        key={status.id}
                                        onClick={() => toggleFilter('statuses', status.label)}
                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1.5"
                                        style={{
                                            backgroundColor: isSelected ? getColorHex(status.color) : '#020617',
                                            color: isSelected ? 'white' : '#94a3b8',
                                            border: isSelected ? 'none' : '1px solid #1e293b'
                                        }}
                                    >
                                        {isSelected && <Check size={12} />}
                                        {status.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#1e293b] flex gap-3 shrink-0">
                    <button
                        onClick={handleReset}
                        className="flex-1 h-11 bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#334155] transition-colors"
                        disabled={!hasActiveFilters}
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 h-11 bg-[#26b9f7] text-[#020617] text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
                    >
                        Terapkan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;
