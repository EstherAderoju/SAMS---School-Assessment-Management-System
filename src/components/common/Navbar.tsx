import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  User,
  LogOut,
  ChevronDown,
  Shield,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SchoolConfig, StaffRole } from '../../types';

interface NavbarProps {
  schoolConfig: SchoolConfig | null;
  onOpenStaffLogin: () => void;
  onOpenStudentLogin: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  schoolConfig,
  onOpenStaffLogin,
  onOpenStudentLogin,
  activeTab,
  setActiveTab,
}) => {
  const { currentUser, logout, quickSwitchRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'System Administrator';
      case 'principal':
        return 'School Principal';
      case 'vp':
        return 'Vice Principal (Academic)';
      case 'exam_officer':
        return 'Examination Officer';
      case 'class_teacher':
        return 'Class Teacher (JSS 1 Gold)';
      case 'subject_teacher':
        return 'Subject Teacher (Maths/Physics)';
      case 'student':
        return 'Student Portal';
      default:
        return 'Guest';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'principal':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'vp':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'exam_officer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'class_teacher':
      case 'subject_teacher':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'student':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden p-1 shrink-0"
              style={{ backgroundColor: schoolConfig?.primaryColor || '#4169E1' }}
            >
              {schoolConfig?.logoUrl ? (
                <img
                  src={schoolConfig.logoUrl}
                  alt={schoolConfig.schoolName || 'School Crest'}
                  className="w-full h-full object-contain"
                />
              ) : (
                <GraduationCap className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">SAMS</span>
                <span
                  className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-md border"
                  style={{
                    backgroundColor: schoolConfig?.lightBgColor || '#F0F5FF',
                    color: schoolConfig?.primaryColor || '#4169E1',
                    borderColor: schoolConfig?.borderColor || '#D6E3FF',
                  }}
                >
                  Kingsway EdTech
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {schoolConfig?.schoolName || 'Secondary School Assessment System'}
              </p>
            </div>
          </div>

          {/* Academic Session & Term Indicator */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Session: <strong className="text-slate-900">{schoolConfig?.currentSession || '2025/2026'}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              {schoolConfig?.currentTerm || '1st Term'}
            </span>
          </div>

          {/* Right Action & Profile Area */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors shadow-2xs"
                title="Quick Role Switcher for instant testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Role:</span>
                <span className="max-w-[120px] truncate">{currentUser?.role ? getRoleLabel(currentUser.role) : 'Select'}</span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {showRoleMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Evaluate Staff Portals
                  </div>
                  <button
                    onClick={() => quickSwitchRole('admin')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 text-slate-700"
                  >
                    <span className="flex items-center space-x-2">
                      <Shield className="w-3.5 h-3.5 text-purple-600" />
                      <span className="font-medium">System Administrator</span>
                    </span>
                    {currentUser?.role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => quickSwitchRole('principal')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 text-slate-700"
                  >
                    <span className="flex items-center space-x-2">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-medium">Principal</span>
                    </span>
                    {currentUser?.role === 'principal' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => quickSwitchRole('vp')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 text-slate-700"
                  >
                    <span className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-medium">Vice Principal (Academic)</span>
                    </span>
                    {currentUser?.role === 'vp' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => quickSwitchRole('exam_officer')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 text-slate-700"
                  >
                    <span className="flex items-center space-x-2">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-medium">Examination Officer</span>
                    </span>
                    {currentUser?.role === 'exam_officer' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => quickSwitchRole('class_teacher')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 text-slate-700"
                  >
                    <span className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      <span className="font-medium">Class Teacher (JSS 1 Gold)</span>
                    </span>
                    {currentUser?.role === 'class_teacher' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => quickSwitchRole('subject_teacher')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 text-slate-700"
                  >
                    <span className="flex items-center space-x-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                      <span className="font-medium">Subject Teacher (Maths)</span>
                    </span>
                    {currentUser?.role === 'subject_teacher' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Evaluate Student Portal
                  </div>
                  <button
                    onClick={() => quickSwitchRole('student', 'std-001')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 text-slate-700"
                  >
                    <span className="flex items-center space-x-2">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      <div>
                        <p className="font-medium">Chukwuemeka Obi (JSS 1)</p>
                        <p className="text-[10px] text-slate-400">Adm: SAMS/2025/J001</p>
                      </div>
                    </span>
                    {currentUser?.role === 'student' && currentUser.uid === 'std-001' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>
                  <button
                    onClick={() => quickSwitchRole('student', 'std-002')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 text-slate-700"
                  >
                    <span className="flex items-center space-x-2">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      <div>
                        <p className="font-medium">Amina Bello (1st in Class)</p>
                        <p className="text-[10px] text-slate-400">Adm: SAMS/2025/J002</p>
                      </div>
                    </span>
                    {currentUser?.role === 'student' && currentUser.uid === 'std-002' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* User Profile / Portal Buttons */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20">
                    {currentUser.displayName.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{currentUser.displayName}</p>
                    <span
                      className={`inline-block text-[10px] px-1.5 py-0.2 rounded-sm border font-medium ${getRoleBadgeColor(
                        currentUser.role
                      )}`}
                    >
                      {currentUser.role.toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                </button>

                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{currentUser.displayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                    {currentUser.role === 'student' ? (
                      <button
                        onClick={() => setActiveTab('student-portal')}
                        className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 hover:bg-slate-50 text-slate-700"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Student Portal</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 hover:bg-slate-50 text-slate-700"
                      >
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span>Staff Dashboard</span>
                      </button>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenStudentLogin}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                >
                  Student Login
                </button>
                <button
                  onClick={onOpenStaffLogin}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs"
                >
                  Staff Portal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
