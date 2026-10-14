import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardEdit,
  Save,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Award,
  Layers,
  FileSpreadsheet,
  X,
  HelpCircle,
} from 'lucide-react';
import {
  Assessment,
  ClassArm,
  Subject,
  Student,
  ScoreRecord,
  Staff,
  SchoolConfig,
  TermAssessmentComponent,
} from '../../types';
import { RubricGradingModal } from './RubricGradingModal';
import { getGradeForScore } from '../../services/calculationEngine';

interface ScoreEntrySheetProps {
  assessments: Assessment[];
  classArms: ClassArm[];
  subjects: Subject[];
  students: Student[];
  scoreRecords: ScoreRecord[];
  schoolConfig: SchoolConfig | null;
  currentUserId: string;
  currentUserRole: string;
  currentUser?: any;
  selectedAssessmentId?: string;
  onSaveScores: (records: ScoreRecord[]) => Promise<void>;
  onSubmitForApproval: (armId: string, subjectId: string) => Promise<void>;
}

export const ScoreEntrySheet: React.FC<ScoreEntrySheetProps> = ({
  assessments,
  classArms,
  subjects,
  students,
  scoreRecords,
  schoolConfig,
  currentUserId,
  currentUserRole,
  currentUser,
  selectedAssessmentId,
  onSaveScores,
  onSubmitForApproval,
}) => {
  const isTeacher =
    currentUserRole === 'class_teacher' || currentUserRole === 'subject_teacher';
  const staffRec: Staff | undefined = currentUser?.staffRecord;

  // Determine authorized Class Arms and Subjects
  const authorizedArms = useMemo(() => {
    if (!isTeacher) return classArms;
    if (!staffRec) return classArms;

    const allowedArmIds = new Set<string>();
    (staffRec.assignedArmIds || []).forEach((id) => allowedArmIds.add(id));
    (staffRec.assignedSubjectArmPairs || []).forEach((p) => allowedArmIds.add(p.armId));

    const filtered = classArms.filter((a) => allowedArmIds.has(a.id));
    return filtered.length > 0 ? filtered : classArms;
  }, [classArms, isTeacher, staffRec]);

  const [selectedArmId, setSelectedArmId] = useState<string>(
    authorizedArms[0]?.id || classArms[0]?.id || ''
  );

  const authorizedSubjectsForSelectedArm = useMemo(() => {
    if (!isTeacher) return subjects;
    if (!staffRec) return subjects;

    const allowedSubjectIds = new Set(
      (staffRec.assignedSubjectArmPairs || [])
        .filter((p) => p.armId === selectedArmId)
        .map((p) => p.subjectId)
    );

    const filtered = subjects.filter((s) => allowedSubjectIds.has(s.id));
    return filtered.length > 0 ? filtered : subjects;
  }, [subjects, isTeacher, staffRec, selectedArmId]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    authorizedSubjectsForSelectedArm[0]?.id || subjects[0]?.id || ''
  );

  // Active Assessment Component: 'ALL' | 'CA1' | 'CA2' | 'EXAM'
  const [activeComponent, setActiveComponent] = useState<'ALL' | TermAssessmentComponent>('ALL');

  // Scores state: key = `${assessmentId}_${studentId}`
  const [localScores, setLocalScores] = useState<
    Record<string, { score: number | null; status: 'normal' | 'ABS' | 'EXC' | 'EXP' }>
  >({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Bulk CSV Score Import Modal State
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [csvFileContent, setCsvFileContent] = useState('');
  const [csvParsedPreview, setCsvParsedPreview] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Assessment structure weights & max scores
  const struct = schoolConfig?.assessmentStructure || {
    ca1MaxScore: 10,
    ca1Weight: 10,
    ca2MaxScore: 10,
    ca2Weight: 10,
    examMaxScore: 80,
    examWeight: 80,
    totalMaxScore: 100,
    totalWeight: 100,
  };

  // Find or create the 3 components for this arm & subject
  const currentAssessments = useMemo(() => {
    let list = assessments.filter(
      (a) => a.armId === selectedArmId && a.subjectId === selectedSubjectId
    );

    // If any component is missing, synthesize temporary assessment entry
    const hasCA1 = list.some((a) => a.component === 'CA1');
    const hasCA2 = list.some((a) => a.component === 'CA2');
    const hasExam = list.some(
      (a) => a.component === 'EXAM' || a.assessmentType === 'terminal_exam'
    );

    const result = [...list];
    if (!hasCA1) {
      result.push({
        id: `asm-ca1-${selectedArmId}-${selectedSubjectId}`,
        title: 'Continuous Assessment 1 (CA1)',
        component: 'CA1',
        assessmentType: 'written',
        subjectId: selectedSubjectId,
        classLevelId: classArms.find((a) => a.id === selectedArmId)?.classLevelId || 'jss-1',
        armId: selectedArmId,
        session: schoolConfig?.currentSession || '2025/2026',
        term: schoolConfig?.currentTerm || '1st Term',
        assignedTeacherId: currentUserId,
        maxScore: struct.ca1MaxScore,
        weightPercent: struct.ca1Weight,
        assessmentDate: new Date().toISOString().split('T')[0],
        status: 'published',
        createdAt: new Date().toISOString(),
      });
    }
    if (!hasCA2) {
      result.push({
        id: `asm-ca2-${selectedArmId}-${selectedSubjectId}`,
        title: 'Continuous Assessment 2 (CA2)',
        component: 'CA2',
        assessmentType: 'written',
        subjectId: selectedSubjectId,
        classLevelId: classArms.find((a) => a.id === selectedArmId)?.classLevelId || 'jss-1',
        armId: selectedArmId,
        session: schoolConfig?.currentSession || '2025/2026',
        term: schoolConfig?.currentTerm || '1st Term',
        assignedTeacherId: currentUserId,
        maxScore: struct.ca2MaxScore,
        weightPercent: struct.ca2Weight,
        assessmentDate: new Date().toISOString().split('T')[0],
        status: 'published',
        createdAt: new Date().toISOString(),
      });
    }
    if (!hasExam) {
      result.push({
        id: `asm-exam-${selectedArmId}-${selectedSubjectId}`,
        title: 'End-of-Term Examination',
        component: 'EXAM',
        assessmentType: 'terminal_exam',
        subjectId: selectedSubjectId,
        classLevelId: classArms.find((a) => a.id === selectedArmId)?.classLevelId || 'jss-1',
        armId: selectedArmId,
        session: schoolConfig?.currentSession || '2025/2026',
        term: schoolConfig?.currentTerm || '1st Term',
        assignedTeacherId: currentUserId,
        maxScore: struct.examMaxScore,
        weightPercent: struct.examWeight,
        assessmentDate: new Date().toISOString().split('T')[0],
        status: 'published',
        createdAt: new Date().toISOString(),
      });
    }

    // Sort order: CA1, CA2, EXAM
    return result.sort((a, b) => {
      const order = { CA1: 1, CA2: 2, EXAM: 3 };
      const compA = a.component || (a.assessmentType === 'terminal_exam' ? 'EXAM' : 'CA1');
      const compB = b.component || (b.assessmentType === 'terminal_exam' ? 'EXAM' : 'CA1');
      return (order[compA] || 9) - (order[compB] || 9);
    });
  }, [assessments, selectedArmId, selectedSubjectId, classArms, schoolConfig, currentUserId, struct]);

  // Visible assessments based on component tab filter
  const visibleAssessments = useMemo(() => {
    if (activeComponent === 'ALL') return currentAssessments;
    return currentAssessments.filter(
      (a) =>
        a.component === activeComponent ||
        (activeComponent === 'EXAM' && a.assessmentType === 'terminal_exam')
    );
  }, [currentAssessments, activeComponent]);

  // Students in selected class arm
  const armStudents = useMemo(() => {
    return students.filter((s) => s.currentArmId === selectedArmId && s.status === 'active');
  }, [students, selectedArmId]);

  // Load scores into local map
  useEffect(() => {
    const map: Record<string, { score: number | null; status: 'normal' | 'ABS' | 'EXC' | 'EXP' }> = {};
    for (const rec of scoreRecords) {
      const key = `${rec.assessmentId}_${rec.studentId}`;
      let status: 'normal' | 'ABS' | 'EXC' | 'EXP' = 'normal';
      if (rec.isAbsent) status = 'ABS';
      else if (rec.isExcused) status = 'EXC';
      else if (rec.isExempt) status = 'EXP';

      map[key] = {
        score: rec.score,
        status,
      };
    }
    setLocalScores(map);
    setSaveStatus('saved');
    setValidationErrors({});
  }, [selectedArmId, selectedSubjectId, scoreRecords]);

  // Synchronize selected subject when arm changes
  useEffect(() => {
    if (authorizedSubjectsForSelectedArm.length > 0) {
      if (!authorizedSubjectsForSelectedArm.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(authorizedSubjectsForSelectedArm[0].id);
      }
    }
  }, [selectedArmId, authorizedSubjectsForSelectedArm, selectedSubjectId]);

  // Handle Score Input
  const handleScoreChange = (assessment: Assessment, student: Student, valStr: string) => {
    const key = `${assessment.id}_${student.id}`;
    const errors = { ...validationErrors };

    if (valStr.trim() === '') {
      setLocalScores((prev) => ({ ...prev, [key]: { score: null, status: 'normal' } }));
      delete errors[key];
      setValidationErrors(errors);
      setSaveStatus('dirty');
      return;
    }

    const num = parseFloat(valStr);
    const max = assessment.maxScore || 10;
    if (isNaN(num)) {
      errors[key] = 'Enter a valid number';
    } else if (num < 0) {
      errors[key] = 'Negative scores disallowed';
    } else if (num > max) {
      errors[key] = `Cannot exceed ${max}`;
    } else {
      delete errors[key];
    }

    setValidationErrors(errors);
    setLocalScores((prev) => ({
      ...prev,
      [key]: { score: isNaN(num) ? null : num, status: 'normal' },
    }));
    setSaveStatus('dirty');
  };

  // Status toggle (Normal, ABS, EXC, EXP)
  const handleStatusChange = (
    assessmentId: string,
    studentId: string,
    newStatus: 'normal' | 'ABS' | 'EXC' | 'EXP'
  ) => {
    const key = `${assessmentId}_${studentId}`;
    setLocalScores((prev) => ({
      ...prev,
      [key]: {
        score: newStatus === 'normal' ? prev[key]?.score ?? null : null,
        status: newStatus,
      },
    }));
    setSaveStatus('dirty');
  };

  // Save records
  const handleSave = async () => {
    setSaveStatus('saving');
    const recordsToSave: ScoreRecord[] = [];

    for (const std of armStudents) {
      for (const asm of currentAssessments) {
        const key = `${asm.id}_${std.id}`;
        const item = localScores[key];

        recordsToSave.push({
          id: `score-${asm.id}-${std.id}`,
          assessmentId: asm.id,
          component: asm.component,
          studentId: std.id,
          admissionNumber: std.admissionNumber,
          score: item?.status === 'normal' ? item.score : null,
          isAbsent: item?.status === 'ABS',
          isExcused: item?.status === 'EXC',
          isExempt: item?.status === 'EXP',
          recordedBy: currentUserId,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await onSaveScores(recordsToSave);
    setSaveStatus('saved');
  };

  // Submit to Exam Officer & Principal
  const handleSubmitResults = async () => {
    await handleSave();
    await onSubmitForApproval(selectedArmId, selectedSubjectId);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3500);
  };

  // Export CSV Sheet
  const handleExportSheetCsv = () => {
    const activeAsm =
      activeComponent === 'ALL'
        ? currentAssessments
        : currentAssessments.filter((a) => a.component === activeComponent);

    let headers = 'AdmissionNumber,StudentName';
    activeAsm.forEach((a) => {
      headers += `,"${a.component || 'Assessment'} (${a.maxScore}m)"`;
    });
    headers += ',"Total (100)","Grade","Remark"\n';

    const rows = armStudents.map((std) => {
      let row = `"${std.admissionNumber}","${std.fullName}"`;
      let ca1 = 0;
      let ca2 = 0;
      let exam = 0;

      activeAsm.forEach((a) => {
        const key = `${a.id}_${std.id}`;
        const item = localScores[key];
        const val = item?.status !== 'normal' ? item?.status || '-' : item?.score ?? 0;
        row += `,"${val}"`;

        if (item?.status === 'normal' && item?.score !== null) {
          if (a.component === 'CA1') ca1 = item.score;
          if (a.component === 'CA2') ca2 = item.score;
          if (a.component === 'EXAM' || a.assessmentType === 'terminal_exam') exam = item.score;
        }
      });

      const total = Math.round((ca1 + ca2 + exam) * 10) / 10;
      const { grade, remark } = getGradeForScore(total, schoolConfig?.gradingScale || []);
      row += `,"${total}","${grade}","${remark}"`;
      return row;
    });

    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scores_${selectedArmId}_${selectedSubjectId}_${activeComponent}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download pre-filled CSV Template for Bulk Score Import
  const handleDownloadImportTemplate = () => {
    const targetComp = activeComponent === 'ALL' ? 'CA1' : activeComponent;
    const asm = currentAssessments.find((a) => a.component === targetComp) || currentAssessments[0];
    const maxScore = asm?.maxScore || 10;

    let headers = 'AdmissionNumber,StudentName,Score,Status\n';
    const rows = armStudents.map(
      (std) => `"${std.admissionNumber}","${std.fullName}","",normal`
    );

    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `score_template_${targetComp}_${selectedArmId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Process uploaded CSV file for scores
  const handleProcessScoreCsv = (content: string) => {
    setCsvFileContent(content);
    setCsvError(null);

    const targetComp = activeComponent === 'ALL' ? 'CA1' : activeComponent;
    const asm = currentAssessments.find((a) => a.component === targetComp) || currentAssessments[0];
    const maxScore = asm?.maxScore || 10;

    const rawLines = content.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (rawLines.length < 2) {
      setCsvError('CSV must include header row and student data.');
      return;
    }

    const headers = rawLines[0].toLowerCase().split(',').map((h) => h.replace(/[^a-z0-9]/g, ''));
    const admIdx = headers.findIndex((h) => h.includes('adm') || h.includes('number'));
    const scoreIdx = headers.findIndex((h) => h.includes('score') || h.includes('mark'));
    const statusIdx = headers.findIndex((h) => h.includes('status'));

    const parsed = [];
    for (let i = 1; i < rawLines.length; i++) {
      const cols = rawLines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      const adm = cols[admIdx >= 0 ? admIdx : 0] || '';
      const rawScore = cols[scoreIdx >= 0 ? scoreIdx : 2] || '';
      const rawStatus = (cols[statusIdx >= 0 ? statusIdx : 3] || 'normal').toUpperCase();

      const student = armStudents.find(
        (s) => s.admissionNumber.toUpperCase() === adm.toUpperCase()
      );

      let isValid = true;
      let err = '';
      let scoreVal: number | null = null;
      let statusVal: 'normal' | 'ABS' | 'EXC' | 'EXP' = 'normal';

      if (!student) {
        isValid = false;
        err = `Student ${adm} not found in this class arm`;
      } else if (['ABS', 'EXC', 'EXP'].includes(rawStatus)) {
        statusVal = rawStatus as any;
        scoreVal = null;
      } else if (rawScore !== '') {
        const num = parseFloat(rawScore);
        if (isNaN(num)) {
          isValid = false;
          err = 'Score must be a number';
        } else if (num < 0 || num > maxScore) {
          isValid = false;
          err = `Score must be between 0 and ${maxScore}`;
        } else {
          scoreVal = num;
        }
      }

      parsed.push({
        admissionNumber: adm,
        studentName: student?.fullName || 'Unknown Student',
        studentId: student?.id,
        score: scoreVal,
        status: statusVal,
        isValid,
        error: err,
        assessmentId: asm.id,
      });
    }

    setCsvParsedPreview(parsed);
  };

  // Merge CSV scores into active sheet
  const handleApplyCsvScores = () => {
    const updated = { ...localScores };
    for (const item of csvParsedPreview) {
      if (item.isValid && item.studentId) {
        const key = `${item.assessmentId}_${item.studentId}`;
        updated[key] = {
          score: item.score,
          status: item.status,
        };
      }
    }
    setLocalScores(updated);
    setSaveStatus('dirty');
    setIsCsvImportOpen(false);
  };

  const selectedArmObj = classArms.find((a) => a.id === selectedArmId);
  const selectedSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ClipboardEdit className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Spreadsheet Score Entry
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fast bulk entry for Continuous Assessment 1 (CA1), CA2, and Terminal Examination
          </p>
        </div>

        {/* Save & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center space-x-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Saving marks...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All marks saved</span>
            </span>
          )}
          {saveStatus === 'dirty' && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
              Unsaved changes
            </span>
          )}

          <button
            onClick={() => setIsCsvImportOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportSheetCsv}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleSubmitResults}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Submit to Exam Officer</span>
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Scores for {selectedSubjectObj?.name} ({selectedArmObj?.name}) successfully computed and submitted to the Examination Officer & Principal!
          </span>
        </div>
      )}

      {/* Teacher Authorized Banner */}
      {isTeacher && (
        <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Authorized Access: Showing your assigned classes and subjects ({authorizedArms.length} class arms, {authorizedSubjectsForSelectedArm.length} subjects).
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 uppercase">
            {currentUser?.displayName}
          </span>
        </div>
      )}

      {/* Workflow Navigation Controls: Session -> Term -> Arm -> Subject */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Academic Session */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Academic Session</label>
            <div className="p-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 border border-slate-200">
              {schoolConfig?.currentSession || '2025/2026'}
            </div>
          </div>

          {/* Term */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Term</label>
            <div className="p-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 border border-slate-200">
              {schoolConfig?.currentTerm || '1st Term'}
            </div>
          </div>

          {/* Assigned Class Arm */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Assigned Class Arm
            </label>
            <select
              value={selectedArmId}
              onChange={(e) => setSelectedArmId(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500"
            >
              {authorizedArms.map((arm) => (
                <option key={arm.id} value={arm.id}>
                  {arm.name} ({students.filter((s) => s.currentArmId === arm.id).length} Students)
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Subject */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Assigned Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500"
            >
              {authorizedSubjectsForSelectedArm.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Component Filter Buttons: ALL | CA1 | CA2 | EXAM */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 mr-1">Component:</span>
            <button
              onClick={() => setActiveComponent('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                activeComponent === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All 3 Components (CA1 + CA2 + Exam)
            </button>
            <button
              onClick={() => setActiveComponent('CA1')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 ${
                activeComponent === 'CA1'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span>CA1 Test</span>
              <span className="text-[10px] opacity-80">({struct.ca1MaxScore}m / {struct.ca1Weight}%)</span>
            </button>
            <button
              onClick={() => setActiveComponent('CA2')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 ${
                activeComponent === 'CA2'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <span>CA2 Test</span>
              <span className="text-[10px] opacity-80">({struct.ca2MaxScore}m / {struct.ca2Weight}%)</span>
            </button>
            <button
              onClick={() => setActiveComponent('EXAM')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 ${
                activeComponent === 'EXAM'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span>Terminal Examination</span>
              <span className="text-[10px] opacity-80">({struct.examMaxScore}m / {struct.examWeight}%)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Enrolled in {selectedArmObj?.name}: <strong>{armStudents.length} Students</strong>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center text-slate-400">#</th>
                <th className="p-3 w-32">Admission No</th>
                <th className="p-3 min-w-[160px]">Student Name</th>

                {/* Visible Assessment Columns */}
                {visibleAssessments.map((asm) => (
                  <th key={asm.id} className="p-3 min-w-[140px] text-center border-l border-slate-800">
                    <div className="font-extrabold text-emerald-300">
                      {asm.component || 'CA'}
                    </div>
                    <div className="text-[10px] text-slate-300 font-normal">
                      Max: {asm.maxScore} marks ({asm.weightPercent}%)
                    </div>
                  </th>
                ))}

                {/* Computed Columns */}
                {activeComponent === 'ALL' && (
                  <>
                    <th className="p-3 w-24 text-center border-l border-slate-800 text-emerald-400">
                      Total (100)
                    </th>
                    <th className="p-3 w-16 text-center border-l border-slate-800">Grade</th>
                    <th className="p-3 w-28 text-center border-l border-slate-800">Remark</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {armStudents.map((std, idx) => {
                let ca1 = 0;
                let ca2 = 0;
                let exam = 0;

                return (
                  <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {std.admissionNumber}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {std.fullName}
                    </td>

                    {/* Score inputs for visible assessments */}
                    {visibleAssessments.map((asm) => {
                      const key = `${asm.id}_${std.id}`;
                      const item = localScores[key];
                      const err = validationErrors[key];

                      if (item?.status === 'normal' && item?.score !== null) {
                        if (asm.component === 'CA1') ca1 = item.score;
                        if (asm.component === 'CA2') ca2 = item.score;
                        if (asm.component === 'EXAM' || asm.assessmentType === 'terminal_exam') exam = item.score;
                      }

                      return (
                        <td key={asm.id} className="p-2 border-l border-slate-100 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              min="0"
                              max={asm.maxScore}
                              step="0.5"
                              disabled={item?.status !== 'normal'}
                              value={
                                item?.status !== 'normal'
                                  ? item?.status || ''
                                  : item?.score ?? ''
                              }
                              onChange={(e) => handleScoreChange(asm, std, e.target.value)}
                              placeholder={`0-${asm.maxScore}`}
                              className={`w-16 p-1.5 text-center text-xs font-bold rounded-lg border transition-all ${
                                err
                                  ? 'border-rose-500 bg-rose-50 text-rose-900'
                                  : item?.status !== 'normal'
                                  ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed'
                                  : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                              }`}
                            />

                            {/* Status flag toggler */}
                            <select
                              value={item?.status || 'normal'}
                              onChange={(e) =>
                                handleStatusChange(asm.id, std.id, e.target.value as any)
                              }
                              className="text-[10px] p-1 bg-slate-50 border border-slate-200 rounded font-bold text-slate-600"
                            >
                              <option value="normal">MK</option>
                              <option value="ABS">ABS</option>
                              <option value="EXC">EXC</option>
                              <option value="EXP">EXP</option>
                            </select>
                          </div>
                          {err && <p className="text-[10px] text-rose-600 mt-0.5">{err}</p>}
                        </td>
                      );
                    })}

                    {/* Consolidated Output */}
                    {activeComponent === 'ALL' && (
                      <>
                        <td className="p-3 text-center border-l border-slate-100 font-mono font-extrabold text-sm text-slate-900">
                          {Math.round((ca1 + ca2 + exam) * 10) / 10}
                        </td>
                        <td className="p-3 text-center border-l border-slate-100">
                          {(() => {
                            const tot = ca1 + ca2 + exam;
                            const { grade } = getGradeForScore(
                              tot,
                              schoolConfig?.gradingScale || []
                            );
                            return (
                              <span
                                className={`px-2 py-0.5 rounded font-black text-xs ${
                                  tot >= 70
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : tot >= 50
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {grade}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-3 text-center border-l border-slate-100 text-[11px] font-medium text-slate-600">
                          {
                            getGradeForScore(ca1 + ca2 + exam, schoolConfig?.gradingScale || [])
                              .remark
                          }
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk CSV Score Import Modal */}
      {isCsvImportOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  Import Scores for {activeComponent === 'ALL' ? 'CA1' : activeComponent} from CSV
                </h3>
              </div>
              <button
                onClick={() => setIsCsvImportOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {csvError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">Download Pre-filled Template</p>
                  <p className="text-[11px] text-slate-500">
                    Includes all {armStudents.length} students in {selectedArmObj?.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadImportTemplate}
                  className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg border border-emerald-300 flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload CSV or Paste CSV Text
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      handleProcessScoreCsv(ev.target?.result as string);
                    };
                    reader.readAsText(file);
                  }}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 mb-2"
                />

                <textarea
                  rows={4}
                  value={csvFileContent}
                  onChange={(e) => handleProcessScoreCsv(e.target.value)}
                  placeholder="AdmissionNumber,StudentName,Score,Status&#10;UDGS/2025/J001,Chukwuemeka Obi,9.5,normal"
                  className="w-full font-mono text-xs p-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {csvParsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span>Parsed Preview ({csvParsedPreview.filter((p) => p.isValid).length} Valid)</span>
                    <span className="text-slate-400 font-normal">
                      Total {csvParsedPreview.length} rows
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2">Adm No</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Score</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvParsedPreview.map((item, i) => (
                          <tr key={i} className={item.isValid ? '' : 'bg-rose-50 text-rose-800'}>
                            <td className="p-2 font-mono">{item.admissionNumber}</td>
                            <td className="p-2">{item.studentName}</td>
                            <td className="p-2 font-bold">{item.score ?? '-'}</td>
                            <td className="p-2">{item.isValid ? item.status : item.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCsvImportOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCsvScores}
                  disabled={csvParsedPreview.filter((p) => p.isValid).length === 0}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  Apply Scores to Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
