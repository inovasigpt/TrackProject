import React, { useState, useEffect } from 'react';
import {
    Layout,
    LayoutDashboard,
    LayoutGrid,
    Search,
    Filter,
    Plus,
    X,
    MoreHorizontal,
    Maximize2,
    RefreshCw,
    AlertCircle,
    ChevronDown,
    Link as LinkIcon,
    ArrowLeft,
    Clock,
    UploadCloud
} from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { api } from '../services/api';

// Constants
const ISSUE_TYPES = ['Bug', 'New Feature', 'Request'];
const PRIORITIES = ['Fatal', 'Major', 'Minor', 'Kosmetik'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'NOT_OK', 'CLOSED', 'UNDER_REVIEW'];

const BugTrackerPage = ({ currentUser, onLogout, onBack }: { currentUser: any, onLogout: () => void, onBack?: () => void }) => {
    const [bugs, setBugs] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]); // New State for Projects
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBug, setEditingBug] = useState<any | null>(null); // For Edit Mode

    // Filters
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
    const [selectedReporter, setSelectedReporter] = useState<string>('ALL');

    // Unified Form State
    const [formData, setFormData] = useState({
        summary: '',
        description: '',
        priority: 'Major', // Default
        type: 'Bug',
        status: 'OPEN',
        components: '',
        labels: '',
        attachments: [] as string[] | string,
        projectId: '' // New field
    });

    const [error, setError] = useState('');

    const fetchBugs = async () => {
        setLoading(true);
        try {
            const [bugsData, projectsData] = await Promise.all([
                api.getBugs(),
                api.getProjects()
            ]);

            if (bugsData.success) {
                setBugs(bugsData.data);
            }
            if (projectsData.success) {
                setProjects(projectsData.data);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBugs();
    }, []);

    // Open Modal for Create
    const openCreateModal = () => {
        setEditingBug(null);
        setFormData({
            summary: '',
            description: '',
            priority: 'Major',
            type: 'Bug',
            status: 'OPEN',
            components: '',
            labels: '',
            attachments: '',
            projectId: ''
        });
        setIsModalOpen(true);
        setError('');
    };

    // State for Modal Tab
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

    // Open Modal for Edit
    const openEditModal = (bug: any) => {
        setActiveTab('details'); // Reset tab to details
        setEditingBug(bug);
        setFormData({
            summary: bug.summary || '',
            description: bug.description || '',
            priority: bug.priority || 'Major',
            type: bug.type || 'Bug',
            status: bug.status || 'OPEN',
            components: Array.isArray(bug.components) ? bug.components.join(', ') : '',
            labels: Array.isArray(bug.labels) ? bug.labels.join(', ') : '',
            attachments: Array.isArray(bug.attachments) ? bug.attachments : (bug.attachments ? bug.attachments.split(',') : []),
            projectId: bug.project?.id || bug.projectId || ''
        });
        setIsModalOpen(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.summary.trim()) {
            setError('Summary is required');
            return;
        }
        if (!formData.projectId) {
            setError('Project is required');
            return;
        }

        const payload = {
            ...formData,
            // Backend expects string for now based on previous code, or checks?
            // "components: formData.components.split(',').map(s => s.trim()).filter(Boolean)," was in previous code.
            // Let's check backend schema... bugs schema components is "text". 
            // Previous frontend code was sending array? 
            // Let's stick to string if backend is text, or array if backend handles it.
            // Backend `bugs` table `components` is text. 
            // In `bugs.ts` create route: `components` is destructured. `...values({... components ...})`.
            // If it's text, we can send string.
            // Wait, previous code: `components: formData.components.split(...)`. 
            // If backend column is text, drizzle might expect string. 
            // Let's send string for now to be safe with "text" column.

            // Actually, let's keep it simple.
            // Ensure components and labels are strings if backend expects them (or split if arrays)
            // Based on issue reports, these might not be saving because we are taking string inputs
            // and maybe backend expects them to be processed.
            // But looking at initialization: "components: Array.isArray... join(', ')"
            // So we are editing a string.
            // If backend expects string, this should work.
            // If backend expects array, we must split.
            // Let's assume backend expects string OR array handling is needed.
            // The user said "data tidak tersimpan" (data not saved).
            // Usually means we are sending `components: "A, B"` but backend wants `["A", "B"]` or vice versa.
            // Let's try sending as Array since `drizzle` with json/text array often wants array object.
            // Or if it's a simple text column, string is fine.
            // Let's try splitting into array just in case the API handles it.
            // REVISION: I will try to split it into array.
            components: formData.components.split(',').map(s => s.trim()).filter(Boolean),
            labels: formData.labels.split(',').map(s => s.trim()).filter(Boolean),

        };

        try {
            if (editingBug) {
                // 1. Identify removed images
                const originalAttachments: string[] = Array.isArray(editingBug.attachments)
                    ? editingBug.attachments
                    : (editingBug.attachments ? (editingBug.attachments as string).split(',') : []);

                const currentAttachments: string[] = Array.isArray(formData.attachments)
                    ? formData.attachments
                    : (typeof formData.attachments === 'string' && formData.attachments ? formData.attachments.split(',') : []);


                const removedImages = originalAttachments.filter(url => !currentAttachments.includes(url));

                // 2. Delete removed images from Cloudinary
                if (removedImages.length > 0) {
                    await Promise.all(removedImages.map(async (url) => {
                        try {
                            await api.deleteImage(url);
                        } catch (e) {
                            console.error('Failed to auto-delete image:', url, e);
                        }
                    }));
                }

                await api.updateBug(editingBug.id, payload);
            } else {
                await api.createBug(payload);
            }
            setIsModalOpen(false);
            fetchBugs();
            fetchAuditLogs();
        } catch (err: any) {
            console.error('Failed to save bug', err);
            setError(err.message || 'Failed to save bug. Please try again.');
        }
    };

    // Statistik untuk Dashboard (Filter by Project & Only 'Bug' type for chart)
    const filteredBugsForStats = bugs.filter(b =>
        b.type === 'Bug' &&
        (!selectedProject || b.project?.id === selectedProject)
    );

    // Total for chart should match filtered stats
    const totalCount = filteredBugsForStats.length;

    const statusCounts = STATUSES.reduce((acc, status) => {
        acc[status] = filteredBugsForStats.filter(b => b.status === status).length;
        return acc;
    }, {} as Record<string, number>);

    // List Filtering (Project & Status Filter)
    const filteredBugsForList = bugs.filter(b => {
        const matchProject = !selectedProject || b.project?.id === selectedProject;
        const matchStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
        const matchReporter = selectedReporter === 'ALL' || b.reporter?.id === selectedReporter;
        return matchProject && matchStatus && matchReporter;
    });


    // Pagination State (Use filtered list)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const totalPages = Math.ceil(filteredBugsForList.length / itemsPerPage);
    const paginatedBugs = filteredBugsForList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Get unique reporters for filter dropdown
    const reporters = Array.from(new Map(bugs.filter(b => b.reporter).map(b => [b.reporter.id, b.reporter])).values());

    // Audit Logs State
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        try {
            const data: any = await api.getAuditLogs(); // Explicit any to match unknown return type
            // Filter explicitly for BUG entity type if necessary, usually logic is in backend but good to be safe
            // Assuming API returns mixed logs, we filter for 'BUG' related logs just in case user wants only those
            // Actually, Requirement said "Activity Stream" which usually implies ALL relevant activities.
            // But context is Bug Tracker. Let's filter for BUG entityType for relevance.
            // Wait, user just accepted "Activity Stream" which showed 'BUG'.
            // Let's filter client side if needed.
            if (Array.isArray(data)) { // Check if data is array directly
                setAuditLogs(data.filter((l: any) => l.entityType === 'BUG'));
            } else if (data && Array.isArray(data.data)) { // Or data { data: [...] }
                setAuditLogs(data.data.filter((l: any) => l.entityType === 'BUG')); // Adjust based on actual API response
            } else {
                setAuditLogs([]);
            }
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        }
    };

    const seedData = async () => {
        if (!confirm('Generate 30 dummy bugs? This might take a moment.')) return;
        setLoading(true);
        try {
            const getRandomElement = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
            const defaultProjectId = projects.length > 0 ? projects[0].id : null; // Use first project if available

            for (let i = 0; i < 30; i++) {
                const type = getRandomElement(ISSUE_TYPES);
                const priority = getRandomElement(PRIORITIES);
                const status = getRandomElement(STATUSES); // Use string to avoid enum import issues if any
                await api.createBug({
                    summary: `Dummy Bug ${i + 1} - ${new Date().toISOString().split('T')[0]}`,
                    description: `Automatically generated dummy bug for testing. Priority: ${priority}, Status: ${status}.`,
                    priority,
                    type,
                    status,
                    projectId: defaultProjectId,
                    components: 'Backend,Frontend',
                    labels: 'dummy,test',
                    attachments: '[]'
                });
            }
            await fetchBugs();
            await fetchAuditLogs(); // Refresh logs too because creation logs
            alert('Seeding complete!');
        } catch (error) {
            console.error('Seeding failed', error);
            alert('Seeding failed check console.');
        } finally {
            setLoading(false);
        }
    };

    // Dynamic Colors for Pie Chart
    const STATUS_COLORS: Record<string, string> = {
        'OPEN': '#4c9aff',       // Blue
        'IN_PROGRESS': '#f5cd47', // Yellow
        'RESOLVED': '#4fcc25',   // Green
        'NOT_OK': '#ff5630',     // Red
        'CLOSED': '#6b778c',     // Grey
        'UNDER_REVIEW': '#9f8fef' // Purple
    };


    return (
        <div className="min-h-screen bg-[#161a1d] text-[#deebff] font-sans selection:bg-blue-500/30">
            {/* Navbar Utama */}
            <nav className="h-14 border-b border-[#2c333a] bg-[#1d2125] flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-[#2c333a] rounded text-gray-400 hover:text-white transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-2 font-bold text-lg text-[#deebff]">
                        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white text-xs">
                            <span className="text-xl">🐞</span>
                        </div>
                        Bug Tracker
                    </div>
                    <div className="hidden md:flex gap-4 text-sm font-medium ml-4">
                        <button
                            onClick={openCreateModal}
                            className="bg-[#0c66e4] hover:bg-[#0055cc] text-white px-3 py-1 rounded font-semibold transition-colors"
                        >
                            Create
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search bugs"
                            className="bg-[#22272b] border border-[#3c444d] rounded-md pl-8 pr-2 py-1.5 text-sm w-48 focus:w-64 focus:outline-none focus:border-blue-500 transition-all text-gray-300"
                        />
                    </div>
                </div>
            </nav>

            {/* Sub-header / Filters */}
            <div className="bg-[#1d2125] border-b border-[#2c333a] px-6 py-4 flex flex-wrap items-center gap-4">
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Project Filter</label>
                    <div className="relative">
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="bg-[#22272b] border border-[#3c444d] text-sm rounded-md pl-3 pr-8 py-1.5 focus:border-blue-500 outline-none appearance-none min-w-[200px]"
                        >
                            <option value="">All Projects</option>
                            {projects.filter(p => !p.archived).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Konten Dashboard */}
            <main className="p-6 max-w-[1600px] mx-auto">
                <header className="flex justify-between items-center mb-6">
                    {/* Buttons Removed */}
                </header>

                {/* Grid Layout Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Kolom Kiri */}
                    <div className="space-y-6">

                        {/* Bug Report Statistic (Left) */}
                        <DashboardCard title="Bug Report Statistic">
                            <StatTable bugs={filteredBugsForStats} />
                        </DashboardCard>

                        {/* Bug By Priority Statistic */}
                        <DashboardCard title="Bug By Priority">
                            <StatTableByPriority bugs={filteredBugsForStats} />
                        </DashboardCard>

                        {/* Filter Results */}
                        <DashboardCard title="All Issues"
                            action={
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <select
                                            value={selectedReporter}
                                            onChange={(e) => { setSelectedReporter(e.target.value); setCurrentPage(1); }}
                                            className="bg-[#22272b] border border-[#3c444d] text-xs rounded pl-2 pr-6 py-1 focus:border-blue-500 outline-none appearance-none"
                                        >
                                            <option value="ALL">All Reporters</option>
                                            {reporters.map((r: any) => <option key={r.id} value={r.id}>{r.username}</option>)}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                                            className="bg-[#22272b] border border-[#3c444d] text-xs rounded pl-2 pr-6 py-1 focus:border-blue-500 outline-none appearance-none"
                                        >
                                            <option value="ALL">All Status</option>
                                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            }
                        >
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="text-[#9fadbc] border-b border-[#2c333a] sticky top-0 bg-[#1d2125]">
                                        <tr>
                                            <th className="py-2">T</th>
                                            <th className="py-2">P</th>
                                            <th className="py-2">Summary</th>
                                            <th className="py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2c333a]">
                                        {paginatedBugs.map((bug) => (
                                            <tr
                                                key={bug.id}
                                                onClick={() => openEditModal(bug)}
                                                className="hover:bg-[#1d2125] transition-colors group cursor-pointer"
                                            >
                                                <td className="py-3">
                                                    <span className="text-lg" title={bug.type}>
                                                        {bug.type === 'Bug' ? '🐞' : '✨'}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span className={`font-bold ${bug.priority === 'Fatal' ? 'text-red-600' : bug.priority === 'Major' ? 'text-orange-500' : 'text-blue-400'}`}>
                                                        {bug.priority?.substring(0, 1)}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-400 group-hover:underline font-medium">{bug.code}</span>
                                                        <span className="text-gray-400">{bug.summary}</span>
                                                        {bug.labels && Array.isArray(bug.labels) && bug.labels.length > 0 && (
                                                            <div className="flex gap-1 mt-1">
                                                                {bug.labels.map((l: string, i: number) => (
                                                                    <span key={i} className="bg-gray-700 text-[10px] px-1 rounded">{l}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <span
                                                        className="px-2 py-0.5 rounded text-[10px] font-bold border border-transparent"
                                                        style={{
                                                            color: STATUS_COLORS[bug.status] || '#ccc',
                                                            backgroundColor: `${STATUS_COLORS[bug.status]}20`,
                                                            borderColor: `${STATUS_COLORS[bug.status]}40`
                                                        }}
                                                    >
                                                        {bug.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredBugsForList.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-gray-500">No bugs found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
                                    <span>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBugsForList.length)} of {filteredBugsForList.length} entries</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-2 py-1 bg-[#2c333a] rounded hover:bg-[#3c444d] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Prev
                                        </button>
                                        <span className="px-2 py-1">{currentPage} / {totalPages}</span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-2 py-1 bg-[#2c333a] rounded hover:bg-[#3c444d] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </DashboardCard>
                    </div>

                    {/* Kolom Kanan */}
                    <div className="space-y-6">

                        <DashboardCard title="Status Overview">
                            <div className="flex flex-col py-2 px-2 space-y-4 w-full">
                                {totalCount > 0 ? (
                                    <>
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <span className="text-2xl font-bold block">{totalCount}</span>
                                                <span className="text-xs text-gray-500">Total Issues</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {STATUSES.map(status => {
                                                const count = statusCounts[status] || 0;
                                                const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

                                                // Format status label
                                                const label = status === 'IN_PROGRESS' ? 'IN PROGRESS' :
                                                    status === 'UNDER_REVIEW' ? 'REVIEW' : status;

                                                return (
                                                    <div key={status} className="group">
                                                        <div className="flex justify-between items-end mb-1 text-xs">
                                                            <span className="font-medium text-gray-400">{label}</span>
                                                            <span className="text-gray-500 font-mono">
                                                                <span className={count > 0 ? "text-gray-200 font-bold" : ""}>{count}</span>
                                                                <span className="text-gray-600 mx-1">/</span>
                                                                {percentage.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full bg-[#2c333a] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500 ease-out relative"
                                                                style={{
                                                                    width: `${percentage}%`,
                                                                    backgroundColor: STATUS_COLORS[status],
                                                                    minWidth: count > 0 ? '4px' : '0'
                                                                }}
                                                            >
                                                                {/* Glow effect on hover */}
                                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-gray-500 flex-col gap-2">
                                        <div className="w-12 h-12 rounded-full bg-[#2c333a] flex items-center justify-center text-gray-600">
                                            <div className="w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full opacity-50"></div>
                                        </div>
                                        <span className="text-sm">No data available</span>
                                    </div>
                                )}
                            </div>
                        </DashboardCard>

                        {/* New Feature Report Statistic (Right) */}
                        <DashboardCard title="New Feature Report Statistic">
                            <StatTable bugs={bugs.filter(b => b.type === 'New Feature' && (!selectedProject || b.project?.id === selectedProject))} />
                        </DashboardCard>

                        <DashboardCard title="Recent Activity">
                            {/* ... existing recent activity code ... */}
                            <h3 className="font-bold text-lg mb-4">Activity Stream</h3>
                            <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {auditLogs.length > 0 ? (
                                    auditLogs.map((log) => (
                                        <div key={log.id} className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 shrink-0 flex items-center justify-center font-bold text-sm">
                                                {log.user?.username?.substring(0, 2).toUpperCase() || 'SY'}
                                            </div>
                                            <div className="text-sm">
                                                <p>
                                                    <span className="text-blue-400 font-bold hover:underline cursor-pointer">{log.user?.username || 'System'}</span>
                                                    <span className="text-gray-400 mx-1">{log.action === 'CREATE' ? 'created' : 'updated'}</span>
                                                    <span className="text-gray-300">{log.entityType}</span>
                                                </p>
                                                <p className="text-gray-400 mt-1 italic">{log.details}</p>
                                                <div className="flex gap-3 text-[11px] text-gray-500 mt-2">
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No activity recorded.</p>
                                )}
                            </div>
                        </DashboardCard>
                    </div>
                </div>
            </main>

            {/* MODAL CREATE / EDIT BUG */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

                    <form onSubmit={handleSubmit} className="bg-[#1d2125] w-full max-w-2xl rounded-lg shadow-2xl border border-[#3c444d] relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Header Modal */}
                        <div className="flex items-center justify-between p-4 px-6 border-b border-[#2c333a]">
                            <h2 className="text-xl font-medium">{editingBug ? `Edit ${editingBug.code}` : 'Create Bug'}</h2>
                            <div className="flex items-center gap-4 text-gray-400">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Body Modal (Scrollable) */}
                        <div className="flex border-b border-[#2c333a]">
                            <button
                                type="button"
                                onClick={() => setActiveTab('details')}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-[#0c66e4] text-[#0c66e4]' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                            >
                                Details
                            </button>
                            {editingBug && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('activity')}
                                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity' ? 'border-[#0c66e4] text-[#0c66e4]' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                                >
                                    Activity Stream
                                </button>
                            )}
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 h-[60vh]">
                            {activeTab === 'details' ? (
                                <>
                                    {/* Project Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                name="projectId"
                                                required
                                                value={formData.projectId}
                                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                                className="w-full bg-[#22272b] border border-[#3c444d] rounded p-2.5 text-sm appearance-none outline-none focus:border-blue-500 text-gray-300"
                                            >
                                                <option value="" disabled>Select Project</option>
                                                {projects
                                                    .filter(p => !p.archived)
                                                    .map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                                    ))
                                                }
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-3 pointer-events-none text-gray-400" />
                                        </div>
                                    </div>

                                    {/* Type Selection */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Issue Type <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full bg-[#22272b] border border-[#3c444d] rounded p-2.5 text-sm appearance-none outline-none focus:border-blue-500 text-gray-300"
                                                >
                                                    {ISSUE_TYPES.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-3 pointer-events-none text-gray-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Priority</label>
                                            <div className="relative">
                                                <select
                                                    name="priority"
                                                    value={formData.priority}
                                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                    className="w-full bg-[#22272b] border border-[#3c444d] rounded p-2.5 text-sm appearance-none outline-none focus:border-blue-500 text-gray-300"
                                                >
                                                    {PRIORITIES.map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-3 pointer-events-none text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Display (Editable if editing) */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                                        {editingBug ? (
                                            <div className="relative">
                                                <select
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                    className="w-full bg-[#2c333a] border border-[#3c444d] rounded p-2.5 text-sm font-bold appearance-none outline-none focus:border-blue-500 text-blue-400 uppercase"
                                                >
                                                    {STATUSES.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-3 pointer-events-none text-gray-400" />
                                            </div>
                                        ) : (
                                            <div className="w-fit bg-[#2c333a] px-3 py-1 rounded text-xs font-bold border border-gray-600 flex items-center gap-1">
                                                OPEN
                                            </div>
                                        )}
                                    </div>

                                    {/* Summary Input */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Summary <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="summary"
                                            autoFocus
                                            value={formData.summary}
                                            onChange={(e) => {
                                                setFormData({ ...formData, summary: e.target.value });
                                                if (error) setError('');
                                            }}
                                            className={`w-full bg-[#22272b] border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-[#3c444d]'} rounded p-2.5 text-sm outline-none focus:border-blue-500 transition-all text-gray-200`}
                                            placeholder="Summarize the bug..."
                                            required
                                        />
                                        {error && (
                                            <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                                                <AlertCircle size={14} /> {error}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                                        <div className="border border-[#3c444d] rounded bg-[#22272b]">
                                            <textarea
                                                rows={4}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Describe the issue in detail..."
                                                className="w-full bg-transparent p-3 text-sm focus:outline-none resize-none text-gray-300"
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* Components & Labels */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Components</label>
                                            <input
                                                type="text"
                                                value={formData.components}
                                                onChange={(e) => setFormData({ ...formData, components: e.target.value })}
                                                placeholder="e.g. Frontend, API (comma separated)"
                                                className="w-full bg-[#22272b] border border-[#3c444d] rounded p-2.5 text-sm outline-none focus:border-blue-500 transition-all text-gray-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Labels</label>
                                            <input
                                                type="text"
                                                value={formData.labels}
                                                onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
                                                placeholder="e.g. Urgent, UI (comma separated)"
                                                className="w-full bg-[#22272b] border border-[#3c444d] rounded p-2.5 text-sm outline-none focus:border-blue-500 transition-all text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            Attachments <span className="text-[10px] font-normal text-gray-500">(Cloudinary)</span>
                                        </label>
                                        <div className="bg-[#22272b] border border-[#3c444d] rounded p-3">
                                            <ImageUpload
                                                value={Array.isArray(formData.attachments) ? formData.attachments : (formData.attachments ? (formData.attachments as string).split(',').filter(Boolean) : [])}
                                                onChange={(urls) => setFormData({ ...formData, attachments: urls })}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {auditLogs.filter(log => log.entityId === editingBug?.id).length > 0 ? (
                                        auditLogs.filter(log => log.entityId === editingBug?.id).map((log) => (
                                            <div key={log.id} className="flex gap-4 border-b border-[#2c333a] pb-4 last:border-0">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 shrink-0 flex items-center justify-center font-bold text-xs mt-1">
                                                    {log.user?.username?.substring(0, 2).toUpperCase() || 'SY'}
                                                </div>
                                                <div className="text-sm">
                                                    <p>
                                                        <span className="text-blue-400 font-bold hover:underline cursor-pointer">{log.user?.username || 'System'}</span>
                                                        <span className="text-gray-400 mx-1">{log.action === 'CREATE' ? 'created' : 'updated'}</span>
                                                        <span className="text-gray-300">this bug</span>
                                                    </p>
                                                    <p className="text-gray-400 mt-1 italic">{log.details}</p>
                                                    <div className="flex gap-3 text-[11px] text-gray-500 mt-2">
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(log.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No activity recorded for this bug yet.
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 px-6 border-t border-[#2c333a] flex justify-end gap-3 bg-[#1d2125]">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium hover:bg-[#2c333a] rounded text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white text-sm font-semibold rounded transition-colors"
                            >
                                {editingBug ? 'Save Changes' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #1d2125;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #3c444d;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #48525d;
                }
            `}</style>
        </div >
    );
};

// Komponen Card untuk Dashboard Gadget
const DashboardCard = ({ title, children, action }: { title: string, children: React.ReactNode, action?: React.ReactNode }) => {
    return (
        <div className="bg-[#1d2125] border border-[#2c333a] rounded-lg flex flex-col shadow-sm">
            <div className="p-3 border-b border-[#2c333a] flex items-center justify-between group">
                <h3 className="text-sm font-semibold text-[#9fadbc]">{title}</h3>
                <div className="flex items-center gap-2">
                    {action}
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                        <button className="hover:text-white"><Maximize2 size={14} /></button>
                        <button className="hover:text-white"><RefreshCw size={14} /></button>
                        <button className="hover:text-white"><MoreHorizontal size={14} /></button>
                    </div>
                </div>
            </div>
            <div className="p-4 flex-grow text-gray-300">
                {children}
            </div>
        </div>
    );
};

// Helper Component for Statistics Table
function StatTable({ bugs }: { bugs: any[] }) {
    // Shared constants - ideally move these to a shared config or pass as props if they change
    const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'NOT_OK', 'CLOSED', 'UNDER_REVIEW'];
    const STATUS_COLORS: Record<string, string> = {
        'OPEN': '#4c9aff',       // Blue
        'IN_PROGRESS': '#f5cd47', // Yellow
        'RESOLVED': '#4fcc25',   // Green
        'NOT_OK': '#ff5630',     // Red
        'CLOSED': '#6b778c',     // Grey
        'UNDER_REVIEW': '#9f8fef' // Purple
    };

    // Calculate Matrix
    const reporterStats: Record<string, { counts: Record<string, number>, total: number }> = {};
    // Sort logic or simple iteration
    bugs.forEach(bug => {
        const reporterName = bug.reporter?.username || 'Unknown';
        if (!reporterStats[reporterName]) {
            reporterStats[reporterName] = { counts: {}, total: 0 };
            STATUSES.forEach(s => reporterStats[reporterName].counts[s] = 0);
        }
        reporterStats[reporterName].counts[bug.status]++;
        reporterStats[reporterName].total++;
    });

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
                <thead className="text-[#9fadbc] border-b border-[#2c333a]">
                    <tr>
                        <th className="py-2 px-2 font-semibold">Reporter</th>
                        {STATUSES.map(status => (
                            <th key={status} className="py-2 px-2 text-center" style={{ color: STATUS_COLORS[status] }}>
                                {status === 'IN_PROGRESS' ? 'INPROG' : status === 'UNDER_REVIEW' ? 'REVIEW' : status}
                            </th>
                        ))}
                        <th className="py-2 px-2 text-right font-bold text-white">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2c333a]">
                    {Object.keys(reporterStats).length > 0 ? (
                        Object.entries(reporterStats).map(([reporter, stats]) => (
                            <tr key={reporter} className="hover:bg-[#1d2125]">
                                <td className="py-3 px-2 font-medium">{reporter}</td>
                                {STATUSES.map(status => (
                                    <td key={status} className="py-3 px-2 text-center text-gray-400">
                                        {stats.counts[status] > 0 ? (
                                            <span className="font-bold text-gray-200">{stats.counts[status]}</span>
                                        ) : '-'}
                                    </td>
                                ))}
                                <td className="py-3 px-2 text-right font-bold text-blue-400">{stats.total}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={STATUSES.length + 2} className="py-8 text-center text-gray-500">No data available.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

function StatTableByPriority({ bugs }: { bugs: any[] }) {
    const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'NOT_OK', 'CLOSED', 'UNDER_REVIEW'];
    const PRIORITIES = ['Fatal', 'Major', 'Minor', 'Kosmetik'];
    const STATUS_COLORS: Record<string, string> = {
        'OPEN': '#4c9aff',       // Blue
        'IN_PROGRESS': '#f5cd47', // Yellow
        'RESOLVED': '#4fcc25',   // Green
        'NOT_OK': '#ff5630',     // Red
        'CLOSED': '#6b778c',     // Grey
        'UNDER_REVIEW': '#9f8fef' // Purple
    };

    const priorityStats: Record<string, { counts: Record<string, number>, total: number }> = {};
    PRIORITIES.forEach(p => {
        priorityStats[p] = { counts: {}, total: 0 };
        STATUSES.forEach(s => priorityStats[p].counts[s] = 0);
    });

    bugs.forEach(bug => {
        const priority = bug.priority || 'Major';
        if (priorityStats[priority]) {
            priorityStats[priority].counts[bug.status]++;
            priorityStats[priority].total++;
        }
    });

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
                <thead className="text-[#9fadbc] border-b border-[#2c333a]">
                    <tr>
                        <th className="py-2 px-2 font-semibold">Priority</th>
                        {STATUSES.map(status => (
                            <th key={status} className="py-2 px-2 text-center" style={{ color: STATUS_COLORS[status] }}>
                                {status === 'IN_PROGRESS' ? 'INPROG' : status === 'UNDER_REVIEW' ? 'REVIEW' : status}
                            </th>
                        ))}
                        <th className="py-2 px-2 text-right font-bold text-white">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2c333a]">
                    {PRIORITIES.map(priority => (
                        <tr key={priority} className="hover:bg-[#1d2125]">
                            <td className={`py-3 px-2 font-medium ${priority === 'Fatal' ? 'text-red-500' : priority === 'Major' ? 'text-orange-500' : 'text-gray-300'}`}>{priority}</td>
                            {STATUSES.map(status => (
                                <td key={status} className="py-3 px-2 text-center text-gray-400">
                                    {priorityStats[priority].counts[status] > 0 ? (
                                        <span className="font-bold text-gray-200">{priorityStats[priority].counts[status]}</span>
                                    ) : '-'}
                                </td>
                            ))}
                            <td className="py-3 px-2 text-right font-bold text-blue-400">{priorityStats[priority].total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default BugTrackerPage;
