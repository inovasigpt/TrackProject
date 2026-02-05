import { useState, useEffect } from 'react';
import { 
    Search, 
    Plus, 
    Filter, 
    Download, 
    ChevronDown, 
    ChevronUp, 
    CheckCircle2, 
    XCircle, 
    Clock,
    MoreHorizontal,
    Trash2,
    Edit,
    ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import { Scenario, Project, User } from '../types';
import { format } from 'date-fns';

interface ScenarioPageProps {
    currentUser: User | null;
    onBack: () => void;
    onOpenDashboard: () => void;
}

export default function ScenarioPage({ currentUser, onBack, onOpenDashboard }: ScenarioPageProps) {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadScenarios(selectedProject);
        }
    }, [selectedProject]);

    const loadInitialData = async () => {
        try {
            const projectRes = await api.getProjects();
            if (projectRes.success) {
                setProjects(projectRes.data);
                if (projectRes.data.length > 0) {
                    setSelectedProject(projectRes.data[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load projects', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadScenarios = async (projectId: string) => {
        setIsLoading(true);
        try {
            const res = await api.getScenarios(projectId);
            if (res.success) {
                setScenarios(res.data);
            }
        } catch (error) {
            console.error('Failed to load scenarios', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: 'Pass' | 'Fail' | 'Pending') => {
        try {
            // Optimistic update
            setScenarios(prev => prev.map(s => 
                s.id === id ? { ...s, status: newStatus } : s
            ));
            
            await api.updateScenario(id, { 
                status: newStatus,
                updatedBy: currentUser?.id 
            });
        } catch (error) {
            console.error('Failed to update status', error);
            loadScenarios(selectedProject);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pass': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Fail': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const filteredScenarios = scenarios.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.scenarioNo && s.scenarioNo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-full bg-[#020617] text-slate-300">
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
                        <h1 className="text-2xl font-bold text-white tracking-tight">UAT Scenarios</h1>
                        <p className="text-sm text-slate-500">User Acceptance Testing Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Dashboard Button */}
                    <button
                        onClick={onOpenDashboard}
                        className="flex items-center gap-2 px-3 py-2 bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded-lg transition-colors text-sm font-medium border border-[#334155]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                        Dashboard
                    </button>

                    {/* Project Selector */}
                    <div className="relative">
                        <select 
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="appearance-none bg-[#1e293b] border border-[#334155] text-white py-2 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#26b9f7]"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>

{/* New Scenario Button Removed */}
                </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text"
                        placeholder="Search scenarios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#1e293b] text-slate-300 py-2 pl-10 pr-4 rounded-lg focus:outline-none focus:border-[#26b9f7] transition-colors"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-4 pb-4">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#1e293b] bg-[#1e293b]/50">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-10"></th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-32">ID</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Satker</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Scenario</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-40">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-20 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td>
                                </tr>
                            ) : filteredScenarios.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">No scenarios found</td>
                                </tr>
                            ) : (
                                filteredScenarios.map(scenario => (
                                    <>
                                        <tr 
                                            key={scenario.id} 
                                            className={`hover:bg-[#1e293b]/30 transition-colors cursor-pointer ${expandedRow === scenario.id ? 'bg-[#1e293b]/30' : ''}`}
                                            onClick={() => setExpandedRow(expandedRow === scenario.id ? null : scenario.id)}
                                        >
                                            <td className="p-4 text-center">
                                                {expandedRow === scenario.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </td>
                                            <td className="p-4 font-mono text-xs text-[#26b9f7]">{scenario.scenarioNo || '-'}</td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                                                    {scenario.satker || '-'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-white">{scenario.title}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-lg">{scenario.script}</div>
                                            </td>
                                            <td className="p-4">
                                                <select 
                                                    onClick={(e) => e.stopPropagation()}
                                                    value={scenario.status}
                                                    onChange={(e) => handleStatusChange(scenario.id, e.target.value as any)}
                                                    className={`px-2 py-1 rounded text-xs font-bold border appearance-none cursor-pointer outline-none ${getStatusColor(scenario.status)}`}
                                                >
                                                    <option value="Pending">PENDING</option>
                                                    <option value="Pass">PASS</option>
                                                    <option value="Fail">FAIL</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="p-1.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-white">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === scenario.id && (
                                            <tr className="bg-[#1e293b]/20">
                                                <td colSpan={5} className="p-6">
                                                    <div className="grid grid-cols-2 gap-8">
                                                        <div>
                                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Steps</h4>
                                                            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
                                                                {scenario.steps || 'No steps defined'}
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Expected Result</h4>
                                                            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
                                                                {scenario.expectedResult || 'No expected result'}
                                                            </pre>
                                                            <div className="mt-4">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Details</h4>
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-slate-500">Component:</span>
                                                                        <span className="ml-2 text-white">{scenario.component || '-'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-slate-500">Functional ID:</span>
                                                                        <span className="ml-2 text-white">{scenario.functionalId || '-'}</span>
                                                                    </div>
                                                                </div>
                                                                {scenario.notes && (
                                                                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                                                        <h5 className="text-xs font-bold text-yellow-500 uppercase mb-1">Notes</h5>
                                                                        <p className="text-sm text-yellow-200/80">{scenario.notes}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
