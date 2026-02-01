import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    autoClose?: boolean;
    duration?: number;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
    isOpen,
    onClose,
    title = 'Error',
    message = 'Terjadi kesalahan',
    autoClose = true,
    duration = 3000
}) => {
    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, duration, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-rose-500/30 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-4 border-b border-[#1e293b] flex items-center gap-3 bg-rose-500/5">
                    <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                        <AlertCircle size={20} strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-rose-400 text-sm font-black uppercase tracking-widest">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 text-center">
                    <p className="text-slate-300 text-sm">{message}</p>
                </div>
                <div className="p-1 h-1 bg-rose-500/20 w-full overflow-hidden">
                    {autoClose && (
                        <div
                            className="h-full bg-rose-500 animate-[progress_3s_linear_forwards]"
                            style={{ animationDuration: `${duration}ms` }}
                        />
                    )}
                </div>
            </div>
            <style>{`
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export default ErrorModal;
