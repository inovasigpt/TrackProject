import { useState, useEffect, useMemo } from 'react';
import { 
    LayoutDashboard, 
    ArrowLeft, 
    ChevronDown, 
    PieChart, 
    BarChart, 
    Activity,
    Layers 
} from 'lucide-react';
import api from '../services/api';
import { Project, Scenario } from '../types';

interface ScenarioDashboardPageProps {
    onBack: () => void;
}

export default function ScenarioDashboardPage({ onBack }: ScenarioDashboardPageProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadScenarios(selectedProject);
        }
    }, [selectedProject]);

    const loadProjects = async () => {
        try {
            const res = await api.getProjects();
            if (res.success) {
                setProjects(res.data);
                if (res.data.length > 0) {
                    setSelectedProject(res.data[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load projects', err);
        }
    };

    const loadScenarios = async (projectId: string) => {
        setIsLoading(true);
        try {
            const res = await api.getScenarios(projectId);
            if (res.success) {
                setScenarios(res.data);
            }
        } catch (err) {
            console.error('Failed to load scenarios', err);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Stats Computation ---

    const stats = useMemo(() => {
        const total = scenarios.length;
        
        // Status Grouping
        const statusCounts: Record<string, number> = {
            Pass: 0,
            Fail: 0,
            Pending: 0
        };
        scenarios.forEach(s => {
            const st = s.status || 'Pending';
            statusCounts[st] = (statusCounts[st] || 0) + 1;
        });

        // Satker Grouping
        const satkerCounts: Record<string, number> = {};
        scenarios.forEach(s => {
            const key = s.satker || 'Unassigned';
            satkerCounts[key] = (satkerCounts[key] || 0) + 1;
        });

        // Function Grouping (Functional ID)
        const funcCounts: Record<string, number> = {};
        scenarios.forEach(s => {
            const key = s.functionalId || 'No ID';
            funcCounts[key] = (funcCounts[key] || 0) + 1;
        });

        // Component Grouping
        const compCounts: Record<string, number> = {};
        scenarios.forEach(s => {
            const key = s.component || 'General';
            compCounts[key] = (compCounts[key] || 0) + 1;
        });

        return { total, statusCounts, satkerCounts, funcCounts, compCounts };
    }, [scenarios]);

    // Helper for Percentage
    const getPercent = (val: number) => stats.total > 0 ? ((val / stats.total) * 100).toFixed(1) : 0;

    return (
        <div className="flex flex-col h-full bg-[#020617] text-slate-300 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1e293b] bg-[#0f172a]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors text-slate-400"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <LayoutDashboard size={24} className="text-[#26b9f7]" />
                            Scenario Dashboard
                        </h1>
                        <p className="text-sm text-slate-500">Rekapitulasi Hasil UAT</p>
                    </div>
                </div>

                {/* Project Filter */}
                <div className="relative">
                    <select 
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="appearance-none bg-[#1e293b] border border-[#334155] text-white py-2 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#26b9f7] min-w-[200px]"
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-slate-500 animate-pulse">Loading dashboard data...</div>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-7xl mx-auto">
                        
                        {/* Top Cards: Status Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <StatCard 
                                label="Total Scenarios" 
                                value={stats.total} 
                                icon={<Layers size={20} />} 
                                color="bg-blue-500/10 text-blue-400 border-blue-500/20" 
                            />
                            <StatCard 
                                label="Passed" 
                                value={stats.statusCounts.Pass} 
                                subValue={`${getPercent(stats.statusCounts.Pass)}%`}
                                icon={<Activity size={20} />} 
                                color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            />
                            <StatCard 
                                label="Failed" 
                                value={stats.statusCounts.Fail} 
                                subValue={`${getPercent(stats.statusCounts.Fail)}%`}
                                icon={<Activity size={20} />} 
                                color="bg-rose-500/10 text-rose-400 border-rose-500/20" 
                            />
                            <StatCard 
                                label="Pending" 
                                value={stats.statusCounts.Pending} 
                                subValue={`${getPercent(stats.statusCounts.Pending)}%`}
                                icon={<Clock size={20} />} // Use Clock icon
                                color="bg-slate-500/10 text-slate-400 border-slate-500/20" 
                            />
                        </div>

                        {/* Grid 2 Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Group by Satker */}
                            <DashboardSection title="By Satker" icon={<Users size={18} />}>
                                <BarList data={stats.satkerCounts} total={stats.total} />
                            </DashboardSection>

                            {/* Group by Function */}
                            <DashboardSection title="By Function (ID)" icon={<Settings size={18} />}>
                                <BarList data={stats.funcCounts} total={stats.total} />
                            </DashboardSection>

                            {/* Group by Component */}
                            <DashboardSection title="By Component" icon={<Layers size={18} />}>
                                <BarList data={stats.compCounts} total={stats.total} />
                            </DashboardSection>

                            {/* Status Detailed Chart (Mini) */}
                            <DashboardSection title="Status Breakdown" icon={<PieChart size={18} />}>
                                <div className="flex items-center justify-center h-full p-4">
                                    <div className="w-full space-y-4">
                                        <ProgressBar label="Pass" value={stats.statusCounts.Pass} total={stats.total} color="bg-emerald-500" />
                                        <ProgressBar label="Fail" value={stats.statusCounts.Fail} total={stats.total} color="bg-rose-500" />
                                        <ProgressBar label="Pending" value={stats.statusCounts.Pending} total={stats.total} color="bg-slate-500" />
                                    </div>
                                </div>
                            </DashboardSection>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Sub Components ---

const StatCard = ({ label, value, subValue, icon, color }: any) => (
    <div className={`p-4 rounded-xl border ${color} flex items-center justify-between`}>
        <div>
            <p className="text-xs font-bold uppercase opacity-70 mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">{value}</span>
                {subValue && <span className="text-xs opacity-60">{subValue}</span>}
            </div>
        </div>
        <div className={`p-2 rounded-lg bg-black/20`}>{icon}</div>
    </div>
);

const DashboardSection = ({ title, icon, children }: any) => (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-[#1e293b] flex items-center gap-2 bg-[#1e293b]/30">
            {icon}
            <h3 className="font-bold text-sm text-slate-300">{title}</h3>
        </div>
        <div className="p-4 flex-1 overflow-auto max-h-[300px] custom-scrollbar">
            {children}
        </div>
    </div>
);

const BarList = ({ data, total }: { data: Record<string, number>, total: number }) => {
    const sortedKeys = Object.keys(data).sort((a, b) => data[b] - data[a]); // Sort desc

    return (
        <div className="space-y-3">
            {sortedKeys.map(key => {
                const count = data[key];
                const percent = total > 0 ? (count / total) * 100 : 0;
                return (
                    <div key={key} className="group">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-slate-400 truncate max-w-[70%]">{key}</span>
                            <span className="text-slate-500">{count} ({percent.toFixed(1)}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#1e293b] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-[#26b9f7] rounded-full transition-all duration-500 group-hover:bg-blue-400"
                                style={{ width: `${percent}%` }}
                            ></div>
                        </div>
                    </div>
                );
            })}
            {sortedKeys.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No data</p>}
        </div>
    );
};

const ProgressBar = ({ label, value, total, color }: any) => {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-slate-300">{label}</span>
                <span className="text-slate-500">{value}</span>
            </div>
            <div className="h-3 w-full bg-[#1e293b] rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color} transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
        </div>
    );
};

// Icon import helper (need to import Users and Settings if used above, added to main import)
import { Users, Settings, Clock } from 'lucide-react';
