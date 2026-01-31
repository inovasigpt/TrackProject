import { useState, useEffect } from 'react';
import {
    X, Pencil, UserPlus, Calendar as CalendarIcon, Check, AlertCircle, Trash2, ChevronDown, Plus,
    Database, Folder, Box, Cpu, Globe, Server, Shield, Zap, Cloud, Code,
    FileText, StickyNote, Link as LinkIcon, Users, Layers, Info
} from 'lucide-react';
import api from '../../services/api';
import { Project, Pic, Document } from '../../types';

interface EditProjectModalProps {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (project: Project) => void;
}

const PROJECT_ICONS = [
    { id: 'database', icon: Database }, { id: 'folder', icon: Folder }, { id: 'box', icon: Box },
    { id: 'cpu', icon: Cpu }, { id: 'globe', icon: Globe }, { id: 'server', icon: Server },
    { id: 'shield', icon: Shield }, { id: 'zap', icon: Zap }, { id: 'cloud', icon: Cloud }, { id: 'code', icon: Code },
];


const TABS = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'pic', label: 'PIC', icon: Users },
    { id: 'phase', label: 'Phase', icon: Layers },
    { id: 'docs', label: 'Dokumen', icon: FileText },
    { id: 'notes', label: 'Notes', icon: StickyNote },
];

