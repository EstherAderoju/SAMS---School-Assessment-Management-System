import React, { useState, useMemo } from 'react';
import {
  Users,
  BookOpen,
  ClipboardEdit,
  FileSpreadsheet,
  CalendarCheck2,
  TrendingUp,
  Award,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  Layers,
  FileText,
  UserCheck,
} from 'lucide-react';
import {
  Student,
  Staff,
  Assessment,
  TermResult,
  ClassArm,
  Subject,
  SchoolConfig,
  BankQuestion,
  TermAssessmentComponent,
} from '../../types';

interface StaffDashboardProps {
  students: Student[];
  staff: Staff[];
  subjects: Subject[];
  assessments: Assessment[];
  termResults: TermResult[];
  classArms: ClassArm[];
  bankQuestions?: BankQuestion[];
  schoolConfig: SchoolConfig | null;
  currentUserRole: string;
  currentUserName: string;
  currentUser?: any;
  setActiveTab: (tab: string) => void;
  onNavigateToScoreEntry?: (armId: string, subjectId: string, component?: TermAssessmentComponent) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  students,
  staff,
  subjects,
  assessments,
  termResults,
  classArms,
  bankQuestions = [],
  schoolConfig,
  currentUserRole,
  currentUserName,
  currentUser,
  setActiveTab,
  onNavigateToScoreEntry,
}) => {
  const isTeacher =
    currentUserRole === 'class_teacher' || currentUserRole === 'subject_teacher';
  const isAdminOrExamOfficer =
    currentUserRole === 'admin' ||
    currentUserRole === 'principal' ||
    currentUserRole === 'vp' ||
    currentUserRole === 'exam_officer';

  // For Admin / Exam Officer: Allow inspecting specific teacher assignments
  const [inspectedTeacherId, setInspectedTeacherId] = useState<string>(
    isTeacher ? currentUser?.staffRecord?.id || '' : 'all'
  );

  // Active staff record to evaluate
  const activeStaffRecord: Staff | undefined = useMemo(() => {
    if (isTeacher) {
      return (
        currentUser?.staffRecord ||
        staff.find((s) => s.email === currentUser?.email || s.id === currentUser?.uid)
      );
    }
    if (inspectedTeacherId !== 'all') {
      return staff.find((s) => s.id === inspectedTeacherId);
    }
    return undefined;
  }, [isTeacher, currentUser, staff, inspectedTeacherId]);

  // Authorized Class Arms for the active staff
  const authorizedArms = useMemo(() => {
    if (!activeStaffRecord) return classArms;

    const allowedArmIds = new Set<string>();
    (activeStaffRecord.assignedArmIds || []).forEach((id) => allowedArmIds.add(id));
    (activeStaffRecord.assignedSubjectArmPairs || []).forEach((p) => allowedArmIds.add(p.armId));

    const filtered = classArms.filter((a) => allowedArmIds.has(a.id));
    return filtered.length > 0 ? filtered : classArms;
  }, [classArms, activeStaffRecord]);

  // Selected Workflow States: Session -> Term -> Arm -> Subject -> Component
  const [workflowSession, setWorkflowSession] = useState<string>(
    schoolConfig?.currentSession || '2025/2026'
  );
  const [workflowTerm, setWorkflowTerm] = useState<string>(
    schoolConfig?.currentTerm || '1st Term'
  );
  const [workflowArmId, setWorkflowArmId] = useState<string>(
    authorizedArms[0]?.id || classArms[0]?.id || ''
  );

  // Authorized Subjects for selected Arm
  const authorizedSubjectsForArm = useMemo(() => {
    if (!activeStaffRecord) return subjects;

    const allowedSubIds = new Set(
      (activeStaffRecord.assignedSubjectArmPairs || [])
        .filter((p) => p.armId === workflowArmId)
        .map((p) => p.subjectId)
    );

    const filtered = subjects.filter((s) => allowedSubIds.has(s.id));
    return filtered.length > 0 ? filtered : subjects;
  }, [subjects, activeStaffRecord, workflowArmId]);

  const [workflowSubjectId, setWorkflowSubjectId] = useState<string>(
    authorizedSubjectsForArm[0]?.id || subjects[0]?.id || ''
  );
  const [workflowComponent, setWorkflowComponent] = useState<TermAssessmentComponent>('CA1');

  // Sync selected subject if arm changes
  React.useEffect(() => {
    if (authorizedSubjectsForArm.length > 0) {
      if (!authorizedSubjectsForArm.some((s) => s.id === workflowSubjectId)) {
        setWorkflowSubjectId(authorizedSubjectsForArm[0].id);
      }
    }
  }, [workflowArmId, authorizedSubjectsForArm, workflowSubjectId]);

  // Students belonging to selected arm
  const currentArmStudents = useMemo(() => {
    return students.filter(
      (s) => s.currentArmId === workflowArmId && s.status === 'active'
    );
  }, [students, workflowArmId]);

  // Question bank authored by teacher
  const teacherBankQuestions = useMemo(() => {
    if (!activeStaffRecord) return bankQuestions;
    return bankQuestions.filter(
      (q) =>
        q.creatorId === activeStaffRecord.id ||
        (activeStaffRecord.assignedSubjectArmPairs || []).some(
          (p) => p.subjectId === q.subjectId
        )
    );
  }, [bankQuestions, activeStaffRecord]);

  // Handler to jump to score entry with the exact assignment workflow selected
  const handleLaunchWorkflowScoreEntry = () => {
    if (onNavigateToScoreEntry) {
      onNavigateToScoreEntry(workflowArmId, workflowSubjectId, workflowComponent);
    } else {
      setActiveTab('scores');
    }
  };

  // General School metrics (for Admins / Principals)
  const activeStudents = students.filter((s) => s.status === 'active');
  const pendingApprovals = termResults.filter((r) => r.status === 'submitted');
  const avgPerformance =
    termResults.length > 0
      ? Math.round(
          (termResults.reduce((sum, r) => sum + r.finalScore, 0) / termResults.length) * 10
        ) / 10
      : 78.5;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-emerald-800/60 border border-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nigerian Secondary School Assessment Management System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUserName}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl">
              {schoolConfig?.schoolName || 'Urban Day Grammar School'} • Session{' '}
              <strong className="text-white">{schoolConfig?.currentSession || '2025/2026'}</strong> ({schoolConfig?.currentTerm || '1st Term'})
              {isTeacher && activeStaffRecord && (
                <span className="block mt-1 text-emerald-300 font-mono text-xs">
                  Staff ID: {activeStaffRecord.staffId} • {activeStaffRecord.role.replace('_', ' ').toUpperCase()} • {activeStaffRecord.qualification || 'B.Ed'}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('scores')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-950/30 transition-all"
            >
              <ClipboardEdit className="w-4 h-4" />
              <span>Score Entry Sheet</span>
            </button>
            <button
              onClick={() => setActiveTab('question-bank')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center space-x-1.5 backdrop-blur-xs transition-all"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>Question Banks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Inspector Mode: Switch between all-school view or specific teacher */}
      {isAdminOrExamOfficer && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-slate-900">
              Teacher Assignment Inspector:
            </span>
            <span className="text-xs text-slate-500">
              (Admins & Exam Officers can inspect any teacher's view)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={inspectedTeacherId}
              onChange={(e) => setInspectedTeacherId(e.target.value)}
              className="text-xs font-semibold p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">School-Wide Overview (All Teachers)</option>
              {staff
                .filter((s) => s.role === 'class_teacher' || s.role === 'subject_teacher')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.role.replace('_', ' ')}) - {t.staffId}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* CORE WORKFLOW BAR:
          Select academic session → Select term → Select assigned class and arm → Select assigned subject → Select CA1, CA2, or Examination
      */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Teacher Assignment Workspace
              </h2>
              <p className="text-[11px] text-slate-500">
                Authorized Workflow: Session → Term → Class Arm → Subject → CA1 / CA2 / Examination
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {authorizedArms.length} Assigned Class Arm{authorizedArms.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* 5-Step Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Step 1: Session */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">1. Session</label>
            <select
              value={workflowSession}
              onChange={(e) => setWorkflowSession(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500"
            >
              {(schoolConfig?.availableSessions || ['2024/2025', '2025/2026']).map((sess) => (
                <option key={sess} value={sess}>
                  {sess}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Term */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">2. Term</label>
            <select
              value={workflowTerm}
              onChange={(e) => setWorkflowTerm(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>
          </div>

          {/* Step 3: Assigned Class Arm */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">3. Assigned Class Arm</label>
            <select
              value={workflowArmId}
              onChange={(e) => setWorkflowArmId(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {authorizedArms.map((arm) => (
                <option key={arm.id} value={arm.id}>
                  {arm.name} ({students.filter((s) => s.currentArmId === arm.id).length} stds)
                </option>
              ))}
            </select>
          </div>

          {/* Step 4: Assigned Subject */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">4. Assigned Subject</label>
            <select
              value={workflowSubjectId}
              onChange={(e) => setWorkflowSubjectId(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {authorizedSubjectsForArm.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* Step 5: Assessment Component */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">5. Component</label>
            <select
              value={workflowComponent}
              onChange={(e) => setWorkflowComponent(e.target.value as TermAssessmentComponent)}
              className="w-full p-2 bg-white border border-emerald-600 text-emerald-950 rounded-xl font-black focus:ring-2 focus:ring-emerald-500"
            >
              <option value="CA1">CA1 Test (10m / 10%)</option>
              <option value="CA2">CA2 Test (10m / 10%)</option>
              <option value="EXAM">Examination (80m / 80%)</option>
            </select>
          </div>
        </div>

        {/* Workflow Action Bar */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Target:{' '}
              <strong className="text-slate-900 font-bold">
                {classArms.find((a) => a.id === workflowArmId)?.name}
              </strong>{' '}
              •{' '}
              <strong className="text-slate-900 font-bold">
                {subjects.find((s) => s.id === workflowSubjectId)?.name}
              </strong>{' '}
              • <strong className="text-emerald-700 font-extrabold">{workflowComponent}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('question-bank')}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold flex items-center space-x-1"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Question Bank</span>
            </button>

            <button
              onClick={handleLaunchWorkflowScoreEntry}
              className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center space-x-1 shadow-xs transition-colors"
            >
              <ClipboardEdit className="w-3.5 h-3.5" />
              <span>Enter {workflowComponent} Scores</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* TEACHER'S AUTHORIZED TEACHING ASSIGNMENTS CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-700" />
            <span>
              {isTeacher
                ? 'Your Authorized Teaching Assignments'
                : activeStaffRecord
                ? `${activeStaffRecord.fullName}'s Authorized Assignments`
                : 'All Secondary School Class Arms & Subjects'}
            </span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            3-Component System: CA1 (10) + CA2 (10) + Exam (80) = 100 Marks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(activeStaffRecord?.assignedSubjectArmPairs || []).length > 0 ? (
            activeStaffRecord?.assignedSubjectArmPairs.map((pair, idx) => {
              const arm = classArms.find((a) => a.id === pair.armId);
              const sub = subjects.find((s) => s.id === pair.subjectId);
              const armStdCount = students.filter(
                (s) => s.currentArmId === pair.armId && s.status === 'active'
              ).length;

              const ca1Asm = assessments.find(
                (a) =>
                  a.armId === pair.armId &&
                  a.subjectId === pair.subjectId &&
                  a.component === 'CA1'
              );
              const ca2Asm = assessments.find(
                (a) =>
                  a.armId === pair.armId &&
                  a.subjectId === pair.subjectId &&
                  a.component === 'CA2'
              );
              const examAsm = assessments.find(
                (a) =>
                  a.armId === pair.armId &&
                  a.subjectId === pair.subjectId &&
                  (a.component === 'EXAM' || a.assessmentType === 'terminal_exam')
              );

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 p-5 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase font-mono">
                          {sub?.code || 'SUB'}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 leading-tight">
                          {sub?.name || 'Subject'}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center space-x-1">
                          <span className="font-semibold text-slate-700">{arm?.name}</span>
                          <span>•</span>
                          <span>{armStdCount} Enrolled Students</span>
                        </p>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                        {arm?.classLevelId?.toUpperCase() || 'JSS'}
                      </div>
                    </div>

                    {/* Progress indicators for CA1, CA2, and Exam */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-semibold">CA1 (10 Marks):</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {ca1Asm ? '✓ Active' : 'Ready for Entry'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-semibold">CA2 (10 Marks):</span>
                        <span className="font-mono text-indigo-700 font-bold">
                          {ca2Asm ? '✓ Active' : 'Ready for Entry'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-semibold">Terminal Exam (80):</span>
                        <span className="font-mono text-rose-700 font-bold">
                          {examAsm ? '✓ Active' : 'Ready for Entry'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this assignment */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setWorkflowArmId(pair.armId);
                        setWorkflowSubjectId(pair.subjectId);
                        setActiveTab('question-bank');
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1"
                    >
                      <BookOpen className="w-3 h-3 text-emerald-700" />
                      <span>Questions</span>
                    </button>

                    <button
                      onClick={() => {
                        setWorkflowArmId(pair.armId);
                        setWorkflowSubjectId(pair.subjectId);
                        handleLaunchWorkflowScoreEntry();
                      }}
                      className="px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center space-x-1 shadow-2xs"
                    >
                      <ClipboardEdit className="w-3 h-3" />
                      <span>Enter Scores</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            // Default arms view when no specific teacher filter is chosen
            classArms.map((arm) => {
              const armStdCount = students.filter(
                (s) => s.currentArmId === arm.id && s.status === 'active'
              ).length;
              const teacher = staff.find((s) => s.id === arm.classTeacherId);

              return (
                <div
                  key={arm.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">{arm.name}</h3>
                        <p className="text-xs text-slate-500">
                          Class Teacher: {teacher?.fullName || 'Unassigned'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-xs font-bold rounded">
                        {armStdCount} Students
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setWorkflowArmId(arm.id);
                        setActiveTab('scores');
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      Open Scoresheet →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* QUESTION BANK & CBT METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Question Bank Summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Question Bank Repository</span>
            </h3>
            <button
              onClick={() => setActiveTab('question-bank')}
              className="text-xs text-emerald-700 font-bold hover:underline"
            >
              Open Bank
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-600 font-medium">Total Questions in Bank:</span>
              <strong className="text-sm font-extrabold text-slate-900">
                {teacherBankQuestions.length} Questions
              </strong>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] text-emerald-700 font-bold block">CA1</span>
                <strong className="text-emerald-900 text-sm">
                  {teacherBankQuestions.filter((q) => q.component === 'CA1').length}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="text-[10px] text-indigo-700 font-bold block">CA2</span>
                <strong className="text-indigo-900 text-sm">
                  {teacherBankQuestions.filter((q) => q.component === 'CA2').length}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-[10px] text-rose-700 font-bold block">EXAM</span>
                <strong className="text-rose-900 text-sm">
                  {teacherBankQuestions.filter((q) => q.component === 'EXAM').length}
                </strong>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('question-bank')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors text-center"
            >
              Author or Import Questions (CSV)
            </button>
          </div>
        </div>

        {/* Enrolled Students in Selected Arm */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>
                Students Enrolled in {classArms.find((a) => a.id === workflowArmId)?.name || 'Class Arm'}
              </span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {currentArmStudents.length} Active Students
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 w-32">Admission No</th>
                  <th className="p-2.5">Full Name</th>
                  <th className="p-2.5 w-20">Gender</th>
                  <th className="p-2.5 w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentArmStudents.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-700">
                      {std.admissionNumber}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-900">{std.fullName}</td>
                    <td className="p-2.5 text-slate-600">{std.gender}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {std.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
