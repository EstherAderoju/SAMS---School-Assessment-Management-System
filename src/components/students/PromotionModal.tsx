import React, { useState } from 'react';
import { X, Award, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Student, ClassArm } from '../../types';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classArms: ClassArm[];
  currentSession: string;
  onPromote: (studentIds: string[], targetArmId: string, nextSession: string) => Promise<void>;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  students,
  classArms,
  currentSession,
  onPromote,
}) => {
  const [sourceArmId, setSourceArmId] = useState<string>(classArms[0]?.id || '');
  const [targetArmId, setTargetArmId] = useState<string>(classArms[1]?.id || '');
  const [nextSession, setNextSession] = useState<string>('2026/2027');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const armStudents = students.filter((s) => s.currentArmId === sourceArmId && s.status === 'active');

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === armStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(armStudents.map((s) => s.id));
    }
  };

  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handlePromote = async () => {
    if (selectedStudentIds.length === 0) return;
    setLoading(true);
    try {
      await onPromote(selectedStudentIds, targetArmId, nextSession);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">Class Promotion & Progression</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Advance eligible students to the next class level and academic session. Historical results and attendance records are permanently preserved.
          </p>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Promoted {selectedStudentIds.length} students to the next academic level!</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Current Class Arm</label>
              <select
                value={sourceArmId}
                onChange={(e) => {
                  setSourceArmId(e.target.value);
                  setSelectedStudentIds([]);
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
              >
                {classArms.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {arm.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Class Arm</label>
              <select
                value={targetArmId}
                onChange={(e) => setTargetArmId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
              >
                {classArms.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {arm.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Academic Session</label>
              <input
                type="text"
                value={nextSession}
                onChange={(e) => setNextSession(e.target.value)}
                placeholder="e.g. 2026/2027"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700">
                Students in Current Arm ({armStudents.length})
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {selectedStudentIds.length === armStudents.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
              {armStudents.map((std) => (
                <label
                  key={std.id}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 text-xs cursor-pointer rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(std.id)}
                      onChange={() => toggleStudent(std.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{std.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{std.admissionNumber}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePromote}
              disabled={loading || selectedStudentIds.length === 0}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Promote ({selectedStudentIds.length}) Students</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
