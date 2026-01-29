import { useEffect } from 'react';
import { X, AlertTriangle, XCircle } from 'lucide-react';

interface ValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    errors: string[];
}

const ValidationModal: React.FC<ValidationModalProps> = ({
    isOpen,
    onClose,
    errors = []
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || errors.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-rose-500/30 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-rose-500/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="text-rose-400 text-sm font-black uppercase tracking-widest">Validasi Gagal</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    <p className="text-slate-400 text-xs mb-3">Mohon lengkapi field berikut:</p>
                    <ul className="space-y-2">
                        {errors.map((error, index) => (
                            <li key={index} className="flex items-start gap-2 text-rose-300 text-sm">
                                <XCircle size={14} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#1e293b]">
                    <button
                        onClick={onClose}
                        className="w-full h-10 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
                    >
                        Mengerti
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ValidationModal;