const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, isOpen, onClose, onSubmit }) => {
    const [activeTab, setActiveTab] = useState('info');
    const [formData, setFormData] = useState({ code: '', description: '', priority: 'Medium', status: 'On Track', stream: [] as string[], icon: 'database' });
    const [pics, setPics] = useState<Pic[]>([]);
    const [phases, setPhases] = useState<any[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [availablePhases, setAvailablePhases] = useState<any[]>([]); // Keep loose for external API data or define stricter if known
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);
    const [availablePriorities, setAvailablePriorities] = useState<any[]>([]);
    const [availableStreams, setAvailableStreams] = useState<any[]>([]);

    useEffect(() => {
        const initializeModal = async () => {
            if (isOpen && project) {
                try {
                    // Fetch all parameters first
                    const data = await api.getParameters();
                    const usersData = await api.getAllUsers();

                    if (usersData.success) {
                        setAvailableUsers(usersData.data.filter((u: any) => u.role !== 'admin'));
                    }

                    const phasesParams = data.filter((p: any) => p.category === 'phase');
                    setAvailablePhases(phasesParams);
                    setAvailableRoles(data.filter((p: any) => p.category === 'role').map((r: any) => r.label));
                    setAvailableStatuses(data.filter((p: any) => p.category === 'status'));
                    setAvailableRoles(data.filter((p: any) => p.category === 'role').map((r: any) => r.label));
                    setAvailableStatuses(data.filter((p: any) => p.category === 'status'));
                    setAvailablePriorities(data.filter((p: any) => p.category === 'priority'));
                    setAvailableStreams(data.filter((p: any) => p.category === 'stream'));

                    // Initialize Form
                    setActiveTab('info');
                    setFormData({
                        code: project.code || '',
                        description: project.description || '',
                        priority: project.priority || 'Medium',
                        status: project.status || 'On Track',
                        stream: Array.isArray(project.stream) ? project.stream : (project.stream ? [project.stream] : []),
                        icon: project.icon || 'database',
                    });

                    const projectPics = (project.pics && project.pics.length > 0)
                        ? project.pics.map(p => {
                            // API returns userId. We must use that as the 'id' for the Person linkage.
                            // Do NOT use p.id (which is project_pics primary key) because backend expects user.id for linkage.
                            const pAny = p as any;

                            // Robustness: If API didn't return role (e.g. unlinked legacy data), try to find user by name
                            const foundUser = usersData.success ? usersData.data.find((u: any) => u.username === p.name) : null;

                            return {
                                id: pAny.userId || foundUser?.id, // CORRECTED: Use userId or found user's ID.
                                name: p.name,
                                role: p.role || foundUser?.role || 'Developer',
                                avatar: p.avatar || foundUser?.avatar
                            };
                        })
                        : project.pic ? [{ id: (project.pic as any).userId || project.pic.id, name: project.pic.name, role: project.pic.role || 'Developer', avatar: project.pic.avatar }] : [{ name: '', role: 'Developer' }];
                    setPics(projectPics);

                    setPhases(project.phases?.map(p => {
                        const matchingParam = phasesParams.find((param: any) =>
                            param.label.toLowerCase() === (p.name || '').toLowerCase() ||
                            param.id === p.name
                        );

                        return {
                            id: p.id,
                            phaseId: matchingParam ? matchingParam.id : p.id,
                            startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
                            endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
                            progress: p.progress || 0
                        };
                    }) || []);

                    setDocuments(project.documents || []);
                    setNotes(project.notes || '');
                    setErrors({});

                } catch (error) {
                    console.error('Failed to initialize modal:', error);
                }
            }
        };

        initializeModal();
    }, [isOpen, project]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const addPic = () => setPics([...pics, { name: '', role: availableRoles[0] || 'Developer' }]);
    const removePic = (i: number) => pics.length > 1 && setPics(pics.filter((_, idx) => idx !== i));
    const updatePic = (i: number, field: keyof Pic, value: string) => {
        const n = [...pics];
        if (field === 'name') {
            const selectedUser = availableUsers.find(u => u.username === value);
            if (selectedUser) {
                n[i] = { ...n[i], id: selectedUser.id, name: value, role: selectedUser.role || n[i].role, avatar: selectedUser.avatar };
            } else {
                n[i] = { ...n[i], [field]: value };
            }
        } else {
            n[i] = { ...n[i], [field]: value };
        }
        setPics(n);
    };

    const addPhase = () => {
        // Find first available phase that isn't added
        // Note: availablePhases has 'id' (parameter ID). phases has 'id' (instance ID) or 'phaseId'? 
        // We are using 'id' in phases state to mean the Parameter ID for the dropdown value.
        // Wait, if 'phases' state uses 'id' for instance ID, where is the Parameter ID stored?
        // In the dropdown: value={phase.phaseId}. 
        // So 'Phase' interface needs 'phaseId' property if that's what we use.
        // My defined Interface Phase has 'id'. Let's check previous usage.
        // Previous usage: value={phase.phaseId}.
        // So Phase object must have phaseId.
        // My interface definition used 'id'. I should update it or map it.
        // I will update the interface to match usage in logic below.

        // RE-DEFINING Logic here involves Interface update. I can't update interface here (it's outside).
        // I will coerce types here.

        const first = availablePhases.find(p => !phases.find((ph: any) => ph.phaseId === p.id));
        if (first) setPhases([...phases, { id: '', phaseId: first.id, startDate: '', endDate: '', progress: 0 } as any]);
    };
    const removePhase = (i: number) => setPhases(phases.filter((_, idx) => idx !== i));
    const updatePhase = (i: number, field: string, value: any) => {
        const n = [...phases];
        (n[i] as any)[field] = value;
        setPhases(n);
        setErrors(prev => { const e = { ...prev }; delete e[`phase_${i} `]; return e; });
    };

    const addDocument = () => setDocuments([...documents, { name: '', url: '' }]);
    const removeDocument = (i: number) => setDocuments(documents.filter((_, idx) => idx !== i));
    const updateDocument = (i: number, field: keyof Document, value: string) => { const n = [...documents]; n[i] = { ...n[i], [field]: value }; setDocuments(n); };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const validPics = pics.filter(p => p.name.trim());
        if (validPics.length === 0) newErrors.pics = 'Minimal satu PIC';
        if (phases.length === 0) newErrors.phases = 'Minimal satu fase';
        else phases.forEach((phase, i) => {
            if (!phase.startDate) newErrors[`phase_${i} `] = 'Start Date wajib';
            else if (!phase.endDate) newErrors[`phase_${i} `] = 'End Date wajib';
            else if (new Date(phase.endDate!) <= new Date(phase.startDate!)) newErrors[`phase_${i} `] = 'End Date harus > Start Date';
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const validPics = pics.filter(p => p.name.trim()).map(p => ({
            ...p,
            name: p.name.trim(), role: p.role, avatar: p.avatar || `https://i.pravatar.cc/150?u=${p.name.trim().replace(/\s/g, '')}`
        }));
        const validDocs = documents.filter(d => d.name.trim() && d.url.trim());

        if (project) {
            onSubmit({
                ...project,
                code: formData.code.toUpperCase(),
                description: formData.description,
                priority: formData.priority,
                status: formData.status,
                stream: formData.stream,
                icon: formData.icon,
                pics: validPics,
                pic: validPics[0] || project.pic,
                phases: phases.map((p: any) => ({
                    id: p.id, // keep original instance ID if exists
                    phaseId: p.phaseId, // keep parameter ID reference
                    name: availablePhases.find(ap => ap.id === p.phaseId)?.label || p.name,
                    progress: p.progress || 0,
                    startDate: p.startDate,
                    endDate: p.endDate
                })),
                documents: validDocs,
                notes: notes,
            });
        }
    };


    if (!isOpen || !project) return null;

    const usedPhaseIds = phases.map((p: any) => p.phaseId);
    const remainingPhases = availablePhases.filter(p => !usedPhaseIds.includes(p.id));

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-2xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
                {/* Header */}
                <div className="bg-[#1e293b]/30 p-5 border-b border-[#1e293b] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Pencil size={22} />
                        </div>
                        <div>
                            <h3 className="text-white text-sm font-black uppercase tracking-widest">Edit Proyek</h3>
                            <p className="text-[#26b9f7] text-[11px] font-mono tracking-widest">{project.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#1e293b] rounded-lg text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#1e293b] shrink-0 overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab.id ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5' : 'text-slate-500 hover:text-slate-300'
                                }`}>
                            <tab.icon size={12} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5">

                        {activeTab === 'info' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kode Proyek</label>
                                        <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Stream</label>
                                        <div className="relative">
                                            {/* Selected Streams Tags */}
                                            {formData.stream.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-[#020617] border border-[#1e293b] rounded-xl">
                                                    {formData.stream.map((s) => (
                                                        <div key={s} className="bg-[#26b9f7]/10 border border-[#26b9f7]/30 text-[#26b9f7] px-2 py-1 rounded-lg text-[10px] flex items-center gap-1">
                                                            {s}
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, stream: formData.stream.filter(item => item !== s) })}
                                                                className="hover:text-white"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="relative">
                                                <select
                                                    value=""
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val && !formData.stream.includes(val)) {
                                                            setFormData({ ...formData, stream: [...formData.stream, val] });
                                                        }
                                                    }}
                                                    className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer"
                                                >
                                                    <option value="">+ Tambah Stream...</option>
                                                    {availableStreams
                                                        .filter(opt => !formData.stream.includes(opt.label))
                                                        .map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                                        <div className="relative">
                                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer">
                                                {availableStatuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Icon</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PROJECT_ICONS.map(({ id, icon: Icon }) => (
                                                <button key={id} type="button" onClick={() => setFormData({ ...formData, icon: id })}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${formData.icon === id ? 'bg-amber-500 text-[#020617]' : 'bg-[#020617] border border-[#1e293b] text-slate-400 hover:border-amber-500/50'
                                                        }`}>
                                                    <Icon size={14} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Priority</label>
                                        <div className="relative">
                                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer">
                                                {availablePriorities.map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Deskripsi</label>
                                    <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'pic' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><UserPlus size={14} className="text-purple-400" /><span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Tim Proyek</span></div>
                                    {errors.pics && <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1"><AlertCircle size={12} /> {errors.pics}</span>}
                                </div>
                                <div className="space-y-2">
                                    {pics.map((pic, i) => {
                                        const usedUsernames = pics.map(p => p.name).filter((_, idx) => idx !== i);
                                        const remainingUsers = availableUsers.filter(u => !usedUsernames.includes(u.username));

                                        return (
                                            <div key={i} className="flex items-center gap-2 p-3 bg-[#020617]/50 border border-[#1e293b] rounded-xl">
                                                <div className="relative flex-1">
                                                    <select
                                                        value={pic.name}
                                                        onChange={(e) => updatePic(i, 'name', e.target.value)}
                                                        className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer pr-8"
                                                    >
                                                        <option value="">Pilih Member...</option>
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

                                                {pics.length > 1 && <button type="button" onClick={() => removePic(i)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 size={14} /></button>}
                                            </div>
                                        );
                                    })}
                                </div>
                                <button type="button" onClick={addPic} className="w-full py-2.5 border border-dashed border-purple-500/30 rounded-lg text-purple-400 text-[10px] font-bold uppercase tracking-wider hover:bg-purple-500/10 flex items-center justify-center gap-2">
                                    <Plus size={12} /> Tambah PIC
                                </button>
                            </div>
                        )}

                        {activeTab === 'phase' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><CalendarIcon size={14} className="text-[#26b9f7]" /><span className="text-[10px] font-black uppercase tracking-wider text-[#26b9f7]">Fase Proyek</span></div>
                                    {errors.phases && <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1"><AlertCircle size={12} /> {errors.phases}</span>}
                                </div>
                                <div className="space-y-2">
                                    {phases.map((phase, i) => {
                                        const phaseAny = phase as any;
                                        const info = availablePhases.find(p => p.id === phaseAny.phaseId);
                                        const error = errors[`phase_${i}`];
                                        return (
                                            <div key={i} className={`p-3 bg-[#020617]/50 border rounded-xl ${error ? 'border-rose-500/50' : 'border-[#1e293b]'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="relative flex-1">
                                                        <select value={phaseAny.phaseId} onChange={(e) => updatePhase(i, 'phaseId', e.target.value)}
                                                            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#26b9f7]/50 appearance-none cursor-pointer pr-8">
                                                            <option value={phaseAny.phaseId}>{info?.label || phaseAny.phaseId}</option>
                                                            {remainingPhases.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                                        </select>
                                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                                    </div>
                                                    <button type="button" onClick={() => removePhase(i)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 size={14} /></button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-500 uppercase">Start Date</label>
                                                        <input type="date" value={phase.startDate || ''} onChange={(e) => updatePhase(i, 'startDate', e.target.value)} className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-[#26b9f7]" /></div>
                                                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-500 uppercase">End Date</label>
                                                        <input type="date" value={phase.endDate || ''} onChange={(e) => updatePhase(i, 'endDate', e.target.value)} className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-[#26b9f7]" /></div>
                                                </div>
                                                {error && <p className="text-[9px] text-rose-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                                <button type="button" onClick={addPhase} disabled={remainingPhases.length === 0 && phases.length > 0}
                                    className="w-full py-2.5 border border-dashed border-[#26b9f7]/30 rounded-lg text-[#26b9f7] text-[10px] font-bold uppercase tracking-wider hover:bg-[#26b9f7]/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Plus size={12} /> Tambah Fase
                                </button>
                            </div>
                        )}

                        {activeTab === 'docs' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2"><FileText size={14} className="text-emerald-400" /><span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Dokumen (SharePoint)</span></div>
                                <div className="space-y-2">
                                    {documents.map((doc, i) => (
                                        <div key={i} className="p-3 bg-[#020617]/50 border border-[#1e293b] rounded-xl space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input type="text" placeholder="Nama Dokumen" value={doc.name} onChange={(e) => updateDocument(i, 'name', e.target.value)}
                                                    className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                                                <button type="button" onClick={() => removeDocument(i)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 size={14} /></button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <LinkIcon size={12} className="text-slate-500 shrink-0" />
                                                <input type="url" placeholder="https://sharepoint.com/..." value={doc.url} onChange={(e) => updateDocument(i, 'url', e.target.value)}
                                                    className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-[10px] text-white font-mono focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addDocument} className="w-full py-2.5 border border-dashed border-emerald-500/30 rounded-lg text-emerald-400 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/10 flex items-center justify-center gap-2">
                                    <Plus size={12} /> Tambah Dokumen
                                </button>
                                {documents.length === 0 && <p className="text-center text-[10px] text-slate-600 italic py-4">Belum ada dokumen</p>}
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2"><StickyNote size={14} className="text-amber-400" /><span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Catatan Proyek</span></div>
                                <textarea rows={12} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tulis catatan penting..."
                                    className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-slate-700 resize-none" />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[#1e293b] flex gap-3 shrink-0">
                        <div className="flex-1"></div>
                        <button type="button" onClick={onClose}
                            className="h-11 px-6 bg-transparent hover:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                            Batal
                        </button>
                        <button type="submit"
                            className="h-11 px-6 bg-amber-500 text-[#020617] text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2">
                            <Check size={16} strokeWidth={3} /> Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProjectModal;
