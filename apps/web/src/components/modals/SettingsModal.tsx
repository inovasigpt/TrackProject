import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Users, Layers, Flag, AlertTriangle, Plus, Trash2, Loader2, Activity } from 'lucide-react';
import { api } from '../../services/api';
import ConfirmModal from './ConfirmModal';

interface SettingsItem {
    id: string;
    label: string;
    color: string;
    value?: string;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    // We no longer rely on passing data back via props, as we use the API directly.
    // However, if the parent needs to know about updates, we can keep using onSave or add a specific onUpdate callback.
    onSave: (data: any) => void;
}

const AVAILABLE_COLORS = ['emerald', 'blue', 'indigo', 'amber', 'rose', 'purple', 'cyan', 'pink', 'teal', 'orange', 'slate'];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('roles');

    // State for items (stored as SettingsItem objects with IDs)
    const [picRoles, setPicRoles] = useState<SettingsItem[]>([]);
    const [phases, setPhases] = useState<SettingsItem[]>([]);
    const [statuses, setStatuses] = useState<SettingsItem[]>([]);
    const [priorities, setPriorities] = useState<SettingsItem[]>([]);
    const [streams, setStreams] = useState<SettingsItem[]>([]);

    // State for new items
    const [newRole, setNewRole] = useState('');
    const [newPhase, setNewPhase] = useState<SettingsItem>({ id: '', label: '', color: 'blue' });
    const [newStatus, setNewStatus] = useState<SettingsItem>({ id: '', label: '', color: 'blue' });
    const [newPriority, setNewPriority] = useState<SettingsItem>({ id: '', label: '', color: 'amber' });
    const [newStream, setNewStream] = useState<SettingsItem>({ id: '', label: '', color: 'cyan' });

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Confirmation State
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'role' | 'phase' | 'status' | 'priority' | 'stream'; name: string } | null>(null);

    // Load from API on open
    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const [phasesRes, statusesRes, prioritiesRes, rolesRes, streamsRes] = await Promise.all([
                api.getParameters('phase'),
                api.getParameters('status'),
                api.getParameters('priority'),
                api.getParameters('role'),
                api.getParameters('stream')
            ]);

            if (phasesRes) setPhases(phasesRes.map((p: any) => ({
                id: p.id,
                label: p.label,
                value: p.value,
                color: p.color || 'blue'
            })));

            if (statusesRes) setStatuses(statusesRes.map((p: any) => ({
                id: p.id,
                label: p.label,
                value: p.value,
                color: p.color || 'slate'
            })));

            if (prioritiesRes) setPriorities(prioritiesRes.map((p: any) => ({
                id: p.id,
                label: p.label,
                value: p.value,
                color: p.color || 'emerald'
            })));

            if (rolesRes) {
                setPicRoles(rolesRes.map((p: any) => ({
                    id: p.id,
                    label: p.label,
                    value: p.value,
                    color: p.color || 'purple' // Default color if not present
                })));
            }

            if (streamsRes) {
                setStreams(streamsRes.map((p: any) => ({
                    id: p.id,
                    label: p.label,
                    value: p.value,
                    color: p.color || 'cyan'
                })));
            }


        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (confirmDelete) {
                    setConfirmDelete(null);
                } else if (isOpen) {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, confirmDelete]);

    // ---- Role Handlers ----
    const handleAddRole = async () => {
        if (!newRole.trim()) return;
        setIsSaving(true);
        try {
            const label = newRole.trim();
            // Simple value generation
            const value = label;

            const newRes = await api.createParameter({
                category: 'role',
                label: label,
                value: value,
                color: 'purple'
            });

            if (newRes) {
                setPicRoles([...picRoles, {
                    id: newRes.id,
                    label: newRes.label,
                    value: newRes.value,
                    color: newRes.color
                }]);
                setNewRole('');
            }
        } catch (error) {
            console.error('Failed to add role:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (id: string, type: 'role' | 'phase' | 'status' | 'priority' | 'stream', name: string) => {
        setConfirmDelete({ id, type, name });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;

        const { id, type } = confirmDelete;
        setIsSaving(true);
        try {
            await api.deleteParameter(id);

            switch (type) {
                case 'role':
                    setPicRoles(picRoles.filter(r => r.id !== id));
                    break;
                case 'phase':
                    setPhases(phases.filter(p => p.id !== id));
                    break;
                case 'status':
                    setStatuses(statuses.filter(s => s.id !== id));
                    break;
                case 'priority':
                    setPriorities(priorities.filter(p => p.id !== id));
                    break;
                case 'stream':
                    setStreams(streams.filter(s => s.id !== id));
                    break;
            }
        } catch (error) {
            console.error(`Failed to delete ${type}:`, error);
        } finally {
            setIsSaving(false);
            setConfirmDelete(null);
        }
    };

    // ---- Phase Handlers ----
    const handleAddPhase = async () => {
        if (!newPhase.label.trim()) return;
        setIsSaving(true);
        try {
            const label = newPhase.label.trim();
            const value = label.toLowerCase().replace(/\s+/g, '_');

            const newRes = await api.createParameter({
                category: 'phase',
                label: label,
                value: value,
                color: newPhase.color || 'blue'
            });

            if (newRes) {
                setPhases([...phases, {
                    id: newRes.id,
                    label: newRes.label,
                    value: newRes.value,
                    color: newRes.color
                }]);
                setNewPhase({ id: '', label: '', color: 'blue' });
            }
        } catch (error) {
            console.error('Failed to add phase:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // ---- Status Handlers ----
    const handleAddStatus = async () => {
        if (!newStatus.label.trim()) return;
        setIsSaving(true);
        try {
            const label = newStatus.label.trim();
            const value = label; // Status usually matches label in this app so far

            const newRes = await api.createParameter({
                category: 'status',
                label: label,
                value: value,
                color: newStatus.color || 'blue'
            });

            if (newRes) {
                setStatuses([...statuses, {
                    id: newRes.id,
                    label: newRes.label,
                    value: newRes.value,
                    color: newRes.color
                }]);
                setNewStatus({ id: '', label: '', color: 'blue' });
            }
        } catch (error) {
            console.error('Failed to add status:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // ---- Priority Handlers ----
    const handleAddPriority = async () => {
        if (!newPriority.label.trim()) return;
        setIsSaving(true);
        try {
            const label = newPriority.label.trim();
            const value = label;

            const newRes = await api.createParameter({
                category: 'priority',
                label: label,
                value: value,
                color: newPriority.color || 'amber'
            });

            if (newRes) {
                setPriorities([...priorities, {
                    id: newRes.id,
                    label: newRes.label,
                    value: newRes.value,
                    color: newRes.color
                }]);
                setNewPriority({ id: '', label: '', color: 'amber' });
            }
        } catch (error) {
            console.error('Failed to add priority:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // ---- Stream Handlers ----
    const handleAddStream = async () => {
        if (!newStream.label.trim()) return;
        setIsSaving(true);
        try {
            const label = newStream.label.trim();
            const value = label;

            const newRes = await api.createParameter({
                category: 'stream',
                label: label,
                value: value,
                color: newStream.color || 'cyan'
            });

            if (newRes) {
                setStreams([...streams, {
                    id: newRes.id,
                    label: newRes.label,
                    value: newRes.value,
                    color: newRes.color
                }]);
                setNewStream({ id: '', label: '', color: 'cyan' });
            }
        } catch (error) {
            console.error('Failed to add stream:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        // Since we save immediately on add/delete, this might just be "Close"
        // But if we want to trigger a refresh in parent, we can call onSave
        onSave({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
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
                        <button
                            onClick={() => setActiveTab('streams')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'streams'
                                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Activity size={12} /> Stream
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                <Loader2 size={24} className="text-[#26b9f7] animate-spin" />
                            </div>
                        )}

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
                                        disabled={isSaving}
                                    />
                                    <button
                                        onClick={handleAddRole}
                                        disabled={!newRole.trim() || isSaving}
                                        className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-500/30 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Tambah
                                    </button>
                                </div>

                                {/* Roles List */}
                                <div className="space-y-2">
                                    {picRoles.map((role) => (
                                        <div
                                            key={role.id}
                                            className="flex items-center justify-between p-3 bg-[#020617]/50 border border-[#1e293b] rounded-lg"
                                        >
                                            <span className="text-white text-sm">{role.label}</span>
                                            <button
                                                onClick={() => handleDeleteClick(role.id, 'role', role.label)}
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
                                        disabled={isSaving}
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
                                        disabled={!newPhase.label.trim() || isSaving}
                                        className="px-3 py-2 bg-[#26b9f7]/20 text-[#26b9f7] rounded-lg text-xs font-bold hover:bg-[#26b9f7]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
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
                                                <div className="flex flex-col">
                                                    <span className="text-white text-sm">{phase.label}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteClick(phase.id, 'phase', phase.label)}
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
                                        disabled={isSaving}
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
                                        disabled={!newStatus.label.trim() || isSaving}
                                        className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
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
                                                onClick={() => handleDeleteClick(status.id, 'status', status.label)}
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
                                        disabled={isSaving}
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
                                        disabled={!newPriority.label.trim() || isSaving}
                                        className="px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
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
                                                onClick={() => handleDeleteClick(priority.id, 'priority', priority.label)}
                                                className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'streams' && (
                            <div className="space-y-4">
                                {/* Add Stream */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nama stream..."
                                        value={newStream.label}
                                        onChange={(e) => setNewStream({ ...newStream, label: e.target.value })}
                                        className="flex-1 bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-700"
                                        disabled={isSaving}
                                    />
                                    <div className="flex gap-1">
                                        {AVAILABLE_COLORS.slice(0, 6).map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewStream({ ...newStream, color })}
                                                className={`w-7 h-7 rounded-lg transition-all ${newStream.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a]' : ''}`}
                                                style={{ backgroundColor: getColorHex(color) }}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleAddStream}
                                        disabled={!newStream.label.trim() || isSaving}
                                        className="px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    </button>
                                </div>

                                {/* Streams List */}
                                <div className="space-y-2">
                                    {streams.map((stream) => (
                                        <div
                                            key={stream.id}
                                            className="flex items-center justify-between p-3 bg-[#020617]/50 border border-[#1e293b] rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: getColorHex(stream.color) }}
                                                />
                                                <span className="text-white text-sm">{stream.label}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteClick(stream.id, 'stream', stream.label)}
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
                            onClick={handleSave}
                            className="flex-1 h-11 bg-[#26b9f7] text-[#020617] text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Data"
                message={`Apakah Anda yakin ingin menghapus ${confirmDelete?.type === 'role' ? 'Role' : confirmDelete?.type === 'phase' ? 'Fase' : confirmDelete?.type === 'status' ? 'Status' : confirmDelete?.type === 'stream' ? 'Stream' : 'Priority'} "${confirmDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="warning"
            />
        </>
    );
};

// Helper to get hex color
function getColorHex(colorName: string): string {
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
}

export default SettingsModal;
