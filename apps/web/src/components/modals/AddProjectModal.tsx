import { useState, useEffect } from 'react';
import {
    X, Briefcase, UserPlus, Calendar as CalendarIcon, Check, AlertCircle, Trash2, ChevronDown, Plus,
    Database, Folder, Box, Cpu, Globe, Server, Shield, Zap, Cloud, Code,
    FileText, StickyNote, Link as LinkIcon, Users, Layers
} from 'lucide-react';
import api from '../../services/api';
import { Project, Pic, Document } from '../../types';

interface FormPhase {
    phaseId: string;
    startDate: string;
    endDate: string;
}

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (project: Project) => void;
}

// Available icons for projects
const PROJECT_ICONS = [
    { id: 'database', icon: Database, label: 'Database' },
    { id: 'folder', icon: Folder, label: 'Folder' },
    { id: 'box', icon: Box, label: 'Box' },
    { id: 'cpu', icon: Cpu, label: 'CPU' },
    { id: 'globe', icon: Globe, label: 'Globe' },
    { id: 'server', icon: Server, label: 'Server' },
    { id: 'shield', icon: Shield, label: 'Shield' },
    { id: 'zap', icon: Zap, label: 'Zap' },
    { id: 'cloud', icon: Cloud, label: 'Cloud' },
    { id: 'code', icon: Code, label: 'Code' },
];

