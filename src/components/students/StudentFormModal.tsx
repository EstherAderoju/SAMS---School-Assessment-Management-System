import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';
import { Student, ClassArm, Subject } from '../../types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => Promise<void>;
  initialStudent?: Student | null;
  classArms: ClassArm[];
  subjects: Subject[];
  currentSession: string;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStudent,
  classArms,
  subjects,
  currentSession,
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    fullName: '',
    admissionNumber: '',
    gender: 'Male',
    dob: '2013-01-01',
    currentClassId: 'jss-1',
    currentArmId: classArms[0]?.id || '',
    currentSession: currentSession,
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    admissionDate: new Date().toISOString().split('T')[0],
    status: 'active',
    assignedSubjectIds: subjects.map((s) => s.id),
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialStudent) {
      setFormData(initialStudent);
    } else {
      setFormData({
        id: `std-${Date.now()}`,
        fullName: '',
        admissionNumber: `SAMS/${currentSession.split('/')[0]}/J${Math.floor(100 + Math.random() * 900)}`,
        gender: 'Male',
        dob: '2013-05-15',
        currentClassId: classArms[0]?.classLevelId || 'jss-1',
        currentArmId: classArms[0]?.id || '',
        currentSession: currentSession,
        parentName: '',
        parentPhone: '+234 ',
        parentEmail: '',
        address: 'Lagos, Nigeria',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'active',
        assignedSubjectIds: subjects.map((s) => s.id),
      });
    }
    setError(null);
  }, [initialStudent, isOpen, classArms, subjects, currentSession]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName?.trim() || !formData.admissionNumber?.trim()) {
      setError('Please provide student full name and valid admission number.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        id: formData.id || `std-${Date.now()}`,
        fullName: formData.fullName.trim(),
        admissionNumber: formData.admissionNumber.trim().toUpperCase(),
        gender: formData.gender || 'Male',
        dob: formData.dob || '2013-01-01',
        currentClassId: formData.currentClassId || 'jss-1',
        currentArmId: formData.currentArmId || classArms[0]?.id || '',
        currentSession: formData.currentSession || currentSession,
        parentName: formData.parentName || '',
        parentPhone: formData.parentPhone || '',
        parentEmail: formData.parentEmail || '',
        address: formData.address || '',
        admissionDate: formData.admissionDate || new Date().toISOString().split('T')[0],
        status: formData.status || 'active',
        assignedSubjectIds: formData.assignedSubjectIds || [],
        createdAt: formData.createdAt || new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving student profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subId: string) => {
    const current = formData.assignedSubjectIds || [];
    if (current.includes(subId)) {
      setFormData({ ...formData, assignedSubjectIds: current.filter((id) => id !== subId) });
    } else {
      setFormData({ ...formData, assignedSubjectIds: [...current, subId] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">
              {initialStudent ? 'Edit Student Profile' : 'Register New Student'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (Surname First)</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Obi Chukwuemeka David"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Number</label>
              <input
                type="text"
                required
                value={formData.admissionNumber}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. SAMS/2025/J042"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Arm</label>
              <select
                value={formData.currentArmId}
                onChange={(e) => {
                  const arm = classArms.find((a) => a.id === e.target.value);
                  setFormData({
                    ...formData,
                    currentArmId: e.target.value,
                    currentClassId: arm?.classLevelId || formData.currentClassId,
                  });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
              >
                {classArms.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {arm.name} ({arm.classLevelId.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
              >
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
                <option value="transferred">Transferred</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Parent Guardian Section */}
          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 mb-2">Parent / Guardian Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Guardian Name</label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="e.g. Chief E. Obi"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Guardian Phone</label>
                <input
                  type="text"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="+234 803 000 0000"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Guardian Email</label>
                <input
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder="parent@example.com"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Residential Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 14 Admiralty Way, Lekki, Lagos"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-hidden"
            />
          </div>

          {/* Subject Enrollment */}
          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 mb-2">Enrolled Subjects</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {subjects.map((sub) => {
                const checked = formData.assignedSubjectIds?.includes(sub.id) || false;
                return (
                  <label
                    key={sub.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubject(sub.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="truncate">{sub.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
