import { useState, useEffect } from 'react';
import {
    X,
    UserPlus,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    Shield
} from 'lucide-react';
import api from '../../services/api';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface RoleParameter {
    id: string;
    label: string;
    value: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
    });
    const [roles, setRoles] = useState<RoleParameter[]>([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            fetchRoles();
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'user'
            });
            setError(null);
            setFormErrors({});
        }
    }, [isOpen]);

    const fetchRoles = async () => {
        try {
            const data = await api.getParameters('role');
            if (Array.isArray(data) && data.length > 0) {
                setRoles(data);
                // Set default role if available
                setFormData(prev => ({ ...prev, role: data[0].value }));
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.username) newErrors.username = 'Username wajib diisi';
        else if (formData.username.length < 3) newErrors.username = 'Minimal 3 karakter';

        if (!formData.email) newErrors.email = 'Email wajib diisi';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format email tidak valid';

        if (!formData.password) newErrors.password = 'Password wajib diisi';
        else if (formData.password.length < 6) newErrors.password = 'Minimal 6 karakter';

        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Password tidak sama';

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await api.adminCreateUser({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError((result as any).error || 'Gagal membuat user');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat membuat user');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = (hasError: boolean) => `
        w-full pl-10 pr-4 py-2.5 bg-[#020617] border rounded-lg text-sm text-white placeholder:text-slate-500 outline-none transition-all
        ${hasError ? 'border-red-500/50 focus:border-red-500' : 'border-[#1e293b] focus:border-[#26b9f7]'}
    `;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Tambah User</h3>
                            <p className="text-slate-500 text-xs">Buat akun akses baru</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Username */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Username</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                <User size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="john_doe"
                                className={inputClass(!!formErrors.username)}
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        {formErrors.username && <p className="text-xs text-red-400 ml-1">{formErrors.username}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                <Mail size={16} />
                            </div>
                            <input
                                type="email"
                                placeholder="john@company.com"
                                className={inputClass(!!formErrors.email)}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        {formErrors.email && <p className="text-xs text-red-400 ml-1">{formErrors.email}</p>}
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Role</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors pointer-events-none">
                                <Shield size={16} />
                            </div>
                            <select
                                className={`${inputClass(false)} appearance-none cursor-pointer`}
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                {roles.length > 0 ? (
                                    roles.map(role => (
                                        <option key={role.id} value={role.value} className="bg-[#0f172a]">
                                            {role.label}
                                        </option>
                                    ))
                                ) : (
                                    <option value="user" className="bg-[#0f172a]">User (Default)</option>
                                )}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="******"
                                    className={inputClass(!!formErrors.password)}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            {formErrors.password && <p className="text-xs text-red-400 ml-1">{formErrors.password}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Confirm</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="******"
                                    className={inputClass(!!formErrors.confirmPassword)}
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    {formErrors.confirmPassword && <p className="text-xs text-red-400 ml-1">{formErrors.confirmPassword}</p>}

                    {/* Footer */}
                    <div className="pt-4 flex gap-3 border-t border-[#1e293b] mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-transparent hover:bg-[#1e293b] text-slate-400 font-bold rounded-xl transition-colors text-sm border border-transparent hover:border-[#334155]"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-2.5 bg-[#26b9f7] hover:bg-[#26b9f7]/90 text-[#020617] font-bold rounded-xl shadow-lg shadow-[#26b9f7]/20 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin"></div>
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus size={16} />
                                    <span>Buat User</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;