const TABS = [
    { id: 'info', label: 'Info', icon: Briefcase },
    { id: 'pic', label: 'PIC', icon: Users },
    { id: 'phase', label: 'Phase', icon: Layers },
    { id: 'docs', label: 'Dokumen', icon: FileText },
    { id: 'notes', label: 'Notes', icon: StickyNote },
];

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [activeTab, setActiveTab] = useState('info');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        stream: '',
        description: '',
        priority: 'Medium',
        icon: 'database',
    });

    const [pics, setPics] = useState<Pic[]>([{ name: '', role: 'Developer' }]);
    const [phases, setPhases] = useState<FormPhase[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [availablePhases, setAvailablePhases] = useState<any[]>([]);
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [availablePriorities, setAvailablePriorities] = useState<any[]>([]);
    const [availableStreams, setAvailableStreams] = useState<any[]>([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        const fetchParameters = async () => {
            try {
                const data = await api.getParameters();
                const usersData = await api.getAllUsers();
                if (usersData.success) {
                    // Filter out 'admin' role
                    setAvailableUsers(usersData.data.filter((u: any) => u.role !== 'admin'));
                }
                const fetchedPhases = data.filter((p: any) => p.category === 'phase');
                const fetchedRoles = data.filter((p: any) => p.category === 'role').map((r: any) => r.label);
                const fetchedPriorities = data.filter((p: any) => p.category === 'priority');
                const fetchedStreams = data.filter((p: any) => p.category === 'stream');

                setAvailablePhases(fetchedPhases);
                setAvailableRoles(fetchedRoles);
                setAvailablePriorities(fetchedPriorities);
                setAvailableStreams(fetchedStreams);

                // Initialize default PIC role if available
                if (fetchedRoles.length > 0) {
                    setPics(prev => prev.map(p => ({ ...p, role: p.role || fetchedRoles[0] })));
                }

            } catch (error) {
                console.error('Failed to fetch parameters:', error);
            }
        };

        if (isOpen) {
            fetchParameters();

            // Reset form
            setPhases([]);
            setDocuments([]);
            setNotes('');
            setErrors({});
            setActiveTab('info');
            setShowValidationModal(false);
            setValidationErrors([]);
            setFormData({
                name: '',
                code: '',
                stream: '',
                description: '',
                priority: 'Medium',
                icon: 'database',
            });
            // Reset PICs but keep one empty
            setPics([{ name: '', role: 'Developer' }]);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (showValidationModal) {
                    setShowValidationModal(false);
                } else {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, showValidationModal]);

    // PIC management
    const addPic = () => setPics([...pics, { name: '', role: availableRoles[0] || 'Developer' }]);
    const removePic = (index: number) => pics.length > 1 && setPics(pics.filter((_, i) => i !== index));
    const updatePic = (index: number, field: keyof Pic, value: string) => {
        const newPics = [...pics];
        if (field === 'name') {
            const selectedUser = availableUsers.find(u => u.username === value);
            if (selectedUser) {
                newPics[index] = { ...newPics[index], name: value, role: selectedUser.role || newPics[index].role, avatar: selectedUser.avatar };
            } else {
                newPics[index] = { ...newPics[index], [field]: value };
            }
        } else {
            newPics[index] = { ...newPics[index], [field]: value };
        }
        setPics(newPics);
    };

    // Phase management
    const addPhase = () => {
        const firstUnselected = availablePhases.find(p => !phases.find(ph => ph.phaseId === p.id));
        if (firstUnselected) {
            setPhases([...phases, { phaseId: firstUnselected.id, startDate: '', endDate: '' }]);
        }
    };
    const removePhase = (index: number) => setPhases(phases.filter((_, i) => i !== index));
    const updatePhase = (index: number, field: keyof FormPhase, value: string) => {
        const newPhases = [...phases];
        newPhases[index] = { ...newPhases[index], [field]: value };
        setPhases(newPhases);
        setErrors(prev => { const e = { ...prev }; delete e[`phase_${index}`]; return e; });
    };

    // Document management
    const addDocument = () => setDocuments([...documents, { name: '', url: '' }]);
    const removeDocument = (index: number) => setDocuments(documents.filter((_, i) => i !== index));
    const updateDocument = (index: number, field: keyof Document, value: string) => {
        const newDocs = [...documents];
        newDocs[index] = { ...newDocs[index], [field]: value };
        setDocuments(newDocs);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        const errorMessages: string[] = [];

        if (!formData.name.trim()) {
            newErrors.name = 'Nama proyek wajib diisi';
            errorMessages.push('Nama proyek wajib diisi');
        }
        if (!formData.code.trim()) {
            newErrors.code = 'Kode proyek wajib diisi';
            errorMessages.push('Kode proyek wajib diisi');
        }

        const validPics = pics.filter(p => p.name.trim());
        if (validPics.length === 0) {
            newErrors.pics = 'Minimal satu PIC harus diisi';
            errorMessages.push('Minimal satu PIC harus diisi');
        }

        if (phases.length === 0) {
            newErrors.phases = 'Minimal satu fase harus ditambahkan';
            errorMessages.push('Minimal satu fase harus ditambahkan');
        } else {
            phases.forEach((phase, index) => {
                const phaseLabel = availablePhases.find(p => p.id === phase.phaseId)?.label || `Fase ${index + 1}`;
                if (!phase.startDate) {
                    newErrors[`phase_${index}`] = 'Start Date wajib diisi';
                    errorMessages.push(`${phaseLabel}: Start Date wajib diisi`);
                } else if (!phase.endDate) {
                    newErrors[`phase_${index}`] = 'End Date wajib diisi';
                    errorMessages.push(`${phaseLabel}: End Date wajib diisi`);
                } else if (new Date(phase.endDate) <= new Date(phase.startDate)) {
                    newErrors[`phase_${index}`] = 'End Date harus lebih besar dari Start Date';
                    errorMessages.push(`${phaseLabel}: End Date harus > Start Date`);
                }
            });
        }

        setErrors(newErrors);

        if (errorMessages.length > 0) {
            setValidationErrors(errorMessages);
            setShowValidationModal(true);
            return;
        }

        const projectPhases = phases.map(p => ({
            name: availablePhases.find(ap => ap.id === p.phaseId)?.label || p.phaseId, // Map phaseId to name for backend
            id: p.phaseId,
            progress: 0,
            startDate: p.startDate,
            endDate: p.endDate
        }));

        const projectPics = pics.filter(p => p.name.trim()).map(p => ({
            name: p.name.trim(),
            role: p.role,
            avatar: `https://i.pravatar.cc/150?u=${p.name.trim().replace(/\s/g, '')}`
        }));

        const validDocs = documents.filter(d => d.name.trim() && d.url.trim());

        onSubmit({
            id: Date.now().toString(),
            name: formData.name,
            code: formData.code.toUpperCase(),
            stream: formData.stream,
            status: 'On Track',
            priority: formData.priority,
            description: formData.description,
            icon: formData.icon,
            pics: projectPics,
            pic: projectPics[0] || { name: 'TBD', role: 'Team Member', avatar: 'https://i.pravatar.cc/150?u=default' },
            phases: projectPhases,
            documents: validDocs,
            notes: notes,
            archived: false,
        });
    };

    if (!isOpen) return null;

    const usedPhaseIds = phases.map(p => p.phaseId);
    const remainingPhases = availablePhases.filter(p => !usedPhaseIds.includes(p.id));

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-2xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
                    {/* Header */}
                    <div className="bg-[#1e293b]/30 p-5 border-b border-[#1e293b] flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#26b9f7]/20 flex items-center justify-center text-[#26b9f7]">
                                <Briefcase size={22} />
                            </div>
                            <div>
                                <h3 className="text-white text-sm font-black uppercase tracking-widest">Tambah Proyek</h3>
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">Masukkan detail proyek</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[#1e293b] rounded-lg text-slate-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#1e293b] shrink-0 overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab.id
                                    ? 'text-[#26b9f7] border-b-2 border-[#26b9f7] bg-[#26b9f7]/5'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <tab.icon size={12} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">

                            {/* Info Tab */}
                            {activeTab === 'info' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Nama Proyek *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Core Banking Upgrade"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className={`w-full bg-[#020617] border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#26b9f7]/50 transition-all placeholder:text-slate-700 ${errors.name ? 'border-rose-500' : 'border-[#1e293b]'}`}
                                            />
                                            {errors.name && <p className="text-[9px] text-rose-400">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Kode Proyek *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. CB-2026-X"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                className={`w-full bg-[#020617] border rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#26b9f7]/50 transition-all placeholder:text-slate-700 ${errors.code ? 'border-rose-500' : 'border-[#1e293b]'}`}
                                            />
                                            {errors.code && <p className="text-[9px] text-rose-400">{errors.code}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Stream</label>
                                        <div className="relative">
                                            <select
                                                value={formData.stream}
                                                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                                                className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#26b9f7]/50 appearance-none cursor-pointer"
                                            >
                                                <option value="">Pilih Stream...</option>
                                                {availableStreams.map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Icon Proyek</label>
                                            <div className="flex flex-wrap gap-2">
                                                {PROJECT_ICONS.map(({ id, icon: Icon, label }) => (
                                                    <button
                                                        key={id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, icon: id })}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${formData.icon === id ? 'bg-[#26b9f7] text-[#020617]' : 'bg-[#020617] border border-[#1e293b] text-slate-400 hover:border-[#26b9f7]/50'
                                                            }`}
                                                        title={label}
                                                    >
                                                        <Icon size={14} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Priority</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.priority}
                                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                    className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#26b9f7]/50 appearance-none cursor-pointer"
                                                >
                                                    {availablePriorities.map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Deskripsi</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Tujuan dan batasan proyek..."
                                            className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#26b9f7]/50 transition-all placeholder:text-slate-700 resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* PIC Tab */}
                            {activeTab === 'pic' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <UserPlus size={14} className="text-purple-400" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Tim Proyek (PIC)</span>
                                        </div>
                                        {errors.pics && <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1"><AlertCircle size={12} /> {errors.pics}</span>}
                                    </div>

                                    <div className="space-y-2">
                                        {pics.map((pic, index) => {
                                            const usedUsernames = pics.map(p => p.name).filter((_, i) => i !== index);
                                            const remainingUsers = availableUsers.filter(u => !usedUsernames.includes(u.username));

                                            return (
                                                <div key={index} className="flex items-center gap-2 p-3 bg-[#020617]/50 border border-[#1e293b] rounded-xl">
                                                    <div className="relative flex-1">
                                                        <select
                                                            value={pic.name}
                                                            onChange={(e) => updatePic(index, 'name', e.target.value)}
                                                            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer pr-8"
                                                        >
                                                            <option value="">Pilih Member...</option>
                                                            {/* Show current value if valid, plus remaining users */}
                                                            {/* If the current pic.name is valid and selected, it should be in the list or added temporarily if we want to show it. 
                                                                Actually, `remainingUsers` logic filters out *other* selections. So the current user's name should be in `availableUsers` (unless admin, which is handled).
                                                                We need to make sure the currently selected user is also visible in this specific dropdown even if technically 'used' by this index. 
                                                                The logic `filter((_, i) => i !== index)` handles "other rows", so `remainingUsers` includes the current user if they are in `availableUsers`.
                                                            */}
                                                            {remainingUsers.map(user => (
                                                                <option key={user.id} value={user.username}>{user.username}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                                    </div>

                                                    {/* Role Display (Read Only) */}
                                                    <div className="relative min-w-[120px]">
                                                        <div className="bg-[#1e293b]/50 border border-[#1e293b] rounded-lg px-3 py-2 text-[11px] text-slate-400">
                                                            {pic.role || '-'}
                                                        </div>
                                                    </div>

                                                    {pics.length > 1 && (
                                                        <button type="button" onClick={() => removePic(index)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addPic}
                                        className="w-full py-2.5 border border-dashed border-purple-500/30 rounded-lg text-purple-400 text-[10px] font-bold uppercase tracking-wider hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus size={12} /> Tambah PIC
                                    </button>
                                </div>
                            )}

                            {/* Phase Tab */}
                            {activeTab === 'phase' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon size={14} className="text-[#26b9f7]" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-[#26b9f7]">Fase Proyek</span>
                                        </div>
                                        {errors.phases && <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1"><AlertCircle size={12} /> {errors.phases}</span>}
                                    </div>

                                    <div className="space-y-2">
                                        {phases.map((phase, index) => {
                                            const phaseInfo = availablePhases.find(p => p.id === phase.phaseId);
                                            const error = errors[`phase_${index}`];
                                            return (
                                                <div key={index} className={`p-3 bg-[#020617]/50 border rounded-xl ${error ? 'border-rose-500/50' : 'border-[#1e293b]'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="relative flex-1">
                                                            <select
                                                                value={phase.phaseId}
                                                                onChange={(e) => updatePhase(index, 'phaseId', e.target.value)}
                                                                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#26b9f7]/50 appearance-none cursor-pointer pr-8"
                                                            >
                                                                <option value={phase.phaseId}>{phaseInfo?.label}</option>
                                                                {remainingPhases.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                                            </select>
                                                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                                        </div>
                                                        <button type="button" onClick={() => removePhase(index)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Start Date</label>
                                                            <input type="date" value={phase.startDate} onChange={(e) => updatePhase(index, 'startDate', e.target.value)}
                                                                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-[#26b9f7]" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">End Date</label>
                                                            <input type="date" value={phase.endDate} onChange={(e) => updatePhase(index, 'endDate', e.target.value)}
                                                                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-[#26b9f7]" />
                                                        </div>
                                                    </div>
                                                    {error && <p className="text-[9px] text-rose-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addPhase}
                                        disabled={remainingPhases.length === 0 && phases.length > 0}
                                        className="w-full py-2.5 border border-dashed border-[#26b9f7]/30 rounded-lg text-[#26b9f7] text-[10px] font-bold uppercase tracking-wider hover:bg-[#26b9f7]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={12} /> Tambah Fase
                                    </button>
                                </div>
                            )}

                            {/* Documents Tab */}
                            {activeTab === 'docs' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className="text-emerald-400" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Dokumen (SharePoint Links)</span>
                                    </div>

                                    <div className="space-y-2">
                                        {documents.map((doc, index) => (
                                            <div key={index} className="p-3 bg-[#020617]/50 border border-[#1e293b] rounded-xl space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Nama Dokumen"
                                                        value={doc.name}
                                                        onChange={(e) => updateDocument(index, 'name', e.target.value)}
                                                        className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-700"
                                                    />
                                                    <button type="button" onClick={() => removeDocument(index)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <LinkIcon size={12} className="text-slate-500 shrink-0" />
                                                    <input
                                                        type="url"
                                                        placeholder="https://sharepoint.com/..."
                                                        value={doc.url}
                                                        onChange={(e) => updateDocument(index, 'url', e.target.value)}
                                                        className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-[10px] text-white font-mono focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-700"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addDocument}
                                        className="w-full py-2.5 border border-dashed border-emerald-500/30 rounded-lg text-emerald-400 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus size={12} /> Tambah Dokumen
                                    </button>

                                    {documents.length === 0 && (
                                        <p className="text-center text-[10px] text-slate-600 italic py-4">Belum ada dokumen ditambahkan</p>
                                    )}
                                </div>
                            )}

                            {/* Notes Tab */}
                            {activeTab === 'notes' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <StickyNote size={14} className="text-amber-400" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Catatan Proyek</span>
                                    </div>

                                    <textarea
                                        rows={12}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Tulis catatan, informasi penting, atau hal-hal yang perlu diingat tentang proyek ini..."
                                        className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all placeholder:text-slate-700 resize-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#1e293b] flex gap-4 shrink-0">
                            <button type="button" onClick={onClose}
                                className="flex-1 h-11 bg-transparent hover:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                                Batal
                            </button>
                            <button type="submit"
                                className="flex-1 h-11 bg-[#26b9f7] text-[#020617] text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg shadow-[#26b9f7]/20 transition-all flex items-center justify-center gap-2">
                                <Check size={16} strokeWidth={3} /> Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Validation Modal */}
            {
                showValidationModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <div className="bg-[#0f172a] border border-rose-500/30 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="p-4 border-b border-[#1e293b] flex items-center gap-3 bg-rose-500/5">
                                <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                                    <AlertCircle size={20} />
                                </div>
                                <h3 className="text-rose-400 text-sm font-black uppercase tracking-widest">Validasi Gagal</h3>
                            </div>
                            <div className="p-5">
                                <p className="text-slate-400 text-xs mb-3">Mohon lengkapi field berikut:</p>
                                <ul className="space-y-2">
                                    {validationErrors.map((error, index) => (
                                        <li key={index} className="flex items-start gap-2 text-rose-300 text-sm">
                                            <span className="text-rose-500 shrink-0">•</span>
                                            <span>{error}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="p-4 border-t border-[#1e293b]">
                                <button
                                    onClick={() => setShowValidationModal(false)}
                                    className="w-full h-10 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
                                >
                                    Mengerti
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default AddProjectModal;
