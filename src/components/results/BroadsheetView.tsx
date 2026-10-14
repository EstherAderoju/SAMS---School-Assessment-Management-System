import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Eye,
  Download,
  AlertTriangle,
  History,
  Award,
} from 'lucide-react';
import { ClassArm, Subject, Student, TermResult, SchoolConfig } from '../../types';
import { formatOrdinal } from '../../services/calculationEngine';

interface BroadsheetViewProps {
  classArms: ClassArm[];
  subjects: Subject[];
  students: Student[];
  termResults: TermResult[];
  schoolConfig: SchoolConfig | null;
  currentUserId: string;
  currentUserRole: string;
  onApproveResults: (resultIds: string[], status: 'approved' | 'published' | 'rejected') => Promise<void>;
  onGenerateReportCards: (armId: string) => Promise<void>;
}

export const BroadsheetView: React.FC<BroadsheetViewProps> = ({
  classArms,
  subjects,
  students,
  termResults,
  schoolConfig,
  currentUserId,
  currentUserRole,
  onApproveResults,
  onGenerateReportCards,
}) => {
  const [selectedArmId, setSelectedArmId] = useState<string>(classArms[0]?.id || '');
  const [selectedAuditResult, setSelectedAuditResult] = useState<TermResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const canApprove =
    currentUserRole === 'admin' ||
    currentUserRole === 'principal' ||
    currentUserRole === 'vp' ||
    currentUserRole === 'exam_officer';

  const armStudents = students.filter((s) => s.currentArmId === selectedArmId && s.status === 'active');
  const armResults = termResults.filter((r) => r.armId === selectedArmId);

  // Group status
  const pendingApproval = armResults.filter((r) => r.status === 'submitted');
  const approvedCount = armResults.filter((r) => r.status === 'approved');
  const publishedCount = armResults.filter((r) => r.status === 'published');
  const draftCount = armResults.filter((r) => r.status === 'draft');

  const handleApproveAll = async () => {
    setIsProcessing(true);
    try {
      const ids = pendingApproval.map((r) => r.id);
      await onApproveResults(ids, 'approved');
      setActionMessage(`Approved ${ids.length} submitted subject results.`);
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublishAll = async () => {
    setIsProcessing(true);
    try {
      const ids = armResults.map((r) => r.id);
      await onApproveResults(ids, 'published');
      await onGenerateReportCards(selectedArmId);
      setActionMessage(`Published official term results and generated student report cards!`);
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Compute student overall summary on broadsheet
  const studentRows = armStudents.map((std) => {
    const stdResults = armResults.filter((r) => r.studentId === std.id);
    const totalMarks = stdResults.reduce((sum, r) => sum + r.finalScore, 0);
    const avgScore = stdResults.length > 0 ? Math.round((totalMarks / stdResults.length) * 10) / 10 : 0;
    return {
      student: std,
      results: stdResults,
      totalMarks,
      avgScore,
    };
  });

  // Sort descending by average to derive rank
  const sortedByAvg = [...studentRows].sort((a, b) => b.avgScore - a.avgScore);
  const rankMap: Record<string, number> = {};
  sortedByAvg.forEach((item, index) => {
    rankMap[item.student.id] = index + 1;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
            <span>Master Class Broadsheet & Results Approval</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated school result sheet across all subjects with multi-tier examination verification
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canApprove && pendingApproval.length > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Submitted ({pendingApproval.length})</span>
            </button>
          )}

          {canApprove && (
            <button
              onClick={handlePublishAll}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Publish & Generate Report Cards</span>
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Class Selector & Verification Status Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-700">Class Arm:</label>
          <select
            value={selectedArmId}
            onChange={(e) => setSelectedArmId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden font-semibold text-slate-800"
          >
            {classArms.map((arm) => (
              <option key={arm.id} value={arm.id}>
                {arm.name} ({arm.classLevelId.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Workflow Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            Draft: {draftCount.length}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
            Submitted: {pendingApproval.length}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200">
            Approved: {approvedCount.length}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
            Published: {publishedCount.length}
          </span>
        </div>
      </div>

      {/* Broadsheet Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 border-r border-slate-200 sticky left-0 bg-slate-100 z-10 w-48">
                  Student Name & Adm. No.
                </th>
                {subjects.slice(0, 6).map((sub) => (
                  <th key={sub.id} className="py-3 px-2 border-r border-slate-200 text-center min-w-[130px]">
                    <div className="font-bold text-slate-900">{sub.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">CA1+CA2 | Exam | Tot | Grd</div>
                  </th>
                ))}
                <th className="py-3 px-3 border-r border-slate-200 text-center font-bold text-slate-900">
                  Total (Marks)
                </th>
                <th className="py-3 px-3 border-r border-slate-200 text-center font-bold text-slate-900">
                  Average (%)
                </th>
                <th className="py-3 px-3 text-center font-bold text-emerald-900">
                  Arm Position
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentRows.map((row, idx) => {
                const pos = rankMap[row.student.id] || idx + 1;
                return (
                  <tr key={row.student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 px-3 border-r border-slate-200 sticky left-0 bg-inherit z-10">
                      <div className="font-bold text-slate-900">{row.student.fullName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{row.student.admissionNumber}</div>
                    </td>

                    {subjects.slice(0, 6).map((sub) => {
                      const res = row.results.find((r) => r.subjectId === sub.id);
                      const ca1 = res ? res.ca1Score ?? (res.caScores?.ca1Score || 0) : 0;
                      const ca2 = res ? res.ca2Score ?? (res.caScores?.ca2Score || 0) : 0;
                      return (
                        <td
                          key={sub.id}
                          className="py-2 px-2 border-r border-slate-200 text-center cursor-pointer hover:bg-emerald-50/50 transition-colors"
                          onClick={() => res && setSelectedAuditResult(res)}
                          title="Click to view score audit trail"
                        >
                          {res ? (
                            <div className="font-mono text-[10px] leading-tight">
                              <span className="text-emerald-700 font-semibold" title="CA1">{ca1}</span>
                              <span className="text-slate-300 mx-0.5">+</span>
                              <span className="text-indigo-700 font-semibold" title="CA2">{ca2}</span>
                              <span className="text-slate-300 mx-1">|</span>
                              <span className="text-slate-700" title="Exam">{res.examScore}</span>
                              <span className="text-slate-300 mx-1">=</span>
                              <span className="font-bold text-slate-900">{res.finalScore}</span>
                              <span className="text-slate-300 mx-1">|</span>
                              <span className="font-bold text-emerald-700">{res.grade}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-900">
                      {row.totalMarks}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-emerald-800 text-sm">
                      {row.avgScore}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {formatOrdinal(pos)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Modal */}
      {selectedAuditResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Score Audit Trail & Approval Log
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Subject Result #{selectedAuditResult.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditResult(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
              <div>
                <span className="text-slate-400 block">CA Total:</span>
                <strong className="text-slate-800 font-mono">{selectedAuditResult.caTotal}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Exam Score:</span>
                <strong className="text-slate-800 font-mono">{selectedAuditResult.examScore}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Final Mark:</span>
                <strong className="text-emerald-800 font-mono text-sm">{selectedAuditResult.finalScore} ({selectedAuditResult.grade})</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Workflow Status:</span>
                <strong className="text-indigo-800 uppercase font-semibold">{selectedAuditResult.status}</strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Change Log & Approval Chain</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedAuditResult.auditTrail?.map((log, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Action: {log.action}</span>
                      <span className="text-slate-400">{new Date(log.timestamp).toLocaleString('en-GB')}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      By User ID: <code className="text-slate-800 font-mono">{log.userId}</code> ({log.userRole})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAuditResult(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
