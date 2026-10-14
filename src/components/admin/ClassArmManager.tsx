import React, { useState } from 'react';
import { Layers, Plus, BookOpen, Users, Edit, Save, X, CheckCircle2 } from 'lucide-react';
import { ClassArm, Subject, Staff } from '../../types';

interface ClassArmManagerProps {
  classArms: ClassArm[];
  subjects: Subject[];
  staff: Staff[];
  currentSession: string;
  onSaveClassArm: (arm: ClassArm) => Promise<void>;
  onSaveSubject: (subject: Subject) => Promise<void>;
}

export const ClassArmManager: React.FC<ClassArmManagerProps> = ({
  classArms,
  subjects,
  staff,
  currentSession,
  onSaveClassArm,
  onSaveSubject,
}) => {
  const [activeTab, setActiveTab] = useState<'arms' | 'subjects'>('arms');
  const [editingArm, setEditingArm] = useState<Partial<ClassArm> | null>(null);
  const [editingSubject, setEditingSubject] = useState<Partial<Subject> | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSaveArm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArm?.armName || !editingArm.classLevelId) return;

    setLoading(true);
    try {
      const armId = editingArm.id || `arm-${editingArm.classLevelId}-${editingArm.armName.toLowerCase().replace(/\s+/g, '-')}`;
      const fullName = `${editingArm.classLevelId.toUpperCase()} ${editingArm.armName}`;
      await onSaveClassArm({
        id: armId,
        name: fullName,
        classLevelId: editingArm.classLevelId,
        armName: editingArm.armName,
        classTeacherId: editingArm.classTeacherId || '',
        academicSession: editingArm.academicSession || currentSession,
        capacity: editingArm.capacity || 35,
      });
      setEditingArm(null);
      setMessage(`Class arm ${fullName} saved successfully!`);
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject?.name || !editingSubject.code) return;

    setLoading(true);
    try {
      const subId = editingSubject.id || `sub-${editingSubject.code.toLowerCase()}`;
      await onSaveSubject({
        id: subId,
        code: editingSubject.code.toUpperCase(),
        name: editingSubject.name,
        category: editingSubject.category || 'both',
        isCore: editingSubject.isCore ?? true,
        classLevelIds: editingSubject.classLevelIds || ['jss-1', 'jss-2', 'jss-3', 'sss-1', 'sss-2', 'sss-3'],
      });
      setEditingSubject(null);
      setMessage(`Subject ${editingSubject.name} saved successfully!`);
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Layers className="w-6 h-6 text-emerald-700" />
            <span>Academic Curriculum, Classes & Class Arms</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Junior (JSS 1-3) and Senior (SSS 1-3) secondary class arms, subject curriculum, and assigned class teachers
          </p>
        </div>

        {activeTab === 'arms' ? (
          <button
            onClick={() =>
              setEditingArm({
                classLevelId: 'jss-1',
                armName: '',
                classTeacherId: '',
                academicSession: currentSession,
                capacity: 35,
              })
            }
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Class Arm</span>
          </button>
        ) : (
          <button
            onClick={() =>
              setEditingSubject({
                code: '',
                name: '',
                category: 'both',
                isCore: true,
                classLevelIds: ['jss-1', 'jss-2', 'jss-3'],
              })
            }
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 pb-px">
        <button
          onClick={() => setActiveTab('arms')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'arms' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Class Arms ({classArms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'subjects' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Academic Subjects ({subjects.length})</span>
        </button>
      </div>

      {/* Class Arms Tab */}
      {activeTab === 'arms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classArms.map((arm) => {
            const classTeacher = staff.find((s) => s.id === arm.classTeacherId);
            return (
              <div
                key={arm.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {arm.classLevelId.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Session: {arm.academicSession}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{arm.name}</h3>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Class Teacher:</span>
                      <strong className="text-slate-800">{classTeacher?.fullName || 'Unassigned'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Capacity:</span>
                      <span className="text-slate-700 font-mono">{arm.capacity || 35} Students</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setEditingArm(arm)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Arm</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Core Requirement</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{sub.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{sub.name}</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{sub.category}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.isCore ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {sub.isCore ? 'CORE' : 'ELECTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditingSubject(sub)}
                        className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Arm Edit Modal */}
      {editingArm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingArm.id ? 'Edit Class Arm' : 'Create Class Arm'}
              </h3>
              <button onClick={() => setEditingArm(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Level</label>
                <select
                  value={editingArm.classLevelId}
                  onChange={(e) => setEditingArm({ ...editingArm, classLevelId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="jss-1">JSS 1</option>
                  <option value="jss-2">JSS 2</option>
                  <option value="jss-3">JSS 3</option>
                  <option value="sss-1">SSS 1</option>
                  <option value="sss-2">SSS 2</option>
                  <option value="sss-3">SSS 3</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Arm Name (e.g. Gold, Science A)</label>
                <input
                  type="text"
                  required
                  value={editingArm.armName || ''}
                  onChange={(e) => setEditingArm({ ...editingArm, armName: e.target.value })}
                  placeholder="e.g. Gold, Diamond, Science A"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Class Teacher</label>
                <select
                  value={editingArm.classTeacherId || ''}
                  onChange={(e) => setEditingArm({ ...editingArm, classTeacherId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingArm(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800"
                >
                  Save Arm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Edit Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSubject.id ? 'Edit Academic Subject' : 'Add Academic Subject'}
              </h3>
              <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={editingSubject.code || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MTH, PHY, ENG"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={editingSubject.name || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  placeholder="e.g. Mathematics, English Language"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editingSubject.category || 'both'}
                  onChange={(e) => setEditingSubject({ ...editingSubject, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="both">All Secondary Levels</option>
                  <option value="junior">Junior Secondary Only (JSS 1-3)</option>
                  <option value="senior">Senior Secondary Only (SSS 1-3)</option>
                </select>
              </div>

              <label className="flex items-center space-x-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSubject.isCore ?? true}
                  onChange={(e) => setEditingSubject({ ...editingSubject, isCore: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span className="text-xs font-semibold text-slate-700">Core Compulsory Subject</span>
              </label>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
