import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  History,
  Rocket,
  PanelLeftClose,
  PanelLeft,
  FileText,
  Table,
  CalendarDays,
  Mail,
  LogOut,
  Users,
  Lock,
  ChevronDown,
  Shield,
  Settings,
} from 'lucide-react';

// Components
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import AuditSlideOver from './components/AuditSlideOver';
import AddProjectModal from './components/modals/AddProjectModal';
import EditPhaseModal from './components/modals/EditPhaseModal';
import ProjectDetailModal from './components/modals/ProjectDetailModal';
import EditProjectModal from './components/modals/EditProjectModal';
import SettingsModal from './components/modals/SettingsModal';
import FilterModal from './components/modals/FilterModal';
import ArchivedProjectsModal from './components/modals/ArchivedProjectsModal';
import DailyOverviewSlideOver from './components/modals/DailyOverviewModal';
import InboxSlideOver from './components/modals/InboxModal';
import ChangePasswordModal from './components/modals/ChangePasswordModal';

// Pages
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  UserApprovalPage
} from './pages';

// Hooks
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';

// Export utilities
import { exportToCSV, exportToPDF } from './utils/exportUtils';

function App() {
  // Auth State
  const {
    currentUser,
    users,
    roles,
    activeRoles,
    isLoaded: authLoaded,
    isAuthenticated,
    isAdmin,
    resetToken,
    login,
    logout,
    register,
    updateUserStatus,
    deleteUser,
    requestPasswordReset,
    resetPassword,
    changePassword
  } = useAuth();

  // Auth View State
  const [authView, setAuthView] = useState('login'); // login, register, forgot, reset
  const [showUserApproval, setShowUserApproval] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const profileDropdownRef = useRef(null);

  // Dashboard State
  const { projects, messages, unreadCount, isLoaded, addProject, updateProject, updatePhase, deleteProject, markMessageAsRead } = useLocalStorage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [filters, setFilters] = useState({ pics: [], priorities: [], statuses: [] });

  // Separate active and archived projects
  const activeProjects = useMemo(() => projects.filter(p => !p.archived), [projects]);
  const archivedProjects = useMemo(() => projects.filter(p => p.archived), [projects]);

  // Check if any filters are active
  const hasActiveFilters = filters.pics.length > 0 || filters.priorities.length > 0 || filters.statuses.length > 0;

  // Filter only active projects
  const filteredProjects = useMemo(() => {
    if (!hasActiveFilters) return activeProjects;

    return activeProjects.filter(project => {
      // PIC filter
      if (filters.pics.length > 0) {
        const projectPics = project.pics
          ? project.pics.map(p => p.name)
          : project.pic ? [project.pic.name] : [];
        if (!filters.pics.some(pic => projectPics.includes(pic))) {
          return false;
        }
      }

      // Priority filter
      if (filters.priorities.length > 0) {
        if (!filters.priorities.includes(project.priority || 'Medium')) {
          return false;
        }
      }

      // Status filter
      if (filters.statuses.length > 0) {
        if (!filters.statuses.includes(project.status)) {
          return false;
        }
      }

      return true;
    });
  }, [activeProjects, filters, hasActiveFilters]);

  // ESC key handler to close modals
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (showProfileDropdown) {
        setShowProfileDropdown(false);
      } else if (showChangePassword) {
        setShowChangePassword(false);
      } else if (showUserApproval) {
        setShowUserApproval(false);
      } else if (isInboxOpen) {
        setIsInboxOpen(false);
      } else if (isOverviewOpen) {
        setIsOverviewOpen(false);
      } else if (isArchivedOpen) {
        setIsArchivedOpen(false);
      } else if (editingProject) {
        setEditingProject(null);
      } else if (isAddProjectModalOpen) {
        setIsAddProjectModalOpen(false);
      } else if (isSettingsOpen) {
        setIsSettingsOpen(false);
      } else if (isFilterOpen) {
        setIsFilterOpen(false);
      } else if (selectedPhase) {
        setSelectedPhase(null);
      } else if (selectedProject) {
        setSelectedProject(null);
      } else if (isAuditOpen) {
        setIsAuditOpen(false);
      }
    }
  }, [showProfileDropdown, showChangePassword, showUserApproval, isInboxOpen, isOverviewOpen, isArchivedOpen, editingProject, isAddProjectModalOpen, isSettingsOpen, isFilterOpen, selectedPhase, selectedProject, isAuditOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Click outside handler for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileDropdown]);

  // Handlers
  const handleAddProject = (project) => {
    addProject(project);
    setIsAddProjectModalOpen(false);
  };

  const handleEditProject = (project) => {
    setSelectedProject(null);
    setEditingProject(project);
  };

  const handleUpdateProject = (updatedProject) => {
    updateProject(updatedProject.id, updatedProject);
    setEditingProject(null);
  };

  const handleArchiveProject = (project) => {
    updateProject(project.id, { ...project, archived: true });
  };

  const handleUnarchiveProject = (project) => {
    updateProject(project.id, { ...project, archived: false });
  };

  const handleDeletePermanently = (projectId) => {
    deleteProject(projectId);
  };

  const handleSavePhase = (projectId, phaseId, updates) => {
    updatePhase(projectId, phaseId, updates);
  };

  const handleExportCSV = () => {
    exportToCSV(activeProjects);
  };

  const handleExportPDF = () => {
    exportToPDF(activeProjects);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Auth Handlers
  const handleLogin = (email, password) => {
    const result = login(email, password);
    if (result.success) {
      setAuthView('login');
    }
    return result;
  };

  const handleRegister = (userData) => {
    return register(userData);
  };

  const handleForgotPassword = (email) => {
    const result = requestPasswordReset(email);
    if (result.success) {
      setAuthView('reset');
    }
    return result;
  };

  const handleResetPassword = (newPassword) => {
    const result = resetPassword(newPassword);
    if (result.success) {
      setAuthView('login');
    }
    return result;
  };

  const handleLogout = () => {
    logout();
    setAuthView('login');
    setShowUserApproval(false);
  };

  // Loading state
  if (!authLoaded || !isLoaded) {
    return (
      <div className="flex h-screen bg-[#020617] items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#26b9f7] rounded flex items-center justify-center text-[#020617] animate-pulse">
            <Rocket size={18} strokeWidth={3} />
          </div>
          <span className="text-white text-sm font-bold uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    );
  }

  // Auth Pages (Not Logged In)
  if (!isAuthenticated) {
    switch (authView) {
      case 'register':
        return (
          <RegisterPage
            onRegister={handleRegister}
            onBack={() => setAuthView('login')}
            roles={activeRoles}
          />
        );
      case 'forgot':
        return (
          <ForgotPasswordPage
            onSubmit={handleForgotPassword}
            onBack={() => setAuthView('login')}
          />
        );
      case 'reset':
        return (
          <ResetPasswordPage
            email={resetToken?.email}
            onSubmit={handleResetPassword}
            onBack={() => setAuthView('login')}
          />
        );
      default:
        return (
          <LoginPage
            onLogin={handleLogin}
            onForgotPassword={() => setAuthView('forgot')}
            onRegister={() => setAuthView('register')}
          />
        );
    }
  }

  // Admin User Approval Page
  if (showUserApproval && isAdmin) {
    return (
      <UserApprovalPage
        users={users}
        roles={roles}
        onUpdateStatus={updateUserStatus}
        onDeleteUser={deleteUser}
        onClose={() => setShowUserApproval(false)}
      />
    );
  }

  // Main Dashboard (Logged In)
  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 font-display overflow-hidden select-none">

      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-[#1e293b] bg-[#020617] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors text-slate-400"
          >
            {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#26b9f7] rounded flex items-center justify-center text-[#020617] shadow-lg shadow-[#26b9f7]/20">
              <Rocket size={18} strokeWidth={3} />
            </div>
            <h2 className="text-white text-base font-black tracking-tight uppercase italic hidden sm:block">
              Track Project
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Buttons */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider"
            title="Export to CSV"
          >
            <Table size={14} />
            <span className="hidden md:inline">CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider"
            title="Export to PDF"
          >
            <FileText size={14} />
            <span className="hidden md:inline">PDF</span>
          </button>

          <div className="w-px h-6 bg-[#1e293b] mx-1"></div>

          {/* Daily Overview Button */}
          <button
            onClick={() => {
              setIsOverviewOpen(!isOverviewOpen);
              setIsInboxOpen(false);
              setIsAuditOpen(false);
            }}
            className={`p-2 hover:bg-[#1e293b] rounded-lg transition-colors ${isOverviewOpen ? 'text-[#26b9f7]' : 'text-slate-400'}`}
            title="Ringkasan Hari Ini"
          >
            <CalendarDays size={20} />
          </button>

          {/* Inbox Button with Badge */}
          <button
            onClick={() => {
              setIsInboxOpen(!isInboxOpen);
              setIsOverviewOpen(false);
              setIsAuditOpen(false);
            }}
            className={`p-2 hover:bg-[#1e293b] rounded-lg transition-colors relative ${isInboxOpen ? 'text-purple-400' : 'text-slate-400'}`}
            title="Inbox"
          >
            <Mail size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setIsAuditOpen(!isAuditOpen);
              setIsOverviewOpen(false);
              setIsInboxOpen(false);
            }}
            className={`p-2 hover:bg-[#1e293b] rounded-lg transition-colors ${isAuditOpen ? 'text-[#26b9f7]' : 'text-slate-400'}`}
          >
            <History size={20} />
          </button>

          <div className="w-px h-6 bg-[#1e293b] mx-1"></div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 p-1.5 hover:bg-[#1e293b] rounded-xl transition-colors"
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-white">{currentUser?.username}</span>
                <span className="text-[10px] text-slate-500 uppercase">{currentUser?.role.replace('_', ' ')}</span>
              </div>
              <div className="h-8 w-8 rounded-full border-2 border-[#26b9f7]/30 p-0.5 overflow-hidden">
                <img
                  src={currentUser?.avatar || "https://i.pravatar.cc/100?u=admin"}
                  className="w-full h-full rounded-full object-cover"
                  alt="User"
                />
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-right z-50">
                {/* User Info Header */}
                <div className="p-4 border-b border-[#1e293b]">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser?.avatar}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#1e293b]"
                      alt="User"
                    />
                    <div>
                      <p className="font-bold text-white text-sm">{currentUser?.username}</p>
                      <p className="text-xs text-slate-400">{currentUser?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  {/* Admin: User Management */}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setShowUserApproval(true);
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-[#1e293b] rounded-lg transition-colors"
                      >
                        <div className="p-1.5 bg-purple-500/20 rounded-lg">
                          <Users size={16} className="text-purple-400" />
                        </div>
                        <div>
                          <span className="font-medium">Kelola Pengguna</span>
                          <p className="text-xs text-slate-500">Approval & manajemen user</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-[#1e293b] rounded-lg transition-colors"
                      >
                        <div className="p-1.5 bg-slate-500/20 rounded-lg">
                          <Settings size={16} className="text-slate-400" />
                        </div>
                        <div>
                          <span className="font-medium">Pengaturan</span>
                          <p className="text-xs text-slate-500">Konfigurasi aplikasi</p>
                        </div>
                      </button>
                    </>
                  )}

                  {/* Change Password */}
                  <button
                    onClick={() => {
                      setShowChangePassword(true);
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-[#1e293b] rounded-lg transition-colors"
                  >
                    <div className="p-1.5 bg-[#26b9f7]/20 rounded-lg">
                      <Lock size={16} className="text-[#26b9f7]" />
                    </div>
                    <div>
                      <span className="font-medium">Ubah Password</span>
                      <p className="text-xs text-slate-500">Ganti password akun</p>
                    </div>
                  </button>

                  <div className="my-2 border-t border-[#1e293b]"></div>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <div className="p-1.5 bg-red-500/20 rounded-lg">
                      <LogOut size={16} className="text-red-400" />
                    </div>
                    <span className="font-medium">Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex pt-16 overflow-hidden relative">

        {/* Left Sidebar */}
        <Sidebar
          projects={filteredProjects}
          isOpen={isSidebarOpen}
          onProjectClick={setSelectedProject}
          onAddProject={() => setIsAddProjectModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFilter={() => setIsFilterOpen(true)}
          onOpenArchived={() => setIsArchivedOpen(true)}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Timeline Area */}
        <Timeline
          projects={filteredProjects}
          onPhaseClick={setSelectedPhase}
        />

        {/* Audit Slide-over */}
        <AuditSlideOver
          isOpen={isAuditOpen}
          onClose={() => setIsAuditOpen(false)}
        />

        {/* Daily Overview Slide-over */}
        <DailyOverviewSlideOver
          isOpen={isOverviewOpen}
          onClose={() => setIsOverviewOpen(false)}
          projects={activeProjects}
        />

        {/* Inbox Slide-over */}
        <InboxSlideOver
          isOpen={isInboxOpen}
          onClose={() => setIsInboxOpen(false)}
          messages={messages}
          onMarkAsRead={markMessageAsRead}
        />
      </main>

      {/* Modals */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onSubmit={handleAddProject}
      />

      <EditPhaseModal
        data={selectedPhase}
        onClose={() => setSelectedPhase(null)}
        onSave={handleSavePhase}
      />

      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onEdit={handleEditProject}
        onArchive={handleArchiveProject}
      />

      <EditProjectModal
        project={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSubmit={handleUpdateProject}
      />

      <ArchivedProjectsModal
        isOpen={isArchivedOpen}
        onClose={() => setIsArchivedOpen(false)}
        archivedProjects={archivedProjects}
        onUnarchive={handleUnarchiveProject}
        onDeletePermanently={handleDeletePermanently}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        projects={activeProjects}
        currentFilters={filters}
        onApply={handleApplyFilters}
      />

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={changePassword}
        currentUser={currentUser}
      />


    </div>
  );
}

export default App;
