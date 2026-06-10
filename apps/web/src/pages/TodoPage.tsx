import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Plus,
    X,
    Edit3,
    Trash2,
    CalendarDays,
    CheckCircle2,
    Circle,
    Rocket,
    AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';

const PRIORITIES = ['High', 'Medium', 'Low'];
const PRIORITY_COLORS: Record<string, string> = {
    High: 'text-red-400 bg-red-500/10 border-red-500/30',
    Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};
const PRIORITY_DOT: Record<string, string> = {
    High: 'bg-red-400',
    Medium: 'bg-amber-400',
    Low: 'bg-emerald-400',
};

const TodoPage = ({ currentUser, onLogout, onBack }: { currentUser: any; onLogout: () => void; onBack?: () => void }) => {
    const [todos, setTodos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState<any | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
    });

    const fetchTodos = async () => {
        setLoading(true);
        try {
            const res = await api.getTodos();
            if (res.success) {
                setTodos(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch todos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodos();
    }, []);

    const activeTodos = todos.filter(t => t.status !== 'completed');
    const completedTodos = todos.filter(t => t.status === 'completed');

    const openCreateModal = () => {
        setEditingTodo(null);
        setFormData({ title: '', description: '', priority: 'Medium', dueDate: '' });
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (todo: any) => {
        setEditingTodo(todo);
        setFormData({
            title: todo.title || '',
            description: todo.description || '',
            priority: todo.priority || 'Medium',
            dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : '',
        });
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        const payload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
            dueDate: formData.dueDate || null,
        };

        try {
            if (editingTodo) {
                await api.updateTodo(editingTodo.id, payload);
            } else {
                await api.createTodo(payload);
            }
            setIsModalOpen(false);
            fetchTodos();
        } catch (err: any) {
            setError(err.message || 'Failed to save todo');
        }
    };

    const handleToggleStatus = async (todo: any) => {
        const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
        try {
            await api.updateTodo(todo.id, { status: newStatus });
            fetchTodos();
        } catch (err) {
            console.error('Failed to update todo status:', err);
        }
    };

    const handleDelete = async (todo: any) => {
        if (!confirm(`Delete "${todo.title}"?`)) return;
        try {
            await api.deleteTodo(todo.id);
            fetchTodos();
        } catch (err) {
            console.error('Failed to delete todo:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const isOverdue = (dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d < today;
    };

    const displayTodos = activeTab === 'active' ? activeTodos : completedTodos;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-display">
            {/* Navbar */}
            <nav className="h-16 border-b border-[#1e293b] bg-[#020617] flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors text-slate-400"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 size={18} strokeWidth={3} />
                        </div>
                        <h2 className="text-white text-base font-black tracking-tight uppercase italic">
                            Todo List
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider"
                    >
                        <Plus size={14} />
                        <span className="hidden md:inline">Add Todo</span>
                    </button>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-3xl mx-auto p-6">
                {/* Stats */}
                <div className="flex items-center gap-2 mb-6 text-sm text-slate-400">
                    <span className="font-bold text-white text-lg">{activeTodos.length}</span>
                    <span>active task{activeTodos.length !== 1 ? 's' : ''}</span>
                    {completedTodos.length > 0 && (
                        <>
                            <span className="text-slate-600 mx-1">·</span>
                            <span className="text-slate-500">{completedTodos.length} completed</span>
                        </>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-[#0f172a] rounded-lg p-1 border border-[#1e293b] w-fit">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'active' ? 'bg-[#26b9f7] text-[#020617]' : 'text-slate-400 hover:text-white'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'completed' ? 'bg-[#26b9f7] text-[#020617]' : 'text-slate-400 hover:text-white'}`}
                    >
                        Completed
                    </button>
                </div>

                {/* Todo List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-[#26b9f7] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : displayTodos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <CheckCircle2 size={48} className="mb-4 opacity-30" />
                        <p className="text-sm font-medium">
                            {activeTab === 'active'
                                ? 'No active tasks. Add one!'
                                : 'No completed tasks yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayTodos.map((todo) => (
                            <div
                                key={todo.id}
                                className={`group flex items-start gap-3 p-4 rounded-xl border transition-all ${
                                    todo.status === 'completed'
                                        ? 'bg-[#0f172a]/50 border-[#1e293b]/50 opacity-60'
                                        : isOverdue(todo.dueDate)
                                            ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                            : 'bg-[#0f172a] border-[#1e293b] hover:border-[#334155]'
                                }`}
                            >
                                {/* Checkbox */}
                                <button
                                    onClick={() => handleToggleStatus(todo)}
                                    className="mt-0.5 shrink-0 text-slate-500 hover:text-emerald-400 transition-colors"
                                >
                                    {todo.status === 'completed' ? (
                                        <CheckCircle2 size={20} className="text-emerald-400" />
                                    ) : (
                                        <Circle size={20} />
                                    )}
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className={`font-medium text-sm ${todo.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                                                {todo.title}
                                            </h3>
                                            {todo.description && (
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{todo.description}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(todo)}
                                                className="p-1.5 hover:bg-[#1e293b] rounded-lg transition-colors text-slate-500 hover:text-[#26b9f7]"
                                                title="Edit"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(todo)}
                                                className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-slate-500 hover:text-red-400"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-3 mt-2">
                                        {/* Priority Badge */}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${PRIORITY_COLORS[todo.priority] || 'text-slate-400 bg-slate-500/10 border-slate-500/30'}`}>
                                            {todo.priority}
                                        </span>

                                        {/* Due Date */}
                                        {todo.dueDate && (
                                            <span className={`flex items-center gap-1 text-[10px] font-medium ${
                                                isOverdue(todo.dueDate) && todo.status !== 'completed'
                                                    ? 'text-red-400'
                                                    : 'text-slate-500'
                                            }`}>
                                                <CalendarDays size={12} />
                                                {formatDate(todo.dueDate)}
                                                {isOverdue(todo.dueDate) && todo.status !== 'completed' && (
                                                    <span className="text-red-400 font-bold">(Overdue)</span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

                    <form onSubmit={handleSubmit} className="bg-[#0f172a] w-full max-w-lg rounded-xl shadow-2xl border border-[#1e293b] relative animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 px-6 border-b border-[#1e293b]">
                            <h2 className="text-base font-bold text-white">
                                {editingTodo ? 'Edit Todo' : 'New Todo'}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-[#1e293b] rounded-lg text-slate-500 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {/* Title */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Title <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={formData.title}
                                    onChange={(e) => {
                                        setFormData({ ...formData, title: e.target.value });
                                        if (error) setError('');
                                    }}
                                    className={`w-full bg-[#020617] border ${error ? 'border-red-500' : 'border-[#1e293b]'} rounded-lg p-2.5 text-sm outline-none focus:border-[#26b9f7] transition-colors text-white`}
                                    placeholder="What needs to be done?"
                                />
                                {error && (
                                    <p className="text-xs text-red-400 flex items-center gap-1">
                                        <AlertTriangle size={12} /> {error}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#020617] border border-[#1e293b] rounded-lg p-2.5 text-sm outline-none focus:border-[#26b9f7] transition-colors text-white resize-none"
                                    placeholder="Optional details..."
                                />
                            </div>

                            {/* Priority & Due Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                                    <div className="relative">
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full bg-[#020617] border border-[#1e293b] rounded-lg p-2.5 text-sm outline-none focus:border-[#26b9f7] transition-colors text-white appearance-none"
                                        >
                                            {PRIORITIES.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[formData.priority]}`}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full bg-[#020617] border border-[#1e293b] rounded-lg p-2.5 text-sm outline-none focus:border-[#26b9f7] transition-colors text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 p-4 px-6 border-t border-[#1e293b]">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-bold text-[#020617] bg-[#26b9f7] hover:bg-[#22a6e8] rounded-lg transition-colors"
                            >
                                {editingTodo ? 'Save Changes' : 'Add Todo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default TodoPage;
