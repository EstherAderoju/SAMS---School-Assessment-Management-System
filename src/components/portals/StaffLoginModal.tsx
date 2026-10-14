import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginAsStaff, loginWithGoogle, quickSwitchRole } = useAuth();
  const [identifier, setIdentifier] = useState('heritage95.EI@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await loginAsStaff(identifier, password);
    setLoading(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Google login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300 mb-3 border border-white/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Academic Staff Portal</h2>
          <p className="text-xs text-emerald-100/90 mt-1">
            Sign in with your official Staff ID or verified school email address
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff ID or Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. SAMS/ADM/01 or heritage95.EI@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff security password"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md shadow-emerald-900/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating Staff...' : 'Sign In to Staff Console'}
            </button>
          </form>

          {/* Google Sign In option */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400 bg-white px-2">
              <span>Or sign in with</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2 px-3 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center space-x-2 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Account ({'heritage95.EI@gmail.com'})</span>
          </button>

          {/* Quick Demo Staff Logins */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>One-Click Role Test:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  quickSwitchRole('admin');
                  onSuccess();
                  onClose();
                }}
                className="text-left p-1.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-[11px] font-medium text-purple-900 transition-colors"
              >
                Admin (Heritage)
              </button>
              <button
                type="button"
                onClick={() => {
                  quickSwitchRole('principal');
                  onSuccess();
                  onClose();
                }}
                className="text-left p-1.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-[11px] font-medium text-amber-900 transition-colors"
              >
                Principal (Dr. Adeleke)
              </button>
              <button
                type="button"
                onClick={() => {
                  quickSwitchRole('exam_officer');
                  onSuccess();
                  onClose();
                }}
                className="text-left p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-[11px] font-medium text-emerald-900 transition-colors"
              >
                Exam Officer (Eze)
              </button>
              <button
                type="button"
                onClick={() => {
                  quickSwitchRole('class_teacher');
                  onSuccess();
                  onClose();
                }}
                className="text-left p-1.5 rounded-lg border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-[11px] font-medium text-teal-900 transition-colors"
              >
                Class Teacher (Mrs. Adebayo)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
