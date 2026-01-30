import { useState, useEffect } from 'react';
import { X, Archive, ArchiveRestore, Trash2, Database, Folder, Box, Cpu, Globe, Server, Shield, Zap, Cloud, Code, ChevronLeft, LucideIcon } from 'lucide-react';
import { ProjectDetailContent } from './ProjectDetailModal';
import { Project } from '../../types';

interface ArchivedProjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
    archivedProjects: Project[];
    onUnarchive: (project: Project) => void;
    onDeletePermanently: (id: string) => void;
    currentUser?: any;
    users?: any[];
}

const ICON_MAP: Record<string, LucideIcon> = {
    database: Database, folder: Folder, box: Box, cpu: Cpu, globe: Globe,
    server: Server, shield: Shield, zap: Zap, cloud: Cloud, code: Code,
};

const ArchivedProjectsModal: React.FC<ArchivedProjectsModalProps> = ({ isOpen, onClose, archivedProjects, onUnarchive, onDeletePermanently, currentUser, users = [] }) => {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState('info');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSelectedProject(null);
            setActiveTab('info');
            setShowDeleteConfirm(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedProject) {
            setActiveTab('info');
            setShowDeleteConfirm(false);
        }
    }, [selectedProject]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showDeleteConfirm) {
                    setShowDeleteConfirm(false);
                } else if (selectedProject) {
                    setSelectedProject(null);
                } else if (isOpen) {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedProject, showDeleteConfirm, onClose]);

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedProject) {
            onDeletePermanently(selectedProject.id);
            setSelectedProject(null);
            setShowDeleteConfirm(false);
        }
    };

    if (!isOpen) return null;

    // Detail view for selected archived project
    if (selectedProject) {
        const ProjectIcon = ICON_MAP[selectedProject.icon || 'database'] || Database;

        return (
            <>
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-2xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
                        {/* Header with back button */}
                        <div className="p-4 border-b border-[#1e293b] flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => setSelectedProject(null)}
                                className="p-2 hover:bg-[#1e293b] rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="h-9 w-9 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400">
                                <ProjectIcon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white text-sm font-black uppercase tracking-wider truncate">{selectedProject.name}</h3>
                                <p className="text-slate-500 text-[9px] font-mono">{selectedProject.code} • Diarsipkan</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-[#1e293b] rounded-lg text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabbed content */}
                        <ProjectDetailContent
                            project={selectedProject as any}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            users={users}
                        />

                        {/* Action Footer */}
                        <div className="p-4 border-t border-[#1e293b] flex gap-3 shrink-0">
                            {(currentUser?.role === 'admin' || selectedProject.createdBy === currentUser?.id) && (
                                <button
                                    onClick={() => {
                                        onUnarchive(selectedProject);
                                        setSelectedProject(null);
                                    }}
                                    className="flex-1 h-11 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArchiveRestore size={14} /> Pulihkan
                                </button>
                            )}
                            {currentUser?.role === 'admin' && (
                                <button
                                    onClick={handleDeleteClick}
                                    className="flex-1 h-11 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} /> Hapus Permanen
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <div className="bg-[#0f172a] border border-rose-500/30 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="p-4 border-b border-[#1e293b] flex items-center gap-3 bg-rose-500/5">
                                <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                                    <Trash2 size={20} />
                                </div>
                                <h3 className="text-rose-400 text-sm font-black uppercase tracking-widest">Hapus Permanen</h3>
                            </div>
                            <div className="p-5">
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Apakah Anda yakin ingin menghapus proyek <span className="text-white font-bold">"{selectedProject.name}"</span> secara permanen?
                                </p>
                                <p className="text-rose-400 text-xs mt-3 font-bold">
                                    ⚠️ Aksi ini tidak dapat dibatalkan!
                                </p>
                            </div>
                            <div className="p-4 border-t border-[#1e293b] flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 h-10 bg-transparent hover:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-[#1e293b]"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="flex-1 h-10 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // List view
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-lg max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
                {/* Header */}
                <div className="bg-[#1e293b]/30 p-5 border-b border-[#1e293b] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center text-slate-400">
                            <Archive size={22} />
                        </div>
                        <div>
                            <h3 className="text-white text-sm font-black uppercase tracking-widest">Proyek Diarsipkan</h3>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">{archivedProjects.length} proyek</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#1e293b] rounded-lg text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {archivedProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                            <Archive size={48} className="mb-4 opacity-50" />
                            <p className="text-sm font-bold">Tidak ada proyek diarsipkan</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {archivedProjects.map(project => {
                                const ProjectIcon = ICON_MAP[project.icon || 'database'] || Database;
                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => setSelectedProject(project)}
                                        className="w-full p-4 bg-[#020617]/50 border border-[#1e293b] rounded-xl hover:border-slate-600 transition-colors text-left"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-500 shrink-0">
                                                <ProjectIcon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white text-sm font-bold truncate">{project.name}</h4>
                                                <p className="text-slate-500 text-[10px] font-mono">{project.code}</p>
                                                <p className="text-slate-600 text-[10px] mt-1 line-clamp-1">{project.description || 'Tidak ada deskripsi'}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#1e293b] shrink-0">
                    <button onClick={onClose} className="w-full h-11 bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#334155] transition-colors">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchivedProjectsModal;
