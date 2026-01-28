import { useState } from 'react';
import {
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    X
} from 'lucide-react';

const ChangePasswordModal = ({ isOpen, onClose, onSubmit, currentUser }) => {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const validate = () => {
        const newErrors = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Password saat ini wajib diisi';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'Password baru wajib diisi';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password baru minimal 6 karakter';
        }

        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = onSubmit(formData.currentPassword, formData.newPassword);
        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } else {
            setErrors({ general: result.error });
        }
        setIsLoading(false);
    };

    const handleClose = () => {
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setErrors({});
        setSuccess(false);
        onClose();
    };

    const inputClass = (hasError) => `
    w-full pl-12 pr-12 py-3.5 rounded-xl border transition-all duration-200 outline-none
    bg-[#0f172a] text-white placeholder:text-slate-500
    ${hasError ? 'border-red-500 bg-red-500/10' : 'border-[#1e293b] focus:border-[#26b9f7] focus:ring-4 focus:ring-[#26b9f7]/10'}
  `;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#1e293b]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#26b9f7]/20 rounded-lg">
                            <Lock size={20} className="text-[#26b9f7]" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Ubah Password</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-6 animate-in fade-in">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="text-emerald-400 w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Password Berhasil Diubah!</h3>
                            <p className="text-slate-400 text-sm">Password Anda telah berhasil diperbarui.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* User Info */}
                            <div className="flex items-center gap-3 p-3 bg-[#1e293b]/50 rounded-xl mb-4">
                                <img
                                    src={currentUser?.avatar}
                                    alt={currentUser?.username}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-[#1e293b]"
                                />
                                <div>
                                    <p className="font-bold text-white text-sm">{currentUser?.username}</p>
                                    <p className="text-xs text-slate-400">{currentUser?.email}</p>
                                </div>
                            </div>

                            {/* General Error */}
                            {errors.general && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-in fade-in">
                                    <AlertCircle size={16} />
                                    <span>{errors.general}</span>
                                </div>
                            )}

                            {/* Current Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 block ml-1">
                                    Password Saat Ini
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        placeholder="Masukkan password saat ini"
                                        className={inputClass(errors.currentPassword)}
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.currentPassword && (
                                    <div className="flex items-center gap-1.5 text-red-400 text-xs ml-1 animate-in fade-in">
                                        <AlertCircle size={12} /> <span>{errors.currentPassword}</span>
                                    </div>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 block ml-1">
                                    Password Baru
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Minimal 6 karakter"
                                        className={inputClass(errors.newPassword)}
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.newPassword && (
                                    <div className="flex items-center gap-1.5 text-red-400 text-xs ml-1 animate-in fade-in">
                                        <AlertCircle size={12} /> <span>{errors.newPassword}</span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 block ml-1">
                                    Konfirmasi Password Baru
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Ulangi password baru"
                                        className={inputClass(errors.confirmPassword)}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <div className="flex items-center gap-1.5 text-red-400 text-xs ml-1 animate-in fade-in">
                                        <AlertCircle size={12} /> <span>{errors.confirmPassword}</span>
                                    </div>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-3 bg-[#1e293b] hover:bg-[#334155] text-white font-bold rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-[#26b9f7] hover:bg-[#26b9f7]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#020617] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin"></div>
                                            <span>Menyimpan</span>
                                        </>
                                    ) : (
                                        <span>Simpan</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
