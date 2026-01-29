import { useState, useMemo } from 'react';
import {
    Users,
    Search,
    Check,
    X,
    Trash2,
    Filter,
    UserCheck,
    UserX,
    Clock,
    Shield,
    AlertCircle,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Power,
    PowerOff,
    UserPlus
} from 'lucide-react';
import CreateUserModal from '../components/modals/CreateUserModal';
import { USER_STATUS } from '../data/initialUsers';
import { User, Role } from '../types';

interface UserApprovalPageProps {
    users: User[];
    roles: Role[];
    onUpdateStatus: (userId: string, status: string) => void;
    onDeleteUser: (userId: string) => void;
    onClose: () => void;
    onRefresh: () => void;
}

interface ConfirmAction {
    type: 'approve' | 'reject' | 'delete' | 'deactivate' | 'activate';
    userId: string;
    username: string;
}

interface SortConfig {
    key: keyof User;
    direction: 'asc' | 'desc';
}

const UserApprovalPage: React.FC<UserApprovalPageProps> = ({ users, roles, onUpdateStatus, onDeleteUser, onClose, onRefresh }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });

    // Get role label from roles array
    const getRoleLabel = (role: string) => {
        const found = roles?.find(r => r.value === role);
        return found ? found.label : role;
    };

    // Filter and sort users
    const filteredUsers = useMemo(() => {
        let result = users.filter(user => {
            // Exclude admin users from the list
            if (user.role === 'admin') return false;

            // Search filter
            const matchesSearch =
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Sort
        result.sort((a, b) => {
            let aVal: string | number = a[sortConfig.key];
            let bVal: string | number = b[sortConfig.key];

            // Handle date comparison
            if (sortConfig.key === 'createdAt') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }

            // Handle string comparison
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [users, searchQuery, statusFilter, sortConfig]);

    // Stats
    const stats = useMemo(() => ({
        total: users.filter(u => u.role !== 'admin').length,
        pending: users.filter(u => u.status === USER_STATUS.PENDING && u.role !== 'admin').length,
        approved: users.filter(u => u.status === USER_STATUS.APPROVED && u.role !== 'admin').length,
        inactive: users.filter(u => u.status === USER_STATUS.INACTIVE && u.role !== 'admin').length
    }), [users]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            [USER_STATUS.PENDING]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            [USER_STATUS.APPROVED]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            [USER_STATUS.REJECTED]: 'bg-red-500/20 text-red-400 border-red-500/30',
            [USER_STATUS.INACTIVE]: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        };
        const labels: Record<string, string> = {
            [USER_STATUS.PENDING]: 'Menunggu',
            [USER_STATUS.APPROVED]: 'Aktif',
            [USER_STATUS.REJECTED]: 'Ditolak',
            [USER_STATUS.INACTIVE]: 'Non-Aktif'
        };
        const icons: Record<string, React.ReactNode> = {
            [USER_STATUS.PENDING]: <Clock size={12} />,
            [USER_STATUS.APPROVED]: <UserCheck size={12} />,
            [USER_STATUS.REJECTED]: <UserX size={12} />,
            [USER_STATUS.INACTIVE]: <PowerOff size={12} />
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles[USER_STATUS.PENDING]}`}>
                {icons[status]}
                {labels[status] || status}
            </span>
        );
    };

    const handleSort = (key: keyof User) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key: keyof User) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-slate-600" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-[#26b9f7]" />
            : <ArrowDown size={14} className="text-[#26b9f7]" />;
    };

    const handleAction = (action: string, userId: string) => {
        if (action === 'approve') {
            onUpdateStatus(userId, USER_STATUS.APPROVED);
        } else if (action === 'reject') {
            // Reject = permanently delete
            onDeleteUser(userId);
        } else if (action === 'delete') {
            onDeleteUser(userId);
        } else if (action === 'deactivate') {
            onUpdateStatus(userId, USER_STATUS.INACTIVE);
        } else if (action === 'activate') {
            onUpdateStatus(userId, USER_STATUS.APPROVED);
        }
        setConfirmAction(null);
    };

    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: keyof User }) => (
        <th
            className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider px-6 py-4 cursor-pointer hover:text-slate-200 transition-colors select-none"
            onClick={() => handleSort(sortKey)}
        >
            <div className="flex items-center gap-1.5">
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="min-h-screen bg-[#020617] font-display">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 border-b border-[#1e293b] bg-[#020617] flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Users className="text-purple-400 w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">Kelola Pengguna</h1>
                        <p className="text-xs text-slate-400">Approval, aktivasi & manajemen akun</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#26b9f7] hover:bg-[#26b9f7]/90 text-[#020617] text-sm font-bold rounded-lg transition-colors shadow-lg shadow-[#26b9f7]/20"
                    >
                        <UserPlus size={16} />
                        <span className="hidden sm:inline">Tambah User</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        Kembali
                    </button>
                </div>
            </header>

            <main className="pt-24 px-6 pb-8 max-w-7xl mx-auto">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-500/20 rounded-lg">
                                <Users size={18} className="text-slate-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total User</span>
                        </div>
                        <p className="text-3xl font-black text-white">{stats.total}</p>
                    </div>
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <Clock size={18} className="text-amber-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</span>
                        </div>
                        <p className="text-3xl font-black text-amber-400">{stats.pending}</p>
                    </div>
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <UserCheck size={18} className="text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktif</span>
                        </div>
                        <p className="text-3xl font-black text-emerald-400">{stats.approved}</p>
                    </div>
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-500/20 rounded-lg">
                                <PowerOff size={18} className="text-slate-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Non-Aktif</span>
                        </div>
                        <p className="text-3xl font-black text-slate-400">{stats.inactive}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Cari username atau email..."
                            className="w-full pl-11 pr-4 py-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-[#26b9f7] transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-400" />
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { value: 'all', label: 'Semua' },
                                { value: USER_STATUS.PENDING, label: 'Pending' },
                                { value: USER_STATUS.APPROVED, label: 'Aktif' },
                                { value: USER_STATUS.INACTIVE, label: 'Non-Aktif' }
                            ].map(filter => (
                                <button
                                    key={filter.value}
                                    onClick={() => setStatusFilter(filter.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${statusFilter === filter.value
                                        ? 'bg-[#26b9f7] text-[#020617]'
                                        : 'bg-[#1e293b] text-slate-400 hover:bg-[#334155]'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#1e293b]">
                                    <SortableHeader label="User" sortKey="username" />
                                    <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Email</th>
                                    <SortableHeader label="Role" sortKey="role" />
                                    <SortableHeader label="Status" sortKey="status" />
                                    <SortableHeader label="Terdaftar" sortKey="createdAt" />
                                    <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                                <Users size={48} strokeWidth={1} />
                                                <p className="text-sm">Tidak ada pengguna ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.username}
                                                        className={`w-10 h-10 rounded-full object-cover border-2 ${user.status === USER_STATUS.INACTIVE ? 'border-slate-600 opacity-50' : 'border-[#1e293b]'}`}
                                                    />
                                                    <span className={`font-bold ${user.status === USER_STATUS.INACTIVE ? 'text-slate-500' : 'text-white'}`}>
                                                        {user.username}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 ${user.status === USER_STATUS.INACTIVE ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-sm ${user.status === USER_STATUS.INACTIVE ? 'text-slate-600' : 'text-slate-300'}`}>
                                                    <Shield size={14} className={user.status === USER_STATUS.INACTIVE ? 'text-slate-600' : 'text-purple-400'} />
                                                    {getRoleLabel(user.role)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                                            <td className={`px-6 py-4 text-sm ${user.status === USER_STATUS.INACTIVE ? 'text-slate-600' : 'text-slate-500'}`}>
                                                {new Date(user.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Pending: Approve or Reject */}
                                                    {user.status === USER_STATUS.PENDING && (
                                                        <>
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'approve', userId: user.id, username: user.username })}
                                                                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                                                                title="Setujui"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'reject', userId: user.id, username: user.username })}
                                                                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                                                title="Tolak & Hapus"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Approved: Deactivate or Delete */}
                                                    {user.status === USER_STATUS.APPROVED && (
                                                        <>
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'deactivate', userId: user.id, username: user.username })}
                                                                className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
                                                                title="Nonaktifkan"
                                                            >
                                                                <PowerOff size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'delete', userId: user.id, username: user.username })}
                                                                className="p-2 bg-slate-500/20 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Inactive: Activate or Delete */}
                                                    {user.status === USER_STATUS.INACTIVE && (
                                                        <>
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'activate', userId: user.id, username: user.username })}
                                                                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                                                                title="Aktifkan"
                                                            >
                                                                <Power size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'delete', userId: user.id, username: user.username })}
                                                                className="p-2 bg-slate-500/20 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${confirmAction.type === 'approve' || confirmAction.type === 'activate' ? 'bg-emerald-500/20' :
                                confirmAction.type === 'deactivate' ? 'bg-amber-500/20' : 'bg-red-500/20'
                                }`}>
                                <AlertCircle size={20} className={
                                    confirmAction.type === 'approve' || confirmAction.type === 'activate' ? 'text-emerald-400' :
                                        confirmAction.type === 'deactivate' ? 'text-amber-400' : 'text-red-400'
                                } />
                            </div>
                            <h3 className="text-lg font-bold text-white">
                                {confirmAction.type === 'approve' && 'Setujui Pengguna'}
                                {confirmAction.type === 'reject' && 'Tolak & Hapus Pengguna'}
                                {confirmAction.type === 'delete' && 'Hapus Pengguna'}
                                {confirmAction.type === 'deactivate' && 'Nonaktifkan Pengguna'}
                                {confirmAction.type === 'activate' && 'Aktifkan Pengguna'}
                            </h3>
                        </div>
                        <p className="text-slate-400 mb-6">
                            {confirmAction.type === 'approve' && `Setujui akun ${confirmAction.username}?`}
                            {confirmAction.type === 'reject' && `Tolak akun ${confirmAction.username}? Akun akan dihapus permanen.`}
                            {confirmAction.type === 'delete' && `Hapus akun ${confirmAction.username}? Tindakan ini tidak dapat dibatalkan.`}
                            {confirmAction.type === 'deactivate' && `Nonaktifkan akun ${confirmAction.username}? Pengguna tidak dapat login.`}
                            {confirmAction.type === 'activate' && `Aktifkan kembali akun ${confirmAction.username}?`}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 px-4 py-3 bg-[#1e293b] hover:bg-[#334155] text-white font-bold rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleAction(confirmAction.type, confirmAction.userId)}
                                className={`flex-1 px-4 py-3 font-bold rounded-xl transition-colors ${confirmAction.type === 'approve' || confirmAction.type === 'activate'
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                                    confirmAction.type === 'deactivate'
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                                        'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                            >
                                {confirmAction.type === 'approve' && 'Setujui'}
                                {confirmAction.type === 'reject' && 'Tolak & Hapus'}
                                {confirmAction.type === 'delete' && 'Hapus'}
                                {confirmAction.type === 'deactivate' && 'Nonaktifkan'}
                                {confirmAction.type === 'activate' && 'Aktifkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            <CreateUserModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={onRefresh}
            />
        </div>
    );
};

export default UserApprovalPage;
