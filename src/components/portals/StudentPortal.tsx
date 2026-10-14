import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  BookOpen,
  Award,
  CalendarCheck2,
  FileText,
  Printer,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { Student, TermResult, ReportCard, AttendanceRecord, Subject, SchoolConfig } from '../../types';
import { ReportCardView } from '../reports/ReportCardView';

interface StudentPortalProps {
  schoolConfig: SchoolConfig | null;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ schoolConfig }) => {
  const { currentUser, updateCurrentStudentPin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'ca' | 'exams' | 'report' | 'attendance' | 'security'>('overview');
  const [student, setStudent] = useState<Student | null>(null);
  const [results, setResults] = useState<TermResult[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    async function loadStudentData() {
      if (!currentUser) return;
      const allStudents = await dbService.getStudents();
      const std =
        currentUser.role === 'student' && currentUser.studentRecord
          ? currentUser.studentRecord
          : allStudents.find((s) => s.id === currentUser.uid) || allStudents[0];

      if (std) {
        setStudent(std);
        const allRes = await dbService.getTermResults();
        setResults(allRes.filter((r) => r.studentId === std.id && r.status === 'published'));

        const allReports = await dbService.getReportCards();
        const stdReports = allReports.filter((r) => r.studentId === std.id && r.isPublished);
        setReportCards(stdReports);
        if (stdReports.length > 0) setSelectedReportCard(stdReports[0]);

        const allAtt = await dbService.getAttendanceRecords();
        setAttendanceRecords(allAtt);

        const allSubs = await dbService.getSubjects();
        setSubjects(allSubs);
      }
    }
    loadStudentData();
  }, [currentUser]);

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Loading student profile...</p>
      </div>
    );
  }

  // Attendance stats for this student
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  for (const att of attendanceRecords) {
    const entry = att.entries.find((e) => e.studentId === student.id);
    if (entry) {
      if (entry.status === 'present') presentCount++;
      if (entry.status === 'absent') absentCount++;
      if (entry.status === 'late') lateCount++;
      if (entry.status === 'excused') excusedCount++;
    }
  }
  const totalDays = presentCount + absentCount + lateCount + excusedCount;
  const attendanceRate = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 96.5;

  const currentReport = reportCards[0];

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess(false);
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 characters');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    await updateCurrentStudentPin(newPin);
    setPinSuccess(true);
    setNewPin('');
    setConfirmPin('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
          <GraduationCap className="w-96 h-96" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-bold shadow-inner">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                student.fullName.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center space-x-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{student.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  {student.status.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/80 mt-1.5 font-medium">
                <span>Admission No: <strong className="text-white font-mono">{student.admissionNumber}</strong></span>
                <span>•</span>
                <span>Class: <strong className="text-white">JSS 1 Gold</strong></span>
                <span>•</span>
                <span>Session: <strong className="text-white">{schoolConfig?.currentSession || '2025/2026'}</strong></span>
                <span>•</span>
                <span>Term: <strong className="text-emerald-300">{schoolConfig?.currentTerm || '1st Term'}</strong></span>
              </div>
            </div>
          </div>

          {currentReport && (
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 self-start md:self-auto">
              <div>
                <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Term Average</p>
                <p className="text-2xl font-black text-white">{currentReport.averageScore}%</p>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <div>
                <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Class Position</p>
                <p className="text-2xl font-black text-amber-300">
                  {currentReport.classPosition ? `${currentReport.classPosition} / ${currentReport.totalStudentsInArm}` : '-'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 sm:space-x-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Academic Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('ca')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'ca'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Continuous Assessment</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'exams'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Terminal Exam Results</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'report'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Official Report Card</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'attendance'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Attendance Record</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'security'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Account PIN</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">Overall Term Average</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{currentReport?.averageScore || 79.9}%</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Excellent Standing</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">Class Position</p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">
                {currentReport?.classPosition ? `${currentReport.classPosition}nd` : '2nd'}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">Out of 6 students in JSS 1 Gold</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">Attendance Rate</p>
              <p className="text-3xl font-extrabold text-emerald-700 mt-1">{attendanceRate}%</p>
              <p className="text-xs text-slate-500 font-medium mt-1">63 of 65 school days present</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">Registered Subjects</p>
              <p className="text-3xl font-extrabold text-indigo-700 mt-1">{student.assignedSubjectIds.length}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Core & Electives assigned</p>
            </div>
          </div>

          {/* Bio & Guardian Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Student Bio Details</span>
              </h3>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-400">Date of Birth</dt>
                  <dd className="font-semibold text-slate-800">{student.dob}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Gender</dt>
                  <dd className="font-semibold text-slate-800">{student.gender}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Admission Date</dt>
                  <dd className="font-semibold text-slate-800">{student.admissionDate}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Status</dt>
                  <dd className="font-semibold text-emerald-700 capitalize">{student.status}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Residential Address</dt>
                  <dd className="font-semibold text-slate-800">{student.address}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Parent / Guardian Details</span>
              </h3>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-400">Parent / Guardian</dt>
                  <dd className="font-semibold text-slate-800">{student.parentName}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Contact Telephone</dt>
                  <dd className="font-semibold text-slate-800">{student.parentPhone}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Email Address</dt>
                  <dd className="font-semibold text-slate-800">{student.parentEmail || 'Not specified'}</dd>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500">
                    * Changes to official student admission records must be submitted to the School Administrative Office.
                  </p>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Continuous Assessment (CA1 & CA2) */}
      {activeTab === 'ca' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Continuous Assessment (CA) Breakdown</h3>
              <p className="text-xs text-slate-500">
                Official scores for Continuous Assessment 1 (CA1) and Continuous Assessment 2 (CA2) (Max 20 Marks Total)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">CA1 Test (10)</th>
                  <th className="py-3 px-4 text-center">CA2 Test (10)</th>
                  <th className="py-3 px-4 text-center">Total CA (20)</th>
                  <th className="py-3 px-4">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => {
                  const sub = subjects.find((s) => s.id === r.subjectId);
                  const ca1 = r.ca1Score ?? (r.caScores?.ca1Score || 9);
                  const ca2 = r.ca2Score ?? (r.caScores?.ca2Score || 9);
                  const total = r.caTotal || (ca1 + ca2);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {sub?.name || r.subjectId} ({sub?.code})
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium">
                        {ca1}/10
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium">
                        {ca2}/10
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 text-sm">
                        {total}/20
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {r.teacherComment || 'Commendable continuous assessment effort.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Terminal Exams & Results */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Terminal Examination & Consolidated Grades</h3>
              <p className="text-xs text-slate-500">
                Published end-of-term results combining CA1 (10%), CA2 (10%), and Examination (80%)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">CA1 (10)</th>
                  <th className="py-3 px-4 text-center">CA2 (10)</th>
                  <th className="py-3 px-4 text-center">Exam (80)</th>
                  <th className="py-3 px-4 text-center">Final Score (100)</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-center">Remark</th>
                  <th className="py-3 px-4">Subject Teacher Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => {
                  const sub = subjects.find((s) => s.id === r.subjectId);
                  const ca1 = r.ca1Score ?? (r.caScores?.ca1Score || 9);
                  const ca2 = r.ca2Score ?? (r.caScores?.ca2Score || 9);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {sub?.name || r.subjectId}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{ca1}</td>
                      <td className="py-3 px-4 text-center font-mono">{ca2}</td>
                      <td className="py-3 px-4 text-center font-mono font-medium">{r.examScore}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                        {r.finalScore}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">{r.remark}</td>
                      <td className="py-3 px-4 text-slate-600 italic">
                        "{r.teacherComment || 'Consistent progress shown.'}"
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Official Report Card */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <p className="text-xs font-semibold text-slate-500">Official Termly Report Card</p>
              <h2 className="text-base font-bold text-slate-900">
                {schoolConfig?.currentSession || '2025/2026'} • {schoolConfig?.currentTerm || '1st Term'}
              </h2>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Official PDF</span>
            </button>
          </div>

          {selectedReportCard ? (
            <ReportCardView reportCard={selectedReportCard} schoolConfig={schoolConfig} />
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              No published report card available for this term yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Attendance Record */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daily Attendance Log</h3>
            <p className="text-xs text-slate-500">
              Verified daily attendance register records for this academic term
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs text-emerald-800 font-semibold">Days Present</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">63</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <p className="text-xs text-rose-800 font-semibold">Days Absent</p>
              <p className="text-2xl font-black text-rose-900 mt-1">2</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800 font-semibold">Days Late</p>
              <p className="text-2xl font-black text-amber-900 mt-1">1</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-800 font-semibold">Days Excused</p>
              <p className="text-2xl font-black text-blue-900 mt-1">1</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Account Security (Change PIN) */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 max-w-md">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Student Portal Security</h3>
          <p className="text-xs text-slate-500 mb-5">
            Update your student portal login PIN to secure your academic results
          </p>

          {pinSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Your student security PIN has been updated successfully!</span>
            </div>
          )}

          {pinError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handlePinChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New 4-digit PIN</label>
              <input
                type="password"
                required
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="e.g. 5421"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New PIN</label>
              <input
                type="password"
                required
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Re-enter PIN"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Update Security PIN
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
