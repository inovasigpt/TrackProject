import { useState, useEffect } from 'react';
import {
    X, Users, Pencil, ExternalLink, Archive,
    Database, Folder, Box, Cpu, Globe, Server, Shield, Zap, Cloud, Code,
    Info, Layers, FileText, StickyNote, LucideIcon
} from 'lucide-react';
import { Project } from '../../types';
import { formatDateForDisplay } from '../../utils/dateUtils';

const ICON_MAP: Record<string, LucideIcon> = {
    database: Database, folder: Folder, box: Box, cpu: Cpu, globe: Globe,
    server: Server, shield: Shield, zap: Zap, cloud: Cloud, code: Code,
};

const TABS = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'pic', label: 'PIC', icon: Users },
    { id: 'phase', label: 'Phase', icon: Layers },
    { id: 'docs', label: 'Dokumen', icon: FileText },
    { id: 'notes', label: 'Notes', icon: StickyNote },
];

interface ProjectDetailContentProps {
    project: Project;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

interface ProjectDetailModalProps {
    project: Project | null;
    onClose: () => void;
    onEdit?: (project: Project) => void;
    onArchive?: (project: Project) => void;
    isArchived?: boolean;
}

const getPriorityStyle = (priority?: string) => {
    switch (priority?.toLowerCase()) {
        case 'high': return 'border-amber-500/50 text-amber-400 bg-amber-500/10';
        case 'low': return 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10';
        default: return 'border-blue-500/50 text-blue-400 bg-blue-500/10';
    }
};

const getStatusStyle = (status?: string) => {
    try {
        const saved = localStorage.getItem('pmo_statuses');
        if (saved) {
            const statuses = JSON.parse(saved);
            const found = statuses.find((s: any) => s.label === status);
            if (found) {
                const colorMap: Record<string, string> = {
                    emerald: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
                    blue: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
                    amber: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
                    rose: 'border-rose-500/50 text-rose-400 bg-rose-500/10',
                    purple: 'border-purple-500/50 text-purple-400 bg-purple-500/10',
                    slate: 'border-slate-500/50 text-slate-400 bg-slate-500/10',
                };
                return colorMap[found.color] || colorMap.blue;
            }
        }
    } catch (e) { }
    if (status === 'On Track' || status === 'Done') return 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10';
    return 'border-rose-500/50 text-rose-400 bg-rose-500/10';
};

// Inner content component that can be used standalone or embedded
export const ProjectDetailContent: React.FC<ProjectDetailContentProps> = ({ project, activeTab, setActiveTab }) => {
    const picsList = project.pics && project.pics.length > 0 ? project.pics : project.pic ? [project.pic] : [];
    const documents = project.documents || [];
    const notes = project.notes || '';

    return (
        <>
            {/* Tabs */}
            <div className="flex border-b border-[#1e293b] shrink-0 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[70px] py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab.id
                            ? 'text-[#26b9f7] border-b-2 border-[#26b9f7] bg-[#26b9f7]/5'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <tab.icon size={12} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">

                {activeTab === 'info' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-[#020617] border border-[#1e293b] rounded-lg">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Deskripsi</label>
                            <p className="text-xs text-slate-300 leading-relaxed">{project.description || 'Tidak ada deskripsi.'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-[#020617] border border-[#1e293b] rounded-lg">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Priority</label>
                                <span className={`text-[10px] font-black px-2 py-1 rounded border inline-block ${getPriorityStyle(project.priority)}`}>
                                    {(project.priority || 'Medium').toUpperCase()}
                                </span>
                            </div>
                            <div className="p-3 bg-[#020617] border border-[#1e293b] rounded-lg">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Status</label>
                                <span className={`text-[10px] font-black px-2 py-1 rounded border inline-block ${getStatusStyle(project.status)}`}>
                                    {project.status?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pic' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={14} className="text-purple-400" />
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Tim ({picsList.length} PIC)</label>
                        </div>
                        {picsList.length === 0 ? (
                            <p className="text-center text-slate-600 text-sm py-8">Tidak ada PIC</p>
                        ) : (
                            <div className="space-y-2">
                                {picsList.map((pic, index) => (
                                    <div key={index} className="flex items-center gap-3 bg-[#020617]/50 p-3 rounded-lg border border-[#1e293b]">
                                        <div className="w-10 h-10 rounded-lg border border-purple-500/30 p-0.5 overflow-hidden">
                                            <img className="w-full h-full rounded-lg object-cover" src={pic.avatar} alt={pic.name} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-bold">{pic.name}</p>
                                            <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest">{pic.role || 'Developer'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'phase' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers size={14} className="text-[#26b9f7]" />
                            <label className="text-[10px] font-black text-[#26b9f7] uppercase tracking-widest">Fase ({project.phases?.length || 0})</label>
                        </div>
                        {!project.phases?.length ? (
                            <p className="text-center text-slate-600 text-sm py-8">Tidak ada fase</p>
                        ) : (
                            <div className="space-y-2">
                                {project.phases.map((phase) => (
                                    <div key={phase.id} className="flex items-center justify-between p-3 bg-[#020617]/50 rounded-lg border border-[#1e293b]">
                                        <span className="text-[11px] text-white uppercase font-bold">{phase.name || phase.id.replace('_', ' ')}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-mono text-slate-500">
                                                {formatDateForDisplay(String(phase.startDate))} → {formatDateForDisplay(String(phase.endDate))}
                                            </span>
                                            <div className="w-16 h-2 bg-[#1e293b] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#26b9f7] rounded-full" style={{ width: `${phase.progress}%` }}></div>
                                            </div>
                                            <span className="text-[9px] font-mono text-[#26b9f7] w-8 text-right">{phase.progress}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText size={14} className="text-emerald-400" />
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Dokumen ({documents.length})</label>
                        </div>
                        {documents.length === 0 ? (
                            <p className="text-center text-slate-600 text-sm py-8">Tidak ada dokumen</p>
                        ) : (
                            <div className="space-y-2">
                                {documents.map((doc, index) => (
                                    <a key={index} href={doc.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-[#020617]/50 rounded-lg border border-[#1e293b] hover:border-emerald-500/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <FileText size={16} className="text-emerald-400" />
                                            <span className="text-sm text-white font-medium group-hover:text-emerald-400">{doc.name}</span>
                                        </div>
                                        <ExternalLink size={14} className="text-slate-500 group-hover:text-emerald-400" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <StickyNote size={14} className="text-amber-400" />
                            <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Catatan</label>
                        </div>
                        {!notes ? (
                            <p className="text-center text-slate-600 text-sm py-8">Tidak ada catatan</p>
                        ) : (
                            <div className="p-4 bg-[#020617] border border-[#1e293b] rounded-lg">
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

// Main modal component
const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose, onEdit, onArchive, isArchived = false }) => {
    const [activeTab, setActiveTab] = useState('info');
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

    useEffect(() => {
        if (project) {
            setActiveTab('info');
            setShowArchiveConfirm(false);
        }
    }, [project]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && project) {
                if (showArchiveConfirm) {
                    setShowArchiveConfirm(false);
                } else {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [project, onClose, showArchiveConfirm]);

    if (!project) return null;

    const ProjectIcon = ICON_MAP[project.icon || 'database'] || Database;

    const handleArchiveClick = () => {
        setShowArchiveConfirm(true);
    };

    const handleArchiveConfirm = () => {
        if (onArchive) {
            onArchive(project);
            onClose();
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                    {/* Header */}
                    <div className="p-5 border-b border-[#1e293b] shrink-0">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-[#26b9f7]/10 flex items-center justify-center text-[#26b9f7]">
                                    <ProjectIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">{project.name}</h3>
                                    <p className="text-[10px] text-[#26b9f7] font-mono tracking-widest">{project.code}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-slate-500 hover:text-white p-1 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <ProjectDetailContent project={project} activeTab={activeTab} setActiveTab={setActiveTab} />

                    {/* Footer - Edit & Archive buttons */}
                    {!isArchived && (
                        <div className="p-4 border-t border-[#1e293b] shrink-0 flex gap-3">
                            <button
                                onClick={() => onEdit && onEdit(project)}
                                className="flex-1 h-11 bg-amber-500/20 text-amber-400 text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Pencil size={14} /> Edit
                            </button>
                            <button
                                onClick={handleArchiveClick}
                                className="flex-1 h-11 bg-slate-500/20 text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Archive size={14} /> Arsipkan
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Archive Confirmation Modal */}
            {showArchiveConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-4 border-b border-[#1e293b] flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                                <Archive size={20} />
                            </div>
                            <h3 className="text-white text-sm font-black uppercase tracking-widest">Arsipkan Proyek</h3>
                        </div>
                        <div className="p-5">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Apakah Anda yakin ingin mengarsipkan proyek <span className="text-white font-bold">"{project.name}"</span>?
                            </p>
                            <p className="text-slate-500 text-xs mt-2">
                                Proyek yang diarsipkan tidak akan muncul di timeline.
                            </p>
                        </div>
                        <div className="p-4 border-t border-[#1e293b] flex gap-3">
                            <button
                                onClick={() => setShowArchiveConfirm(false)}
                                className="flex-1 h-10 bg-transparent hover:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-[#1e293b]"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleArchiveConfirm}
                                className="flex-1 h-10 bg-amber-500 text-[#020617] text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
                            >
                                Ya, Arsipkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProjectDetailModal;

