import { useState } from 'react';
import {
    Mail,
    ArrowLeft,
    AlertCircle,
    Send,
    Rocket
} from 'lucide-react';

const ForgotPasswordPage = ({ onSubmit, onBack }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Email wajib diisi');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Format email tidak valid');
            return;
        }

        setIsLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const result = onSubmit(email);
        if (!result.success) {
            setError(result.error);
            setIsLoading(false);
        }
        // Success case is handled by parent (navigates to reset page)
    };

    const inputClass = (hasError) => `
    w-full pl-12 pr-4 py-3.5 rounded-xl border transition-all duration-200 outline-none
    bg-[#0f172a] text-white placeholder:text-slate-500
    ${hasError ? 'border-red-500 bg-red-500/10' : 'border-[#1e293b] focus:border-[#26b9f7] focus:ring-4 focus:ring-[#26b9f7]/10'}
  `;

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
                        Lupa Password?
                    </h2>
                    <p className="text-slate-400 font-medium">
                        Masukkan email Anda untuk menerima instruksi reset password
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

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 block ml-1">
                            Email Terdaftar
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#26b9f7] transition-colors">
                                <Mail size={20} />
                            </div>
                            <input
                                type="email"
                                placeholder="email@perusahaan.com"
                                className={inputClass(!!error)}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
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
                                <span>Mengirim...</span>
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                <span>Kirim Link Reset</span>
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

export default ForgotPasswordPage;
