import { useState, useEffect } from 'react';
import { History, X } from 'lucide-react';
import api from '../services/api';

interface AuditSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuditSlideOver: React.FC<AuditSlideOverProps> = ({ isOpen, onClose }) => {
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            if (isOpen) {
                setIsLoading(true);
                try {
                    const data = await api.getAuditLogs();
                    setAuditLogs(data as any[]);
                } catch (error) {
                    console.error('Failed to fetch audit logs:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchLogs();
    }, [isOpen]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <aside
            className={`
        bg-[#0f172a]/95 backdrop-blur-xl border-l border-[#1e293b] 
        flex flex-col shrink-0 z-50 transition-all duration-300 
        fixed top-16 bottom-0 right-0 
        ${isOpen ? 'w-80' : 'w-0 opacity-0 pointer-events-none'}
      `}
        >
            {/* Header */}
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History size={16} className="text-[#26b9f7]" />
                    <h3 className="text-white text-[10px] font-black uppercase tracking-widest">
                        History Log
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Audit Log List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {isLoading ? (
                    <div className="text-center text-slate-500 text-xs py-10">Loading...</div>
                ) : auditLogs.length === 0 ? (
                    <div className="text-center text-slate-600 text-[10px] italic py-10">Belum ada aktivitas</div>
                ) : (
                    auditLogs.map((log, index) => (
                        <div key={log.id} className="relative pl-6 border-l border-[#1e293b]">
                            <div
                                className={`
                    absolute -left-1.5 top-0 w-3 h-3 rounded-full 
                    ${index === 0
                                        ? 'bg-[#26b9f7] shadow-[0_0_10px_#26b9f7]'
                                        : 'bg-[#1e293b]'}
                  `}
                            />
                            <p className="text-[9px] font-mono text-slate-500 mb-1 tracking-tighter uppercase">
                                {formatDate(log.createdAt)}
                            </p>
                            <div className="bg-[#020617]/60 p-3 rounded-lg border border-[#1e293b]">
                                <p className="text-[11px] text-white leading-relaxed">
                                    {log.details}
                                </p>
                                <p className="text-[9px] text-slate-500 mt-1 font-bold">
                                    — {log.user?.username || 'Unknown'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};

export default AuditSlideOver;
