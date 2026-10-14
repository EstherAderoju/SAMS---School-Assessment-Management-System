import React, { useState } from 'react';
import { X, GraduationCap, KeyRound, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginAsStudent, quickSwitchRole } = useAuth();
  const [admissionNumber, setAdmissionNumber] = useState('SAMS/2025/J001');
  const [pin, setPin] = useState('2025');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await loginAsStudent(admissionNumber, pin);
    setLoading(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Student authentication failed. Check your admission number.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-blue-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-indigo-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-300 mb-3 border border-white/20">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Student Portal Login</h2>
          <p className="text-xs text-indigo-200/90 mt-1">
            Access your Continuous Assessment scores, examination results, and official termly report cards
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Admission Number
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  placeholder="e.g. SAMS/2025/J001"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-hidden font-mono uppercase"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                As issued on your official admission letter or ID card
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student Portal PIN / Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN or password"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-hidden font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-900/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Accessing Records...' : 'Enter Student Portal'}
            </button>
          </form>

          {/* Quick Demo Students */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Instant Sample Student Logins:</span>
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  quickSwitchRole('student', 'std-001');
                  onSuccess();
                  onClose();
                }}
                className="w-full text-left p-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-xs text-indigo-900 flex items-center justify-between transition-colors"
              >
                <div>
                  <p className="font-semibold">Chukwuemeka Obi (JSS 1 Gold)</p>
                  <p className="text-[11px] text-indigo-600 font-mono">Adm: SAMS/2025/J001 • 2nd Position</p>
                </div>
                <UserCheck className="w-4 h-4 text-indigo-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  quickSwitchRole('student', 'std-002');
                  onSuccess();
                  onClose();
                }}
                className="w-full text-left p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-xs text-emerald-900 flex items-center justify-between transition-colors"
              >
                <div>
                  <p className="font-semibold">Amina Bello (JSS 1 Gold)</p>
                  <p className="text-[11px] text-emerald-700 font-mono">Adm: SAMS/2025/J002 • 1st Position (88.7%)</p>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
