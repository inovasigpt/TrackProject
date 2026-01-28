import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Plus, Trash2, Users, Layers, Palette, Flag, AlertTriangle } from 'lucide-react';

// Default values if localStorage is empty
const DEFAULT_PIC_ROLES = [
    'Developer',
    'Tester',
    'Business Owner',
    'Analyst',
    'Project Manager',
    'Tech Lead',
    'Designer',
];

const DEFAULT_PHASES = [
    { id: 'design', label: 'Design', color: 'emerald' },
    { id: 'dev', label: 'Development', color: 'blue' },
    { id: 'unit_test', label: 'Unit Test', color: 'indigo' },
    { id: 'sit', label: 'SIT', color: 'amber' },
    { id: 'uat', label: 'UAT', color: 'rose' },
    { id: 'implementation', label: 'Deployment', color: 'purple' },
];

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

const AVAILABLE_COLORS = ['emerald', 'blue', 'indigo', 'amber', 'rose', 'purple', 'cyan', 'pink', 'teal', 'orange', 'slate'];

const SettingsModal = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('roles');
    const [picRoles, setPicRoles] = useState([]);
    const [phases, setPhases] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [newRole, setNewRole] = useState('');
    const [newPhase, setNewPhase] = useState({ id: '', label: '', color: 'blue' });
    const [newStatus, setNewStatus] = useState({ id: '', label: '', color: 'blue' });
    const [newPriority, setNewPriority] = useState({ id: '', label: '', color: 'amber' });

    // Load from localStorage on open
    useEffect(() => {
        if (isOpen) {
            const savedRoles = localStorage.getItem('pmo_pic_roles');
            const savedPhases = localStorage.getItem('pmo_phases');
            const savedStatuses = localStorage.getItem('pmo_statuses');
            const savedPriorities = localStorage.getItem('pmo_priorities');

            setPicRoles(savedRoles ? JSON.parse(savedRoles) : DEFAULT_PIC_ROLES);
            setPhases(savedPhases ? JSON.parse(savedPhases) : DEFAULT_PHASES);
            setStatuses(savedStatuses ? JSON.parse(savedStatuses) : DEFAULT_STATUSES);
            setPriorities(savedPriorities ? JSON.parse(savedPriorities) : DEFAULT_PRIORITIES);
        }
    }, [isOpen]);

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleAddRole = () => {
        if (newRole.trim() && !picRoles.includes(newRole.trim())) {
            setPicRoles([...picRoles, newRole.trim()]);
            setNewRole('');
        }
    };

    const handleRemoveRole = (role) => {
        setPicRoles(picRoles.filter(r => r !== role));
    };

    const handleAddPhase = () => {
        if (newPhase.label.trim()) {
            const id = newPhase.label.toLowerCase().replace(/\s+/g, '_');
            if (!phases.find(p => p.id === id)) {
                setPhases([...phases, { ...newPhase, id }]);
                setNewPhase({ id: '', label: '', color: 'blue' });
            }
        }
    };

    const handleRemovePhase = (phaseId) => {
        setPhases(phases.filter(p => p.id !== phaseId));
    };

    const handleAddStatus = () => {
        if (newStatus.label.trim()) {
            const id = newStatus.label.toLowerCase().replace(/\s+/g, '_');
            if (!statuses.find(s => s.id === id)) {
                setStatuses([...statuses, { ...newStatus, id }]);
                setNewStatus({ id: '', label: '', color: 'blue' });
            }
        }
    };

    const handleRemoveStatus = (statusId) => {
        setStatuses(statuses.filter(s => s.id !== statusId));
    };

    const handleAddPriority = () => {
        if (newPriority.label.trim()) {
            const id = newPriority.label.toLowerCase().replace(/\s+/g, '_');
            if (!priorities.find(p => p.id === id)) {
                setPriorities([...priorities, { ...newPriority, id }]);
                setNewPriority({ id: '', label: '', color: 'amber' });
            }
        }
    };

    const handleRemovePriority = (priorityId) => {
        setPriorities(priorities.filter(p => p.id !== priorityId));
    };

    const handleSave = () => {
        localStorage.setItem('pmo_pic_roles', JSON.stringify(picRoles));
        localStorage.setItem('pmo_phases', JSON.stringify(phases));
        localStorage.setItem('pmo_statuses', JSON.stringify(statuses));
        localStorage.setItem('pmo_priorities', JSON.stringify(priorities));
        if (onSave) onSave({ picRoles, phases, statuses, priorities });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
                {/* Header */}
                <div className="bg-[#1e293b]/30 p-5 border-b border-[#1e293b] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center text-slate-400">
                            <SettingsIcon size={22} />
                        </div>
                        <div>
                            <h3 className="text-white text-sm font-black uppercase tracking-widest">
                                Pengaturan
                            </h3>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">
                                Role, Fase, Status, Priority
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

                {/* Tabs */}
                <div className="flex border-b border-[#1e293b]">
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'roles'
                            ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <Users size={12} /> Role
                    </button>
                    <button
                        onClick={() => setActiveTab('phases')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'phases'
                            ? 'text-[#26b9f7] border-b-2 border-[#26b9f7] bg-[#26b9f7]/5'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <Layers size={12} /> Fase
                    </button>
                    <button
                        onClick={() => setActiveTab('statuses')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'statuses'
                            ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <Flag size={12} /> Status
                    </button>
                    <button
                        onClick={() => setActiveTab('priorities')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'priorities'
                            ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <AlertTriangle size={12} /> Priority
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    {activeTab === 'roles' && (
                        <div className="space-y-4">
                            {/* Add Role */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Tambah role baru..."
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                                    className="flex-1 bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder:text-slate-700"
                                />
                                <button
                                    onClick={handleAddRole}
                                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-500/30 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={14} /> Tambah
                                </button>
                            </div>

                            {/* Roles List */}
                            <div className="space-y-2">
                                {picRoles.map((role, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-[#020617]/50 border border-[#1e293b] rounded-lg"
                                    >
                                        <span className="text-white text-sm">{role}</span>
                                        <button
                                            onClick={() => handleRemoveRole(role)}
                                            className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'phases' && (
                        <div className="space-y-4">
                            {/* Add Phase */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nama fase..."
                                    value={newPhase.label}
                                    onChange={(e) => setNewPhase({ ...newPhase, label: e.target.value })}
                                    className="flex-1 bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#26b9f7]/50 placeholder:text-slate-700"
                                />
                                <div className="flex gap-1">
                                    {AVAILABLE_COLORS.slice(0, 6).map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewPhase({ ...newPhase, color })}
                                            className={`w-7 h-7 rounded-lg transition-all ${newPhase.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a]' : ''}`}
                                            style={{ backgroundColor: getColorHex(color) }}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddPhase}
                                    className="px-3 py-2 bg-[#26b9f7]/20 text-[#26b9f7] rounded-lg text-xs font-bold hover:bg-[#26b9f7]/30 transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {/* Phases List */}
                            <div className="space-y-2">
                                {phases.map((phase) => (
                                    <div
                                        key={phase.id}
                                        className="flex items-center justify-between p-3 bg-[#020617]/50 border border-[#1e293b] rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: getColorHex(phase.color) }}
                                            />
                                            <span className="text-white text-sm">{phase.label}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemovePhase(phase.id)}
                                            className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'statuses' && (
                        <div className="space-y-4">
                            {/* Add Status */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nama status..."
                                    value={newStatus.label}
                                    onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                                    className="flex-1 bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-700"
                                />
                                <div className="flex gap-1">
                                    {AVAILABLE_COLORS.slice(0, 6).map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewStatus({ ...newStatus, color })}
                                            className={`w-7 h-7 rounded-lg transition-all ${newStatus.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a]' : ''}`}
                                            style={{ backgroundColor: getColorHex(color) }}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddStatus}
                                    className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {/* Statuses List */}
                            <div className="space-y-2">
                                {statuses.map((status) => (
                                    <div
                                        key={status.id}
                                        className="flex items-center justify-between p-3 bg-[#020617]/50 border border-[#1e293b] rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: getColorHex(status.color) }}
                                            />
                                            <span className="text-white text-sm">{status.label}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStatus(status.id)}
                                            className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'priorities' && (
                        <div className="space-y-4">
                            {/* Add Priority */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nama priority..."
                                    value={newPriority.label}
                                    onChange={(e) => setNewPriority({ ...newPriority, label: e.target.value })}
                                    className="flex-1 bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 placeholder:text-slate-700"
                                />
                                <div className="flex gap-1">
                                    {AVAILABLE_COLORS.slice(0, 6).map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewPriority({ ...newPriority, color })}
                                            className={`w-7 h-7 rounded-lg transition-all ${newPriority.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a]' : ''}`}
                                            style={{ backgroundColor: getColorHex(color) }}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddPriority}
                                    className="px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {/* Priorities List */}
                            <div className="space-y-2">
                                {priorities.map((priority) => (
                                    <div
                                        key={priority.id}
                                        className="flex items-center justify-between p-3 bg-[#020617]/50 border border-[#1e293b] rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: getColorHex(priority.color) }}
                                            />
                                            <span className="text-white text-sm">{priority.label}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemovePriority(priority.id)}
                                            className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#1e293b] flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#334155] transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 h-11 bg-[#26b9f7] text-[#020617] text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
                    >
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper to get hex color
function getColorHex(colorName) {
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
}

export default SettingsModal;
