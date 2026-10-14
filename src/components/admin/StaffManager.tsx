import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  BookOpen,
} from 'lucide-react';
import { Staff, StaffRole, ClassArm, Subject } from '../../types';

interface StaffManagerProps {
  staffList: Staff[];
  classArms: ClassArm[];
  subjects: Subject[];
  currentUserId: string;
  currentUserRole: string;
  onSaveStaff: (staff: Staff) => Promise<void>;
}

export const StaffManager: React.FC<StaffManagerProps> = ({
  staffList,
  classArms,
  subjects,
  currentUserId,
  currentUserRole,
  onSaveStaff,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff> | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPromoteToAdmin = currentUserRole === 'admin';

  const handleOpenNew = () => {
    setEditingStaff({
      id: `staff-${Date.now()}`,
      staffId: `SAMS/STF/${Math.floor(10 + Math.random() * 90)}`,
      fullName: '',
      email: '',
      phone: '+234 ',
      role: 'subject_teacher',
      assignedArmIds: [],
      assignedSubjectArmPairs: [],
      isActive: true,
      qualification: 'B.Sc. / B.Ed.',
      createdAt: new Date().toISOString(),
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff?.fullName || !editingStaff.email || !editingStaff.staffId) {
      setError('Please provide staff name, staff ID, and email address.');
      return;
    }

    if (editingStaff.role === 'admin' && !canPromoteToAdmin) {
      setError('Only an authorized System Administrator can create or promote another Administrator.');
      return;
    }

    setLoading(true);
    try {
      await onSaveStaff({
        id: editingStaff.id || `staff-${Date.now()}`,
        staffId: editingStaff.staffId.trim().toUpperCase(),
        fullName: editingStaff.fullName.trim(),
        email: editingStaff.email.trim(),
        phone: editingStaff.phone || '',
        role: editingStaff.role || 'subject_teacher',
        assignedArmIds: editingStaff.assignedArmIds || [],
        assignedSubjectArmPairs: editingStaff.assignedSubjectArmPairs || [],
        isActive: editingStaff.isActive ?? true,
        qualification: editingStaff.qualification || '',
        createdAt: editingStaff.createdAt || new Date().toISOString(),
      });
      setIsModalOpen(false);
      setMessage(`Staff record for ${editingStaff.fullName} saved.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save staff record');
    } finally {
      setLoading(false);
    }
  };

  const toggleArmAssignment = (armId: string) => {
    const list = editingStaff?.assignedArmIds || [];
    if (list.includes(armId)) {
      setEditingStaff({ ...editingStaff, assignedArmIds: list.filter((id) => id !== armId) });
    } else {
      setEditingStaff({ ...editingStaff, assignedArmIds: [...list, armId] });
    }
  };

  const getRoleLabel = (r: StaffRole) => {
    switch (r) {
      case 'admin':
        return 'System Administrator';
      case 'principal':
        return 'School Principal';
      case 'vp':
        return 'Vice Principal (Academic)';
      case 'exam_officer':
        return 'Examination Officer';
      case 'class_teacher':
        return 'Class Teacher';
      case 'subject_teacher':
        return 'Subject Teacher';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-emerald-700" />
            <span>Staff Directory & Academic Role Assignment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorize staff access levels, assign class arms and subjects, and enforce security controls
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((stf) => (
          <div
            key={stf.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs font-bold text-slate-500">{stf.staffId}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    stf.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {stf.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{stf.fullName}</h3>
              <p className="text-xs text-emerald-700 font-semibold">{getRoleLabel(stf.role)}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{stf.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{stf.phone || 'No phone'}</span>
                </div>
                {stf.qualification && (
                  <p className="text-[11px] text-slate-400 italic pt-1">Qual: {stf.qualification}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => handleEdit(stf)}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center space-x-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Permissions</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStaff.fullName ? `Edit: ${editingStaff.fullName}` : 'Register Staff Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStaff.fullName || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, fullName: e.target.value })}
                  placeholder="e.g. Dr. (Mrs.) Victoria Adeleke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff ID</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.staffId || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, staffId: e.target.value })}
                    placeholder="e.g. SAMS/TCH/05"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Role</label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as StaffRole })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="subject_teacher">Subject Teacher</option>
                    <option value="class_teacher">Class Teacher</option>
                    <option value="exam_officer">Examination Officer</option>
                    <option value="vp">Vice Principal</option>
                    <option value="principal">Principal</option>
                    {canPromoteToAdmin && <option value="admin">System Administrator</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={editingStaff.email || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    placeholder="teacher@kingsway.edu.ng"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingStaff.phone || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    placeholder="+234 803 000 0000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={editingStaff.qualification || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, qualification: e.target.value })}
                  placeholder="e.g. B.Sc. Ed. Mathematics"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              {/* Class Teacher Arms Assignment */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Class Arms (as Class Teacher)
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2">
                  {classArms.map((arm) => {
                    const checked = editingStaff.assignedArmIds?.includes(arm.id) || false;
                    return (
                      <label
                        key={arm.id}
                        className={`flex items-center space-x-2 p-1.5 rounded-lg border text-xs cursor-pointer ${
                          checked
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                            : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArmAssignment(arm.id)}
                          className="rounded text-emerald-600"
                        />
                        <span className="truncate">{arm.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editingStaff.isActive ?? true}
                  onChange={(e) => setEditingStaff({ ...editingStaff, isActive: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Account Active and Authorized to Log In
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50"
                >
                  Save Staff Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
