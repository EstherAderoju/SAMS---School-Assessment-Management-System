import React, { useState } from 'react';
import { X, User, BookOpen, Award, FileText, Printer, CheckCircle2 } from 'lucide-react';
import { Student, TermResult, ReportCard, SchoolConfig, Subject } from '../../types';
import { ReportCardView } from '../reports/ReportCardView';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  termResults: TermResult[];
  reportCards: ReportCard[];
  schoolConfig: SchoolConfig | null;
  subjects: Subject[];
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  termResults,
  reportCards,
  schoolConfig,
  subjects,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'results' | 'report'>('profile');
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(reportCards[0] || null);

  if (!isOpen) return null;

  const studentResults = termResults.filter((r) => r.studentId === student.id);
  const studentReports = reportCards.filter((r) => r.studentId === student.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800/50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl font-bold border border-white/20">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold">{student.fullName}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-400/20 text-emerald-200">
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 font-mono mt-0.5">
                Adm: {student.admissionNumber} • {student.gender} • DOB: {student.dob}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 space-x-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'profile' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
            }`}
          >
            Student Dossier
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'results' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
            }`}
          >
            Subject Grades ({studentResults.length})
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'report' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
            }`}
          >
            Official Report Cards ({studentReports.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-medium">Guardian Name:</span>
                  <strong className="text-slate-900 font-bold">{student.parentName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Guardian Contact:</span>
                  <strong className="text-slate-900">{student.parentPhone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email:</span>
                  <span className="text-slate-700">{student.parentEmail || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Admission Date:</span>
                  <span className="text-slate-700">{student.admissionDate}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Residential Address:</span>
                  <span className="text-slate-700">{student.address}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Curriculum Subjects Assigned</h4>
                <div className="flex flex-wrap gap-1.5">
                  {student.assignedSubjectIds.map((subId) => {
                    const sub = subjects.find((s) => s.id === subId);
                    return (
                      <span
                        key={subId}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-[11px] font-semibold"
                      >
                        {sub?.name || subId}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-2 text-center">CA (30)</th>
                    <th className="py-2.5 px-2 text-center">Exam (70)</th>
                    <th className="py-2.5 px-2 text-center">Total (100)</th>
                    <th className="py-2.5 px-2 text-center">Grade</th>
                    <th className="py-2.5 px-2 text-center">Remark</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentResults.map((r) => {
                    const sub = subjects.find((s) => s.id === r.subjectId);
                    return (
                      <tr key={r.id}>
                        <td className="py-2 px-3 font-semibold text-slate-900">{sub?.name || r.subjectId}</td>
                        <td className="py-2 px-2 text-center font-mono">{r.caTotal}</td>
                        <td className="py-2 px-2 text-center font-mono">{r.examScore}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">{r.finalScore}</td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-800">{r.grade}</td>
                        <td className="py-2 px-2 text-center text-slate-600">{r.remark}</td>
                        <td className="py-2 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-4">
              {studentReports.length > 0 ? (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-700">Termly Report Card Preview</span>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Report</span>
                    </button>
                  </div>
                  <ReportCardView reportCard={selectedReport || studentReports[0]} schoolConfig={schoolConfig} />
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No published report card yet for this student.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
