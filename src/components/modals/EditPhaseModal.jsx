import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';

const EditPhaseModal = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        progress: 0
    });

    useEffect(() => {
        if (data?.phase) {
            setFormData({
                startDate: data.phase.startDate,
                endDate: data.phase.endDate,
                progress: data.phase.progress
            });
        }
    }, [data]);

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && data) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [data, onClose]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(data.project.id, data.phase.id, formData);
        onClose();
    };

    if (!data) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-sm rounded-xl shadow-2xl p-6 animate-in zoom-in-95">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                            {data.info.label} Phase
                        </h3>
                        <p className="text-[10px] text-[#26b9f7] font-mono">
                            {data.project.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white p-1 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                                Start Date
                            </label>
                            <div className="relative">
                                <CalendarIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full bg-[#020617] border border-[#1e293b] rounded-lg p-2 pl-8 text-[10px] text-white focus:outline-none focus:border-[#26b9f7]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                                End Date
                            </label>
                            <div className="relative">
                                <CalendarIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full bg-[#020617] border border-[#1e293b] rounded-lg p-2 pl-8 text-[10px] text-white focus:outline-none focus:border-[#26b9f7]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Progress Slider */}
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                                Completion
                            </label>
                            <span className="text-[9px] font-mono text-[#26b9f7]">
                                {formData.progress}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            className="w-full accent-[#26b9f7] cursor-pointer"
                            value={formData.progress}
                            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                        />
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-10 bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#334155] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 h-10 bg-[#26b9f7] text-[#020617] text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-[#26b9f7]/20 hover:brightness-110 transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPhaseModal;
