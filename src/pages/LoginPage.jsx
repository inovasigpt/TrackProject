import { useState } from 'react';
import {
    Lock,
    Mail,
    User,
    Eye,
    EyeOff,
    ShieldCheck,
    AlertCircle,
    Rocket
} from 'lucide-react';

const LoginPage = ({ onLogin, onForgotPassword, onRegister }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email) {
            setError('Email/Username wajib diisi');
            return;
        }
        if (!formData.password) {
            setError('Password wajib diisi');
            return;
        }

        setIsLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = onLogin(formData.email, formData.password);
        if (!result.success) {
            setError(result.error);
        }
        setIsLoading(false);
    };

    const inputClass = (hasError) => `
    w-full pl-12 pr-4 py-3.5 rounded-xl border transition-all duration-200 outline-none
    bg-[#0f172a] text-white placeholder:text-slate-500
    ${hasError ? 'border-red-500 bg-red-500/10' : 'border-[#1e293b] focus:border-[#26b9f7] focus:ring-4 focus:ring-[#26b9f7]/10'}
  `;

    return (
        <div className="min-h-screen w-full flex bg-[#020617] font-display">

            {/* Left Side: Visual Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0c4a6e] via-[#1e3a5f] to-[#312e81]">
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative z-10 w-full flex flex-col justify-center px-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-[#26b9f7]/20 backdrop-blur-md rounded-2xl border border-[#26b9f7]/30">
                            <Rocket className="text-[#26b9f7] w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Track Project</h1>
                    </div>

                    <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
                        Project Management<br />Dashboard
                    </h2>
                    <p className="text-slate-300 text-lg max-w-md leading-relaxed">
                        Platform terpadu untuk monitoring, evaluasi, dan manajemen progres proyek IT.
                    </p>


                </div>

                {/* Floating Decorative Elements */}
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#26b9f7]/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-[-5%] left-[-5%] w-64 h-64 bg-purple-500/10 rounded-full blur-2xl"></div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
                <div className="w-full max-w-md">

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#26b9f7] rounded-lg flex items-center justify-center shadow-lg shadow-[#26b9f7]/20">
                                <Rocket className="text-[#020617] w-6 h-6" strokeWidth={3} />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tight uppercase italic">Track Project</span>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-extrabold text-white mb-2">
                            Selamat Datang
                        </h2>
                        <p className="text-slate-400 font-medium">
                            Masuk dengan akun Anda yang telah terdaftar
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-in fade-in">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Email/Username Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 block ml-1">
                                Username / Email
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Masukkan username atau email"
                                    className={inputClass(false)}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
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
                                    placeholder="••••••••"
                                    className={inputClass(false)}
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
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onForgotPassword}
                                className="text-sm font-bold text-[#26b9f7] hover:text-[#26b9f7]/80 transition-all"
                            >
                                Lupa Password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#26b9f7] hover:bg-[#26b9f7]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#020617] font-bold py-4 rounded-xl shadow-lg shadow-[#26b9f7]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin"></div>
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={20} />
                                    <span>Masuk</span>
                                </>
                            )}
                        </button>

                        {/* Register Link */}
                        <div className="text-center pt-4">
                            <p className="text-sm text-slate-400">
                                Belum memiliki akun?{' '}
                                <button
                                    type="button"
                                    onClick={onRegister}
                                    className="font-bold text-[#26b9f7] hover:underline"
                                >
                                    Daftar di sini
                                </button>
                            </p>
                        </div>
                    </form>

                    <div className="mt-12 text-center text-xs text-slate-500">
                        &copy; 2026 Track Project Management System. All rights reserved.
                        <br />
                        <span className="text-slate-600">Versi 0.0.1</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
