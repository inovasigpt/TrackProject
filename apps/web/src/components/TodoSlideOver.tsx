import { useState, useEffect } from 'react';
import {
    X, Plus, Edit3, Trash2, CalendarDays,
    CheckCircle2, Circle, AlertTriangle, ListTodo,
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

interface TodoSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
}

const TodoSlideOver: React.FC<TodoSlideOverProps> = ({ isOpen, onClose }) => {
    const [todos, setTodos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
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
        if (isOpen) {
            fetchTodos();
        }
    }, [isOpen]);

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

        const payload: Record<string, any> = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
        };
        if (formData.dueDate) {
            payload.dueDate = formData.dueDate;
        }

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
            setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, status: newStatus } : t));
        } catch (err) {
            console.error('Failed to update todo status:', err);
        }
    };

    const handleDelete = async (todo: any) => {
        try {
            await api.deleteTodo(todo.id);
            setTodos(prev => prev.filter(t => t.id !== todo.id));
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
        <>
            <aside
                className={`
                    bg-[#0f172a]/95 backdrop-blur-xl border-l border-[#1e293b] 
                    flex flex-col shrink-0 z-50 transition-all duration-300 
                    fixed top-16 bottom-0 right-0 
                    ${isOpen ? 'w-80' : 'w-0 opacity-0 pointer-events-none'}
                `}
            >
                {/* Header */}
                <div className="p-4 border-b border-[#1e293b] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center">
                            <ListTodo size={14} className="text-emerald-400" />
                        </div>
                        <h3 className="text-white text-[10px] font-black uppercase tracking-widest">
                            Todo List
                        </h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={openCreateModal}
                            className="p-1.5 hover:bg-[#1e293b] rounded-lg transition-colors text-slate-500 hover:text-emerald-400"
                            title="Add Todo"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-[#1e293b] rounded-lg transition-colors text-slate-500 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-3 border-b border-[#1e293b]">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            activeTab === 'active'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Active ({activeTodos.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            activeTab === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Done ({completedTodos.length})
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : displayTodos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                            <CheckCircle2 size={32} className="mb-3 opacity-30" />
                            <p className="text-[10px] font-medium">
                                {activeTab === 'active' ? 'No active tasks' : 'No completed tasks'}
                            </p>
                            {activeTab === 'active' && (
                                <button
                                    onClick={openCreateModal}
                                    className="mt-2 text-[10px] text-emerald-400 hover:underline"
                                >
                                    Add one now
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="p-3 space-y-2">
                            {displayTodos.map((todo) => (
                                <div
                                    key={todo.id}
                                    className={`group flex items-start gap-2.5 p-3 rounded-lg border transition-all ${
                                        todo.status === 'completed'
                                            ? 'bg-[#020617]/40 border-[#1e293b]/40 opacity-60'
                                            : isOverdue(todo.dueDate)
                                                ? 'bg-red-500/5 border-red-500/20'
                                                : 'bg-[#020617]/60 border-[#1e293b] hover:border-[#334155]'
                                    }`}
                                >
                                    <button
                                        onClick={() => handleToggleStatus(todo)}
                                        className="mt-0.5 shrink-0 text-slate-600 hover:text-emerald-400 transition-colors"
                                    >
                                        {todo.status === 'completed' ? (
                                            <CheckCircle2 size={16} className="text-emerald-400" />
                                        ) : (
                                            <Circle size={16} />
                                        )}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                            <h4 className={`text-[11px] font-medium leading-tight ${
                                                todo.status === 'completed' ? 'line-through text-slate-500' : 'text-white'
                                            }`}>
                                                {todo.title}
                                            </h4>
                                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(todo)}
                                                    className="p-1 hover:bg-[#1e293b] rounded transition-colors text-slate-600 hover:text-[#26b9f7]"
                                                >
                                                    <Edit3 size={11} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(todo)}
                                                    className="p-1 hover:bg-red-500/10 rounded transition-colors text-slate-600 hover:text-red-400"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[todo.priority] || 'text-slate-500 bg-slate-500/10 border-slate-500/30'}`}>
                                                {todo.priority}
                                            </span>
                                            {todo.dueDate && (
                                                <span className={`flex items-center gap-1 text-[9px] font-medium ${
                                                    isOverdue(todo.dueDate) && todo.status !== 'completed'
                                                        ? 'text-red-400'
                                                        : 'text-slate-500'
                                                }`}>
                                                    <CalendarDays size={10} />
                                                    {formatDate(todo.dueDate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

                    <form onSubmit={handleSubmit} className="bg-[#0f172a] w-full max-w-sm rounded-xl shadow-2xl border border-[#1e293b] relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-[#1e293b]">
                            <h2 className="text-sm font-bold text-white">
                                {editingTodo ? 'Edit Todo' : 'New Todo'}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-[#1e293b] rounded-lg text-slate-500 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
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
                                    className={`w-full bg-[#020617] border ${error ? 'border-red-500' : 'border-[#1e293b]'} rounded-lg p-2 text-xs outline-none focus:border-emerald-500 transition-colors text-white`}
                                    placeholder="What needs to be done?"
                                />
                                {error && (
                                    <p className="text-[9px] text-red-400 flex items-center gap-1">
                                        <AlertTriangle size={10} /> {error}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#020617] border border-[#1e293b] rounded-lg p-2 text-xs outline-none focus:border-emerald-500 transition-colors text-white resize-none"
                                    placeholder="Optional details..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full bg-[#020617] border border-[#1e293b] rounded-lg p-2 text-xs outline-none focus:border-emerald-500 transition-colors text-white appearance-none"
                                    >
                                        {PRIORITIES.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full bg-[#020617] border border-[#1e293b] rounded-lg p-2 text-xs outline-none focus:border-emerald-500 transition-colors text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 p-4 border-t border-[#1e293b]">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-xs font-bold text-[#020617] bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
                            >
                                {editingTodo ? 'Save' : 'Add'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default TodoSlideOver;
