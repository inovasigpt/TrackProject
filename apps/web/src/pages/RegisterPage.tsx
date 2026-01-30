import { useState, useEffect } from 'react';
import {
    Lock,
    Mail,
    User,
    Eye,
    EyeOff,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    Rocket,
    UserPlus,
    ChevronDown
} from 'lucide-react';
import type { Role } from '../types';
import api from '../services/api';

interface RegisterPageProps {
    onRegister: (userData: { username: string; email: string; password: string; role: string }) => Promise<any> | any;
    onBack: () => void;
    roles?: Role[];
}

interface ValidationErrors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onBack, roles = [] }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: roles.length > 0 ? roles[0].value : 'user'
    });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [fetchedRoles, setFetchedRoles] = useState<Role[]>([]);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await api.getParameters('role');
                if (data) {
                    setFetchedRoles(data.map((r: any) => ({ label: r.label, value: r.value })));
                    if (data.length > 0 && !formData.role) {
                        setFormData(prev => ({ ...prev, role: data[0].value }));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch roles:', error);
            }
        };
        fetchRoles();
    }, []);

    const activeRoles = roles.length > 0 ? roles : fetchedRoles;

    const validate = () => {
        const newErrors: ValidationErrors = {};

        if (!formData.username) {
            newErrors.username = 'Username wajib diisi';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username minimal 3 karakter';
        }

        if (!formData.email) {
            newErrors.email = 'Email wajib diisi';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        if (!formData.password) {
            newErrors.password = 'Password wajib diisi';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password minimal 6 karakter';
        }

        if (formData.password !== formData.confirmPassword) {
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
        await new Promise(resolve => setTimeout(resolve, 800));

        const result = await onRegister({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: formData.role
        });

        if (result.success) {
            setSuccess(true);
        } else {
            setErrors({ general: result.error });
        }
        setIsLoading(false);
    };

    const inputClass = (hasError) => `
    w-full pl-12 pr-4 py-3.5 rounded-xl border transition-all duration-200 outline-none
    bg-[#0f172a] text-white placeholder:text-slate-500
    ${hasError ? 'border-red-500 bg-red-500/10' : 'border-[#1e293b] focus:border-[#26b9f7] focus:ring-4 focus:ring-[#26b9f7]/10'}
  `;

    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] font-display p-8">
                <div className="w-full max-w-md text-center animate-in fade-in zoom-in-95">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 ring-4 ring-emerald-500/10">
                        <CheckCircle2 className="text-emerald-400 w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">Pendaftaran Berhasil!</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Akun Anda telah berhasil dibuat dan sedang menunggu persetujuan dari Admin.
                        Kami akan mengirimkan notifikasi setelah akun Anda diaktifkan.
                    </p>
                    <button
                        onClick={onBack}
                        className="w-full bg-[#26b9f7] hover:bg-[#26b9f7]/90 text-[#020617] font-bold py-4 rounded-xl shadow-lg shadow-[#26b9f7]/20 transition-all active:scale-[0.98]"
                    >
                        Kembali ke Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] font-display p-8">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#26b9f7] rounded-lg flex items-center justify-center shadow-lg shadow-[#26b9f7]/20">
                            <Rocket className="text-[#020617] w-6 h-6" strokeWidth={3} />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tight uppercase italic">Track Project</span>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-white mb-2">
                        Daftar Akun Baru
                    </h2>
                    <p className="text-slate-400 font-medium">
                        Buat akun untuk mengakses dashboard proyek
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* General Error */}
                    {errors.general && (
                        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-in fade-in">
                            <AlertCircle size={18} />
                            <span>{errors.general}</span>
                        </div>
                    )}

                    {/* Username Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 block ml-1">
                            Username
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Masukkan username"
                                className={inputClass(errors.username)}
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        {errors.username && (
                            <div className="flex items-center gap-1.5 text-red-400 text-xs ml-1 animate-in fade-in">
                                <AlertCircle size={14} /> <span>{errors.username}</span>
                            </div>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 block ml-1">
                            Email
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                <Mail size={20} />
                            </div>
                            <input
                                type="email"
                                placeholder="email@perusahaan.com"
                                className={inputClass(errors.email)}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        {errors.email && (
                            <div className="flex items-center gap-1.5 text-red-400 text-xs ml-1 animate-in fade-in">
                                <AlertCircle size={14} /> <span>{errors.email}</span>
                            </div>
                        )}
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 block ml-1">
                            Pilih Role
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors pointer-events-none">
                                <UserPlus size={20} />
                            </div>
                            <select
                                className={`${inputClass(false)} appearance-none cursor-pointer pr-12`}
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                {activeRoles.length > 0 ? activeRoles.map(role => (
                                    <option key={role.value} value={role.value} className="bg-[#0f172a]">
                                        {role.label}
                                    </option>
                                )) : (
                                    <option value="user" className="bg-[#0f172a]">User</option>
                                )}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                <ChevronDown size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 block ml-1">
                            Password
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Minimal 6 karakter"
                                className={inputClass(errors.password)}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && (
                            <div className="flex items-center gap-1.5 text-red-400 text-xs ml-1 animate-in fade-in">
                                <AlertCircle size={14} /> <span>{errors.password}</span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 block ml-1">
                            Konfirmasi Password
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Ulangi password"
                                className={inputClass(errors.confirmPassword)}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <div className="flex items-center gap-1.5 text-red-400 text-xs ml-1 animate-in fade-in">
                                <AlertCircle size={14} /> <span>{errors.confirmPassword}</span>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#26b9f7] hover:bg-[#26b9f7]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#020617] font-bold py-4 rounded-xl shadow-lg shadow-[#26b9f7]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin"></div>
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <>
                                <UserPlus size={20} />
                                <span>Daftar</span>
                            </>
                        )}
                    </button>

                    {/* Back to Login */}
                    <div className="text-center pt-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#26b9f7] transition-all"
                        >
                            <ArrowLeft size={16} /> Kembali ke Login
                        </button>
                    </div>
                </form>

                <div className="mt-10 text-center text-xs text-slate-500">
                    &copy; 2026 Track Project Management System
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
