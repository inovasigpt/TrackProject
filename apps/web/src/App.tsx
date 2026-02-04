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
  AlertTriangle,
  Bug,
  ClipboardCheck,
  Settings,
  ChevronDown,
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
import SuccessModal from './components/modals/SuccessModal';
import ErrorModal from './components/modals/ErrorModal';

// Pages
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  UserApprovalPage,
  ScenarioPage
} from './pages';
import BugTrackerPage from './pages/BugTrackerPage';

// Hooks
import { useProjectData } from './hooks/useProjectData';
import { useAuth } from './hooks/useAuth';

import { Project, Phase } from './types';

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
    changePassword,
    refreshUsers,
    setResetToken
  } = useAuth();

  // Auth View State
  const [authView, setAuthView] = useState('login'); // login, register, forgot, reset
  const [showUserApproval, setShowUserApproval] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'bugtracker' | 'scenarios'>('dashboard');

  // Check URL for reset token
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const path = window.location.pathname;

    if (path === '/reset-password' && token) {
      // Decode token to get email (for display only)
      try {
        const decoded = atob(token);
        const email = decoded.split(':')[0];
        setResetToken({ email, token });
        setAuthView('reset');
        // Clean URL
        window.history.replaceState({}, document.title, '/');
      } catch (e) {
        console.error('Invalid token format');
      }
    }
  }, []);

  // App Data State (Projects & Parameters)
  const {
    projects,
    messages,
    statuses,
    priorities,
    phases,
    streams,
    unreadCount,
    isLoaded,
    error,
    addProject,
    updateProject,
    updatePhase,
    deleteProject,
    markMessageAsRead,
    refreshProjects
  } = useProjectData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<{ project: Project; phase: Phase; info: any } | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filters, setFilters] = useState<{ priorities: string[]; statuses: string[]; streams: string[] }>({ priorities: [], statuses: [], streams: [] });
  const [sortBy, setSortBy] = useState('code_asc');

  // Clean error state when successfully loaded
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    if (error) setShowError(true);
  }, [error]);

  // Separate active and archived projects
  const activeProjects = useMemo(() => projects.filter(p => !p.archived), [projects]);
  const archivedProjects = useMemo(() => projects.filter(p => p.archived), [projects]);

  // Check if any filters are active
  const hasActiveFilters = filters.priorities.length > 0 || filters.statuses.length > 0 || filters.streams.length > 0;

  // Filter only active projects
  const filteredProjects = useMemo(() => {
    if (!hasActiveFilters) return activeProjects;

    return activeProjects.filter(project => {


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

      // Stream filter
      if (filters.streams.length > 0) {
        const projectStreams = Array.isArray(project.stream) ? project.stream : (project.stream ? [String(project.stream)] : []);
        if (!projectStreams.some(s => filters.streams.includes(s))) {
          return false;
        }
      }

      return true;
    });
  }, [activeProjects, filters, hasActiveFilters]);

  // Sort filtered projects
  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];

    const priorityOrder: Record<string, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };

    switch (sortBy) {
      case 'code_asc':
        return sorted.sort((a, b) => a.code.localeCompare(b.code));
      case 'code_desc':
        return sorted.sort((a, b) => b.code.localeCompare(a.code));
      case 'priority_high':
        return sorted.sort((a, b) =>
          (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
        );
      case 'priority_low':
        return sorted.sort((a, b) =>
          (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2)
        );
      case 'status':
        return sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
      case 'stream':
        return sorted.sort((a, b) => {
          const streamA = Array.isArray(a.stream) ? a.stream.join(', ') : (a.stream || '');
          const streamB = Array.isArray(b.stream) ? b.stream.join(', ') : (b.stream || '');
          if (!streamA && !streamB) return 0;
          if (!streamA) return 1;
          if (!streamB) return -1;
          return streamA.localeCompare(streamB);
        });
      default:
        return sorted;
    }
  }, [filteredProjects, sortBy]);

  // ESC key handler to close modals
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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

  // Scroll Sync Refs
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  // Synchronized Scrolling Logic
  useEffect(() => {
    const left = sidebarScrollRef.current;
    const right = timelineScrollRef.current;

    if (!left || !right) return;

    const handleLeftScroll = () => {
      if (!isSyncingLeft.current) {
        isSyncingRight.current = true;
        right.scrollTop = left.scrollTop;
      }
      isSyncingLeft.current = false;
    };

    const handleRightScroll = () => {
      if (!isSyncingRight.current) {
        isSyncingLeft.current = true;
        left.scrollTop = right.scrollTop;
      }
      isSyncingRight.current = false;
    };

    left.addEventListener('scroll', handleLeftScroll);
    right.addEventListener('scroll', handleRightScroll);

    return () => {
      left.removeEventListener('scroll', handleLeftScroll);
      right.removeEventListener('scroll', handleRightScroll);
    };
  }, [isLoaded, authLoaded]);

  // Click outside handler for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileDropdown]);

  // Handlers
  const handleAddProject = async (project: any) => {
    const result = await addProject(project);
    if (result.success) {
      setIsAddProjectModalOpen(false);
      setShowSuccessModal(true);
    }
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(null);
    setEditingProject(project);
  };

  const handleUpdateProject = async (updatedProject: any) => {
    const result = await updateProject(updatedProject.id, updatedProject);
    if (result.success) {
      setEditingProject(null);
      setSuccessMessage('Proyek berhasil diperbarui!');
      setShowSuccessModal(true);
      refreshProjects(); // Refresh to get latest data (including correct user links)
    }
  };

  const handleArchiveProject = (project: any) => {
    updateProject(project.id, { archived: true });
  };

  const handleUnarchiveProject = (project: any) => {
    updateProject(project.id, { archived: false });
  };

  const handleDeletePermanently = (projectId: string) => {
    deleteProject(projectId);
  };

  const handleSavePhase = async (projectId: string, phaseId: string, updates: any) => {
    const result = await updatePhase(projectId, phaseId, updates);
    if (result && result.success) {
      setSuccessMessage('Fase berhasil diperbarui!');
      setShowSuccessModal(true);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(activeProjects);
  };

  const handleExportPDF = () => {
    exportToPDF(activeProjects);
  };

  const handleApplyFilters = (newFilters: { priorities: string[]; statuses: string[]; streams: string[] }) => {
    setFilters(newFilters);
  };

  // Auth Handlers
  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.success) {
      setAuthView('login');
    }
    return result;
  };

  const handleRegister = (userData: any) => {
    return register(userData);
  };

  const handleForgotPassword = async (email: string) => {
    return await requestPasswordReset(email);
  };

  const handleResetPassword = async (newPassword: string) => {
    return await resetPassword(resetToken?.token, newPassword);
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
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#26b9f7] rounded flex items-center justify-center text-[#020617] animate-pulse">
              <Rocket size={18} strokeWidth={3} />
            </div>
            <span className="text-white text-sm font-bold uppercase tracking-widest">Loading...</span>
          </div>
          {/* Visual feedback for slow connections/cold starts */}
          <div className="w-48 h-1 bg-[#1e293b] rounded-full overflow-hidden">
            <div className="h-full bg-[#26b9f7] animate-progressorigin w-full origin-left" style={{ animationDuration: '1.5s', animationIterationCount: 'infinite' }}></div>
          </div>
          <p className="text-[#26b9f7] text-[10px] font-mono animate-pulse">Waking up database...</p>
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

  // Bug Tracker Page
  if (currentView === 'bugtracker') {
    return (
      <BugTrackerPage
        currentUser={currentUser}
        onLogout={handleLogout}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  // UAT Scenario Page
  if (currentView === 'scenarios') {
    return (
      <ScenarioPage
        currentUser={currentUser}
        onBack={() => setCurrentView('dashboard')}
      />
    );
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
        onRefresh={refreshUsers}
      />
    );
  }

  // Main Dashboard (Logged In)
  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 font-display overflow-hidden select-none">

      {/* Error Banner */}
      {showError && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-red-500/90 text-white p-2 flex items-center justify-center gap-2 text-xs font-bold animate-in slide-in-from-top">
          <AlertTriangle size={14} />
          <span>{error}</span>
          <button onClick={() => setShowError(false)} className="ml-2 underline opacity-80 hover:opacity-100">Dismiss</button>
        </div>
      )}

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

          {/* Inbox Button with Badge (Hidden)
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
          */}

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

          {/* Bug Tracker Button */}
          <button
            onClick={() => setCurrentView('bugtracker')}
            className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors text-slate-400"
            title="Bug Tracker"
          >
            <Bug size={20} />
          </button>

          {/* UAT Scenarios Button */}
          <button
            onClick={() => setCurrentView('scenarios')}
            className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors text-slate-400"
            title="UAT Scenarios"
          >
            <ClipboardCheck size={20} />
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
          scrollRef={sidebarScrollRef}
          projects={sortedProjects}
          statuses={statuses}
          priorities={priorities}
          streams={streams}
          isOpen={isSidebarOpen}
          onProjectClick={setSelectedProject}
          onAddProject={() => setIsAddProjectModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFilter={() => setIsFilterOpen(true)}
          onOpenArchived={() => setIsArchivedOpen(true)}
          hasActiveFilters={hasActiveFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Timeline Area */}
        <Timeline
          scrollRef={timelineScrollRef}
          projects={sortedProjects}
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
          phases={phases}
          statuses={statuses}
          priorities={priorities}
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
      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onEdit={(project) => {
          setSelectedProject(null);
          setEditingProject(project);
        }}
        onArchive={(project) => updateProject(project.id, { archived: true })}
        currentUser={currentUser}
        users={users}
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
        currentUser={currentUser}
        users={users}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => setIsSettingsOpen(false)}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        projects={activeProjects}
        currentFilters={filters}
        onApply={handleApplyFilters}
        statuses={statuses}
        priorities={priorities}
        streams={streams}
      />

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={changePassword}
        currentUser={currentUser}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        message={error || 'Terjadi kesalahan'}
      />

    </div>
  );
}

export default App;
