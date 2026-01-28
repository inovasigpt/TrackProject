import { History, X } from 'lucide-react';

const AuditSlideOver = ({ isOpen, onClose }) => {
    const auditLogs = [
        {
            timestamp: '27 Jan 2026 - 08:12',
            message: 'Dashboard diperbarui: Header tanggal dan penanda posisi hari ini aktif.',
            user: 'System'
        },
        {
            timestamp: '26 Jan 2026 - 16:45',
            message: 'Proyek "Cloud Migration" fase Design ditandai selesai (100%).',
            user: 'Marcus Thorne'
        },
        {
            timestamp: '26 Jan 2026 - 14:30',
            message: 'Proyek baru "Payment Gateway v2" berhasil ditambahkan.',
            user: 'Admin'
        },
        {
            timestamp: '25 Jan 2026 - 10:15',
            message: 'Fase Development pada proyek CORE-MIG-01 dimulai.',
            user: 'Marcus Thorne'
        },
        {
            timestamp: '24 Jan 2026 - 09:00',
            message: 'Sistem audit log diaktifkan untuk tracking aktivitas.',
            user: 'System'
        },
    ];

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
                {auditLogs.map((log, index) => (
                    <div key={index} className="relative pl-6 border-l border-[#1e293b]">
                        <div
                            className={`
                absolute -left-1.5 top-0 w-3 h-3 rounded-full 
                ${index === 0
                                    ? 'bg-[#26b9f7] shadow-[0_0_10px_#26b9f7]'
                                    : 'bg-[#1e293b]'}
              `}
                        />
                        <p className="text-[9px] font-mono text-slate-500 mb-1 tracking-tighter uppercase">
                            {log.timestamp}
                        </p>
                        <div className="bg-[#020617]/60 p-3 rounded-lg border border-[#1e293b]">
                            <p className="text-[11px] text-white leading-relaxed">
                                {log.message}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-1 font-bold">
                                — {log.user}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default AuditSlideOver;
