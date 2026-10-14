import React from 'react';
import { Award, GraduationCap, CheckCircle2 } from 'lucide-react';
import { ReportCard, SchoolConfig } from '../../types';
import { formatOrdinal } from '../../services/calculationEngine';

interface ReportCardViewProps {
  reportCard: ReportCard;
  schoolConfig: SchoolConfig | null;
}

export const ReportCardView: React.FC<ReportCardViewProps> = ({ reportCard, schoolConfig }) => {
  const config = schoolConfig || {
    schoolName: 'Kingsway Model Secondary School',
    motto: 'Excellence, Knowledge and Character',
    address: '14 Education Boulevard, Victoria Island, Lagos State, Nigeria',
    contactPhone: '+234 803 123 4567',
    contactEmail: 'admissions@kingswayschool.edu.ng',
    primaryColor: '#065F46',
  };

  const domainRatingLabels: Record<number, string> = {
    5: 'Excellent',
    4: 'Very Good',
    3: 'Good',
    2: 'Fair',
    1: 'Poor',
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-lg text-slate-800 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
      {/* School Header */}
      <div className="border-b-2 border-emerald-900 pb-5 mb-6 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-white flex items-center justify-center font-bold text-2xl shadow-md">
            <GraduationCap className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-emerald-950 font-serif">
              {config.schoolName}
            </h1>
            <p className="text-xs sm:text-sm font-semibold italic text-amber-700">
              "{config.motto}"
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          {config.address} • Tel: {config.contactPhone} • Email: {config.contactEmail}
        </p>
        <div className="inline-block mt-3 px-4 py-1 bg-emerald-900 text-white rounded-full text-xs font-bold uppercase tracking-wider">
          Official Continuous Assessment & Termly Academic Report Card
        </div>
      </div>

      {/* Student Meta Details Grid */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4">
          <div>
            <span className="text-slate-400 font-medium block">Student Name:</span>
            <strong className="text-slate-900 font-bold text-sm">{reportCard.studentName}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Admission No:</span>
            <strong className="text-slate-900 font-mono font-bold text-sm">{reportCard.admissionNumber}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Class & Arm:</span>
            <strong className="text-slate-900 font-bold">{reportCard.armName}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Session / Term:</span>
            <strong className="text-emerald-800 font-bold">{reportCard.session} • {reportCard.term}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Class Population:</span>
            <span className="text-slate-800 font-semibold">{reportCard.totalStudentsInArm} Students</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Term Average:</span>
            <strong className="text-slate-900 font-bold text-sm">{reportCard.averageScore}%</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Class Position:</span>
            <strong className="text-emerald-900 font-extrabold text-sm">
              {formatOrdinal(reportCard.classPosition)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Attendance Record:</span>
            <span className="text-slate-800 font-semibold">
              {reportCard.attendance.daysPresent} / {reportCard.attendance.daysOpened} Days ({reportCard.attendance.attendancePercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Subject Scores Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-300">
          <thead className="bg-emerald-900 text-white font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3 border border-emerald-800">Subject</th>
              <th className="py-2.5 px-2 text-center border border-emerald-800">CA1 (10)</th>
              <th className="py-2.5 px-2 text-center border border-emerald-800">CA2 (10)</th>
              <th className="py-2.5 px-2 text-center border border-emerald-800">Exam (80)</th>
              <th className="py-2.5 px-2 text-center border border-emerald-800">Total (100)</th>
              <th className="py-2.5 px-2 text-center border border-emerald-800">Grade</th>
              <th className="py-2.5 px-2 text-center border border-emerald-800">Remark</th>
              <th className="py-2.5 px-2 text-center border border-emerald-800 hidden sm:table-cell">Class Avg</th>
              <th className="py-2.5 px-2 text-center border border-emerald-800 hidden sm:table-cell">Pos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reportCard.subjects.map((sub, idx) => (
              <tr key={sub.subjectId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                  {sub.subjectName}
                </td>
                <td className="py-2 px-2 text-center font-mono border-r border-slate-200">{sub.ca1Score ?? '-'}</td>
                <td className="py-2 px-2 text-center font-mono border-r border-slate-200">{sub.ca2Score ?? '-'}</td>
                <td className="py-2 px-2 text-center font-mono border-r border-slate-200">{sub.examScore}</td>
                <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 border-r border-slate-200">
                  {sub.totalScore}
                </td>
                <td className="py-2 px-2 text-center font-bold text-emerald-800 border-r border-slate-200">
                  {sub.grade}
                </td>
                <td className="py-2 px-2 text-center font-medium text-slate-700 border-r border-slate-200">
                  {sub.remark}
                </td>
                <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200 hidden sm:table-cell">
                  {sub.classAverage || '-'}
                </td>
                <td className="py-2 px-2 text-center font-semibold text-slate-700 hidden sm:table-cell">
                  {formatOrdinal(sub.position)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
            <tr>
              <td className="py-2.5 px-3 uppercase text-slate-900">Total Marks:</td>
              <td colSpan={2} className="py-2.5 px-2 text-center font-mono text-slate-600">
                Out of {reportCard.maxPossibleScore}
              </td>
              <td className="py-2.5 px-2 text-center font-mono text-emerald-900 text-sm">
                {reportCard.totalScore}
              </td>
              <td colSpan={4} className="py-2.5 px-3 text-right text-slate-900">
                Term Average: <span className="text-emerald-900 font-extrabold text-sm">{reportCard.averageScore}%</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Behavioral & Psychomotor Ratings (Standard Nigerian System: 1-5 scale) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
        {/* Affective Domain */}
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
          <h4 className="font-bold text-emerald-950 uppercase text-[11px] mb-2 border-b border-slate-200 pb-1">
            Affective Domain (Character & Conduct)
          </h4>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
            {Object.entries(reportCard.affectiveDomain).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center text-[11px]">
                <span className="capitalize text-slate-600">{key}:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {val}/5 ({domainRatingLabels[val] || 'Good'})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Psychomotor Domain */}
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
          <h4 className="font-bold text-emerald-950 uppercase text-[11px] mb-2 border-b border-slate-200 pb-1">
            Psychomotor Skills (Practical & Physical)
          </h4>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
            {Object.entries(reportCard.psychomotorDomain).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center text-[11px]">
                <span className="capitalize text-slate-600">{key}:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {val}/5 ({domainRatingLabels[val] || 'Good'})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Remarks, Promotion Verdict & Signatures */}
      <div className="space-y-4 border-t-2 border-slate-200 pt-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Class Teacher's Remark:
            </span>
            <p className="text-slate-800 italic font-medium">"{reportCard.classTeacherRemark}"</p>
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
              <span>Signature: __________________</span>
              <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Principal's Remark & Stamp:
            </span>
            <p className="text-slate-800 italic font-medium">"{reportCard.principalRemark}"</p>
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
              <span className="flex items-center space-x-1 text-emerald-800 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>OFFICIALLY SEALED</span>
              </span>
              <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>

        {/* Promotion Status (Visible especially in 3rd term or final session review) */}
        {reportCard.term.includes('3rd') && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Annual Promotion Verdict:</span>
              <p className="text-sm font-extrabold text-emerald-950 uppercase">
                {reportCard.promotionStatus === 'promoted'
                  ? 'PROMOTED TO NEXT HIGHER CLASS'
                  : reportCard.promotionStatus === 'promoted_on_trial'
                  ? 'PROMOTED ON TRIAL'
                  : 'REPEAT CLASS'}
              </p>
            </div>
            <Award className="w-6 h-6 text-emerald-700" />
          </div>
        )}

        {/* Grading Scale Legend */}
        <div className="pt-2 text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 justify-center border-t border-slate-200">
          <span><strong>A1:</strong> 75-100 (Distinction)</span>
          <span><strong>B2-B3:</strong> 65-74 (Very Good)</span>
          <span><strong>C4-C6:</strong> 50-64 (Credit)</span>
          <span><strong>D7-E8:</strong> 40-49 (Pass)</span>
          <span><strong>F9:</strong> 0-39 (Fail)</span>
        </div>
      </div>
    </div>
  );
};
