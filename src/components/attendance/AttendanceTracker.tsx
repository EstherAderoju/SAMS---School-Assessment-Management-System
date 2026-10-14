import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Calendar,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Check,
} from 'lucide-react';
import { ClassArm, Student, AttendanceRecord, AttendanceEntry, AttendanceStatus } from '../../types';

interface AttendanceTrackerProps {
  classArms: ClassArm[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  currentSession: string;
  currentTerm: string;
  currentUserId: string;
  onSaveAttendance: (record: AttendanceRecord) => Promise<void>;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  classArms,
  students,
  attendanceRecords,
  currentSession,
  currentTerm,
  currentUserId,
  onSaveAttendance,
}) => {
  const [selectedArmId, setSelectedArmId] = useState<string>(classArms[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const armStudents = students.filter((s) => s.currentArmId === selectedArmId && s.status === 'active');
  const selectedArm = classArms.find((a) => a.id === selectedArmId);

  // Check if register already exists for this date and arm
  useEffect(() => {
    const existing = attendanceRecords.find(
      (r) => r.armId === selectedArmId && r.date === selectedDate
    );

    if (existing && existing.entries.length > 0) {
      setEntries(existing.entries);
    } else {
      // Default all to 'present'
      setEntries(
        armStudents.map((s) => ({
          studentId: s.id,
          admissionNumber: s.admissionNumber,
          studentName: s.fullName,
          status: 'present',
        }))
      );
    }
    setIsSaved(false);
  }, [selectedArmId, selectedDate, attendanceRecords]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, status } : e))
    );
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, note } : e))
    );
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setEntries((prev) => prev.map((e) => ({ ...e, status })));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const recId = `att-${selectedDate}-${selectedArmId}`;
      const record: AttendanceRecord = {
        id: recId,
        armId: selectedArmId,
        classLevelId: selectedArm?.classLevelId || 'jss-1',
        session: currentSession,
        term: currentTerm,
        date: selectedDate,
        recordedBy: currentUserId,
        entries,
        createdAt: new Date().toISOString(),
      };
      await onSaveAttendance(record);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const presentCount = entries.filter((e) => e.status === 'present').length;
  const absentCount = entries.filter((e) => e.status === 'absent').length;
  const lateCount = entries.filter((e) => e.status === 'late').length;
  const excusedCount = entries.filter((e) => e.status === 'excused').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <CalendarCheck2 className="w-6 h-6 text-emerald-700" />
            <span>Daily Attendance Register</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record class roll-call with distinct present, absent, late, and excused statuses with duplicate prevention
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-2 shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Recording...' : 'Submit Daily Register'}</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Attendance register successfully recorded and archived for {selectedDate}.</span>
        </div>
      )}

      {/* Selector & Counter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Class Arm</label>
            <select
              value={selectedArmId}
              onChange={(e) => setSelectedArmId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden font-semibold text-slate-800"
            >
              {classArms.map((arm) => (
                <option key={arm.id} value={arm.id}>
                  {arm.name} ({arm.classLevelId.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Attendance Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden font-medium"
              />
            </div>
          </div>
        </div>

        {/* Attendance Counter Grid */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs md:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-800">Roll Call Statistics</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800">Present</span>
              <p className="text-xl font-black text-emerald-950 mt-0.5">{presentCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-800">Absent</span>
              <p className="text-xl font-black text-rose-950 mt-0.5">{absentCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800">Late</span>
              <p className="text-xl font-black text-amber-950 mt-0.5">{lateCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-800">Excused</span>
              <p className="text-xl font-black text-blue-950 mt-0.5">{excusedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Admission No.</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Remark / Absence Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.studentId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{entry.studentName}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{entry.admissionNumber}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                      {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map((st) => {
                        const active = entry.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(entry.studentId, st)}
                            className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                              active
                                ? st === 'present'
                                  ? 'bg-emerald-700 text-white shadow-2xs'
                                  : st === 'late'
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : st === 'absent'
                                  ? 'bg-rose-700 text-white shadow-2xs'
                                  : 'bg-blue-700 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={entry.note || ''}
                      onChange={(e) => handleNoteChange(entry.studentId, e.target.value)}
                      placeholder="e.g. Clinic pass / Traffic delay..."
                      className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-emerald-600 bg-white"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
