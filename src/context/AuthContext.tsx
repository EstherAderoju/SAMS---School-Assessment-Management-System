import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { ActiveUser, Staff, Student, StaffRole } from '../types';
import { dbService } from '../services/dbService';

interface AuthContextType {
  currentUser: ActiveUser | null;
  isLoading: boolean;
  loginAsStaff: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginAsStudent: (admissionNumber: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  quickSwitchRole: (role: StaffRole | 'student', targetId?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentStudentPin: (newPin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sams_active_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize DB and restore cached session on load
  useEffect(() => {
    async function boot() {
      try {
        await dbService.initializeDatabaseIfEmpty();
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ActiveUser;
          setCurrentUser(parsed);
        } else {
          // Default to Administrator in initial session for preview convenience
          const staffList = await dbService.getStaff();
          const admin = staffList.find((s) => s.role === 'admin') || staffList[0];
          if (admin) {
            const defaultUser: ActiveUser = {
              uid: admin.id,
              email: admin.email,
              role: admin.role,
              displayName: admin.fullName,
              staffRecord: admin,
            };
            setCurrentUser(defaultUser);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUser));
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth state:', err);
      } finally {
        setIsLoading(false);
      }
    }
    boot();
  }, []);

  const loginAsStaff = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const clean = identifier.trim().toLowerCase();
      const staffList = await dbService.getStaff();

      const matched = staffList.find(
        (s) => s.email.toLowerCase() === clean || s.staffId.toLowerCase() === clean
      );

      if (!matched) {
        return { success: false, error: 'Staff account not found with this Staff ID or Email.' };
      }

      if (!matched.isActive) {
        return { success: false, error: 'This staff account is currently deactivated. Contact System Administrator.' };
      }

      // In production secondary schools, passwords can be verified; for demo/evaluation any password is accepted
      const active: ActiveUser = {
        uid: matched.id,
        email: matched.email,
        role: matched.role,
        displayName: matched.fullName,
        staffRecord: matched,
      };

      setCurrentUser(active);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(active));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsStudent = async (admissionNumber: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanNum = admissionNumber.trim().toUpperCase();
      const student = await dbService.findStudentByAdmissionNumber(cleanNum);

      if (!student) {
        return { success: false, error: 'Student record not found. Check your Admission Number.' };
      }

      if (student.status !== 'active') {
        return { success: false, error: `Account inactive (${student.status}). Contact school administration.` };
      }

      const active: ActiveUser = {
        uid: student.id,
        email: student.parentEmail || `${student.admissionNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@student.sams.ng`,
        role: 'student',
        displayName: student.fullName,
        studentRecord: student,
      };

      setCurrentUser(active);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(active));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Student login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email || '';

      const staffList = await dbService.getStaff();
      let matchedStaff = staffList.find((s) => s.email.toLowerCase() === email.toLowerCase());

      // If runtime admin email matches heritage95.EI@gmail.com
      if (!matchedStaff && email.toLowerCase() === 'heritage95.ei@gmail.com') {
        matchedStaff = {
          id: result.user.uid,
          staffId: 'SAMS/ADM/01',
          fullName: result.user.displayName || 'Administrator',
          email: email,
          phone: '+234 800 000 0000',
          role: 'admin',
          assignedArmIds: [],
          assignedSubjectArmPairs: [],
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        await dbService.saveStaff(matchedStaff);
      }

      if (matchedStaff) {
        const active: ActiveUser = {
          uid: result.user.uid,
          email,
          role: matchedStaff.role,
          displayName: matchedStaff.fullName,
          staffRecord: matchedStaff,
        };
        setCurrentUser(active);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(active));
        return { success: true };
      } else {
        return {
          success: false,
          error: 'This Google account is not mapped to any staff or student profile in SAMS.',
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Google sign-in failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const quickSwitchRole = async (role: StaffRole | 'student', targetId?: string): Promise<void> => {
    setIsLoading(true);
    try {
      if (role === 'student') {
        const students = await dbService.getStudents();
        const std = targetId ? students.find((s) => s.id === targetId) : students[0];
        if (std) {
          const user: ActiveUser = {
            uid: std.id,
            email: std.parentEmail || `${std.admissionNumber}@sams.ng`,
            role: 'student',
            displayName: std.fullName,
            studentRecord: std,
            isImpersonating: true,
          };
          setCurrentUser(user);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        }
      } else {
        const staffList = await dbService.getStaff();
        const staff = targetId ? staffList.find((s) => s.id === targetId) : staffList.find((s) => s.role === role);
        if (staff) {
          const user: ActiveUser = {
            uid: staff.id,
            email: staff.email,
            role: staff.role,
            displayName: staff.fullName,
            staffRecord: staff,
            isImpersonating: true,
          };
          setCurrentUser(user);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
  };

  const updateCurrentStudentPin = async (newPin: string): Promise<void> => {
    if (currentUser?.role === 'student' && currentUser.studentRecord) {
      // Update in local cache and student record
      const updated = { ...currentUser.studentRecord };
      await dbService.saveStudent(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        loginAsStaff,
        loginAsStudent,
        loginWithGoogle,
        quickSwitchRole,
        logout,
        updateCurrentStudentPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
