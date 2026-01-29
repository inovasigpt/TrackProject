import { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, AlertCircle, Info, LucideIcon } from 'lucide-react';

type ModalType = 'warning' | 'success' | 'error' | 'info' | 'confirm';

interface IconConfig {
    icon: LucideIcon;
    color: string;
}

const ICON_MAP: Record<ModalType, IconConfig> = {
    warning: { icon: AlertTriangle, color: 'amber' },
    success: { icon: CheckCircle, color: 'emerald' },
    error: { icon: XCircle, color: 'rose' },
    info: { icon: Info, color: 'blue' },
    confirm: { icon: AlertCircle, color: 'slate' },
};

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: ModalType;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message = 'Apakah Anda yakin?',
    confirmText = 'Ya',
    cancelText = 'Batal',
    type = 'confirm'
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const { icon: IconComponent, color } = ICON_MAP[type] || ICON_MAP.confirm;

    const colorStyles: Record<string, { bg: string; text: string; btn: string }> = {
        amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', btn: 'bg-amber-500 text-[#020617]' },
        emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', btn: 'bg-emerald-500 text-[#020617]' },
        rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', btn: 'bg-rose-500 text-white' },
        blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', btn: 'bg-blue-500 text-white' },
        slate: { bg: 'bg-slate-500/20', text: 'text-slate-400', btn: 'bg-slate-500 text-white' },
    };

    const styles = colorStyles[color] || colorStyles.slate;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${styles.bg} flex items-center justify-center ${styles.text}`}>
                            <IconComponent size={20} />
                        </div>
                        <h3 className="text-white text-sm font-black uppercase tracking-widest">{title}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#1e293b] flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-10 bg-transparent hover:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-[#1e293b]"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 h-10 ${styles.btn} text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
