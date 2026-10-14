import React from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardEdit,
  FileSpreadsheet,
  FileText,
  CalendarCheck2,
  Layers,
  UserCheck,
  Settings,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'admin';

  // Role permissions
  const isAdmin = role === 'admin';
  const isPrincipal = role === 'principal' || role === 'vp';
  const isExamOfficer = role === 'exam_officer';
  const isClassTeacher = role === 'class_teacher';
  const isSubjectTeacher = role === 'subject_teacher';
  const isStudent = role === 'student';

  if (isStudent) {
    return (
      <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="px-3 py-2 mb-4 bg-indigo-950/60 rounded-xl border border-indigo-800/50">
            <div className="flex items-center space-x-2 text-indigo-300 mb-1">
              <GraduationCap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Student Portal</span>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate">{currentUser?.displayName}</p>
            <p className="text-[11px] text-slate-400 font-mono">{currentUser?.studentRecord?.admissionNumber}</p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('student-portal')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'student-portal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Academic Report & Scores</span>
            </button>
          </nav>
        </div>

        <div className="p-3 bg-slate-800/60 rounded-xl text-center text-xs text-slate-400 border border-slate-700/50">
          <p className="font-semibold text-slate-200">Kingsway Portal</p>
          <p className="text-[11px] mt-0.5">Continuous Assessment & Examinations</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        {/* User Role Badge in Sidebar */}
        <div className="px-3 py-2.5 bg-slate-800/70 rounded-xl border border-slate-700/60">
          <div className="flex items-center space-x-2 text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Role Access</span>
          </div>
          <p className="text-xs font-semibold text-white truncate">{currentUser?.displayName || 'Authorized Staff'}</p>
          <p className="text-[11px] text-slate-400 capitalize">{role.replace('_', ' ')}</p>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Main Menu</p>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Students (Admin, Principal, VP, Exam Officer, Class Teacher) */}
          {(isAdmin || isPrincipal || isExamOfficer || isClassTeacher) && (
            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'students'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Student Records</span>
            </button>
          )}

          {/* Continuous Assessments (All teachers & admin) */}
          <button
            onClick={() => setActiveTab('assessments')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'assessments'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Assessments & CBT</span>
          </button>

          {/* Question Banks (All teachers & admin) */}
          <button
            onClick={() => setActiveTab('question-bank')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'question-bank'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Question Banks</span>
          </button>

          {/* Fast Score Entry Grid */}
          <button
            onClick={() => setActiveTab('scores')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'scores'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ClipboardEdit className="w-4 h-4" />
            <span>Score Entry Sheet</span>
          </button>

          {/* Broadsheet & Results Approval */}
          {(isAdmin || isPrincipal || isExamOfficer || isClassTeacher) && (
            <button
              onClick={() => setActiveTab('results')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'results'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Broadsheet & Approval</span>
            </button>
          )}

          {/* Official Report Cards */}
          {(isAdmin || isPrincipal || isExamOfficer || isClassTeacher) && (
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'reports'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Termly Report Cards</span>
            </button>
          )}

          {/* Daily Attendance */}
          {(isAdmin || isPrincipal || isClassTeacher) && (
            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'attendance'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Attendance Register</span>
            </button>
          )}

          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-4 mb-2">
            School Administration
          </p>

          {/* Classes & Arms + Subjects */}
          {(isAdmin || isPrincipal || isExamOfficer) && (
            <button
              onClick={() => setActiveTab('academics')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'academics'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Classes, Arms & Subjects</span>
            </button>
          )}

          {/* Staff Directory & Assignment (Admin only) */}
          {(isAdmin || isPrincipal) && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'staff'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Staff Management</span>
            </button>
          )}

          {/* Configuration & Grading Scales (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>School Settings & Grading</span>
            </button>
          )}
        </nav>
      </div>

      {/* Student View Quick Preview Link for staff */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={() => setActiveTab('student-portal')}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-700/50 rounded-lg text-xs font-medium text-indigo-300 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Preview Student Portal</span>
        </button>
      </div>
    </aside>
  );
};
