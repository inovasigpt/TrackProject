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
    priorities: string[];
    statuses: string[];
    streams: string[];
}

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    currentFilters?: FilterState;
    onApply: (filters: FilterState) => void;
    statuses: Parameter[];
    priorities: Parameter[];
    streams: Parameter[];
}

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    projects,
    currentFilters,
    onApply,
    statuses,
    priorities,
    streams
}) => {
    const [filters, setFilters] = useState<FilterState>({
        priorities: [],
        statuses: [],
        streams: []
    });



    // Sync local filters with currentFilters on open
    useEffect(() => {
        if (isOpen && currentFilters) {
            setFilters(currentFilters);
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
        const emptyFilters = { priorities: [], statuses: [], streams: [] };
        setFilters(emptyFilters);
        onApply(emptyFilters);
        onClose();
    };

    const hasActiveFilters = filters.priorities.length > 0 || filters.statuses.length > 0 || filters.streams.length > 0;

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
                                Filter berdasarkan Priority, Status, Stream
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
                    {/* Priority Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                            Priority
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {priorities.map(priority => {
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

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                            Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {statuses.map(status => {
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

                    {/* Stream Filter */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                            Stream
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {streams.map(stream => {
                                const isSelected = filters.streams.includes(stream.label);
                                return (
                                    <button
                                        key={stream.id}
                                        onClick={() => toggleFilter('streams', stream.label)}
                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1.5"
                                        style={{
                                            backgroundColor: isSelected ? getColorHex(stream.color) : '#020617',
                                            color: isSelected ? 'white' : '#94a3b8',
                                            border: isSelected ? 'none' : '1px solid #1e293b'
                                        }}
                                    >
                                        {isSelected && <Check size={12} />}
                                        {stream.label}
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
