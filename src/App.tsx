import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { dbService } from './services/dbService';
import {
  SchoolConfig,
  ClassArm,
  Subject,
  Staff,
  Student,
  Assessment,
  ScoreRecord,
  TermResult,
  ReportCard,
  AttendanceRecord,
  BankQuestion,
} from './types';

// Components
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { StaffDashboard } from './components/admin/StaffDashboard';
import { StudentList } from './components/students/StudentList';
import { StudentDetailModal } from './components/students/StudentDetailModal';
import { AssessmentList } from './components/assessments/AssessmentList';
import { ScoreEntrySheet } from './components/assessments/ScoreEntrySheet';
import { QuestionBankManager } from './components/assessments/QuestionBankManager';
import { BroadsheetView } from './components/results/BroadsheetView';
import { ReportCardManager } from './components/reports/ReportCardManager';
import { AttendanceTracker } from './components/attendance/AttendanceTracker';
import { ClassArmManager } from './components/admin/ClassArmManager';
import { StaffManager } from './components/admin/StaffManager';
import { SchoolSettings } from './components/admin/SchoolSettings';
import { StudentPortal } from './components/portals/StudentPortal';
import { StaffLoginModal } from './components/portals/StaffLoginModal';
import { StudentLoginModal } from './components/portals/StudentLoginModal';

import {
  GraduationCap,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

function MainAppContent() {
  const { currentUser, isLoading: authLoading, quickSwitchRole } = useAuth();

  // App Data State
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(null);
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [scoreRecords, setScoreRecords] = useState<ScoreRecord[]>([]);
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState<boolean>(false);
  const [isStudentLoginOpen, setIsStudentLoginOpen] = useState<boolean>(false);
  const [inspectingStudent, setInspectingStudent] = useState<Student | null>(null);
  const [scoreEntryAssessmentId, setScoreEntryAssessmentId] = useState<string | undefined>(undefined);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  // Load all database entities
  const loadData = async () => {
    try {
      const [cfg, arms, subs, stf, std, asms, scs, trs, rps, att, bqs] = await Promise.all([
        dbService.getSchoolConfig(),
        dbService.getClassArms(),
        dbService.getSubjects(),
        dbService.getStaff(),
        dbService.getStudents(),
        dbService.getAssessments(),
        dbService.getScoreRecords(),
        dbService.getTermResults(),
        dbService.getReportCards(),
        dbService.getAttendanceRecords(),
        dbService.getBankQuestions(),
      ]);

      setSchoolConfig(cfg);
      setClassArms(arms);
      setSubjects(subs);
      setStaffList(stf);
      setStudents(std);
      setAssessments(asms);
      setScoreRecords(scs);
      setTermResults(trs);
      setReportCards(rps);
      setAttendanceRecords(att);
      setBankQuestions(bqs);
    } catch (err) {
      console.error('Failed to load SAMS records:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync active tab when user switches to student role
  useEffect(() => {
    if (currentUser?.role === 'student' && activeTab !== 'student-portal') {
      setActiveTab('student-portal');
    } else if (currentUser?.role && currentUser.role !== 'student' && activeTab === 'student-portal') {
      // keep or switch to dashboard
    }
  }, [currentUser]);

  // Handler functions
  const handleSaveStudent = async (student: Student) => {
    await dbService.saveStudent(student);
    const updated = await dbService.getStudents();
    setStudents(updated);
  };

  const handleDeleteStudent = async (id: string) => {
    await dbService.deleteStudent(id);
    const updated = await dbService.getStudents();
    setStudents(updated);
  };

  const handleBulkImportStudents = async (imported: Student[]) => {
    for (const s of imported) {
      await dbService.saveStudent(s);
    }
    const updated = await dbService.getStudents();
    setStudents(updated);
  };

  const handlePromoteStudents = async (studentIds: string[], targetArmId: string, nextSession: string) => {
    const targetArm = classArms.find((a) => a.id === targetArmId);
    for (const id of studentIds) {
      const std = students.find((s) => s.id === id);
      if (std) {
        await dbService.saveStudent({
          ...std,
          currentArmId: targetArmId,
          currentClassId: targetArm?.classLevelId || std.currentClassId,
          currentSession: nextSession,
        });
      }
    }
    const updated = await dbService.getStudents();
    setStudents(updated);
  };

  const handleSaveAssessment = async (asm: Assessment) => {
    await dbService.saveAssessment(asm);
    const updated = await dbService.getAssessments();
    setAssessments(updated);
  };

  const handleSaveScores = async (records: ScoreRecord[]) => {
    await dbService.saveScoreRecords(records);
    const updated = await dbService.getScoreRecords();
    setScoreRecords(updated);
  };

  const handleSubmitResultsForApproval = async (armId: string, subjectId: string) => {
    if (!schoolConfig || !currentUser) return;
    const computed = await dbService.computeSubjectTermResults(
      armId,
      subjectId,
      schoolConfig.currentSession,
      schoolConfig.currentTerm,
      currentUser.uid,
      currentUser.role
    );
    // Mark them submitted
    const submitted = computed.map((r) => ({
      ...r,
      status: 'submitted' as const,
      auditTrail: [
        ...r.auditTrail,
        {
          action: 'Submitted to Examination Officer for review',
          userId: currentUser.uid,
          userRole: currentUser.role,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
    await dbService.batchSaveTermResults(submitted);
    const updated = await dbService.getTermResults();
    setTermResults(updated);
  };

  const handleApproveResults = async (resultIds: string[], status: 'approved' | 'published' | 'rejected') => {
    if (!currentUser) return;
    const all = await dbService.getTermResults();
    const updatedList = all.map((r) => {
      if (resultIds.includes(r.id)) {
        return {
          ...r,
          status,
          approvedBy: status === 'approved' ? currentUser.uid : r.approvedBy,
          publishedBy: status === 'published' ? currentUser.uid : r.publishedBy,
          updatedAt: new Date().toISOString(),
          auditTrail: [
            ...r.auditTrail,
            {
              action: `Status changed to ${status}`,
              userId: currentUser.uid,
              userRole: currentUser.role,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return r;
    });

    await dbService.batchSaveTermResults(updatedList);
    setTermResults(updatedList);
  };

  const handleGenerateReportCards = async (armId: string) => {
    if (!schoolConfig) return;
    const generated = await dbService.generateClassReportCards(
      armId,
      schoolConfig.currentSession,
      schoolConfig.currentTerm
    );
    const allReports = await dbService.getReportCards();
    setReportCards(allReports);
  };

  const handleUpdateReportCard = async (card: ReportCard) => {
    await dbService.saveReportCard(card);
    const allReports = await dbService.getReportCards();
    setReportCards(allReports);
  };

  const handleSaveAttendance = async (rec: AttendanceRecord) => {
    await dbService.saveAttendanceRecord(rec);
    const updated = await dbService.getAttendanceRecords();
    setAttendanceRecords(updated);
  };

  const handleSaveClassArm = async (arm: ClassArm) => {
    await dbService.saveClassArm(arm);
    const updated = await dbService.getClassArms();
    setClassArms(updated);
  };

  const handleSaveSubject = async (sub: Subject) => {
    await dbService.saveSubject(sub);
    const updated = await dbService.getSubjects();
    setSubjects(updated);
  };

  const handleSaveStaff = async (stf: Staff) => {
    await dbService.saveStaff(stf);
    const updated = await dbService.getStaff();
    setStaffList(updated);
  };

  const handleSaveSchoolConfig = async (cfg: Partial<SchoolConfig>) => {
    await dbService.updateSchoolConfig(cfg);
    const updated = await dbService.getSchoolConfig();
    setSchoolConfig(updated);
  };

  const handleSaveBankQuestion = async (q: BankQuestion) => {
    await dbService.saveBankQuestion(q);
    const updated = await dbService.getBankQuestions();
    setBankQuestions(updated);
  };

  const handleBatchSaveBankQuestions = async (qs: BankQuestion[]) => {
    await dbService.batchSaveBankQuestions(qs);
    const updated = await dbService.getBankQuestions();
    setBankQuestions(updated);
  };

  const handleDeleteBankQuestion = async (qId: string) => {
    await dbService.deleteBankQuestion(qId);
    const updated = await dbService.getBankQuestions();
    setBankQuestions(updated);
  };

  const handleUpdateBankQuestionStatus = async (qId: string, status: any) => {
    await dbService.updateQuestionStatus(qId, status);
    const updated = await dbService.getBankQuestions();
    setBankQuestions(updated);
  };

  const handleNavigateToScoreEntry = (assessmentId: string) => {
    setScoreEntryAssessmentId(assessmentId);
    setActiveTab('scores');
  };

  if (authLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">SAMS</h2>
        <p className="text-xs text-slate-400">Loading Secondary School Assessment System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900 flex flex-col">
      {/* Global Navbar */}
      <Navbar
        schoolConfig={schoolConfig}
        onOpenStaffLogin={() => setIsStaffLoginOpen(true)}
        onOpenStudentLogin={() => setIsStudentLoginOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <StaffDashboard
              students={students}
              staff={staffList}
              subjects={subjects}
              assessments={assessments}
              termResults={termResults}
              classArms={classArms}
              bankQuestions={bankQuestions}
              schoolConfig={schoolConfig}
              currentUserRole={currentUser?.role || 'admin'}
              currentUserName={currentUser?.displayName || 'Administrator'}
              currentUser={currentUser}
              setActiveTab={setActiveTab}
              onNavigateToScoreEntry={() => setActiveTab('scores')}
            />
          )}

          {activeTab === 'students' && (
            <StudentList
              students={students}
              classArms={classArms}
              subjects={subjects}
              currentSession={schoolConfig?.currentSession || '2025/2026'}
              onSaveStudent={handleSaveStudent}
              onDeleteStudent={handleDeleteStudent}
              onBulkImport={handleBulkImportStudents}
              onPromoteStudents={handlePromoteStudents}
              onViewStudentProfile={(s) => setInspectingStudent(s)}
            />
          )}

          {activeTab === 'assessments' && (
            <AssessmentList
              assessments={assessments}
              classArms={classArms}
              subjects={subjects}
              students={students}
              currentSession={schoolConfig?.currentSession || '2025/2026'}
              currentTerm={schoolConfig?.currentTerm || '1st Term'}
              currentUserId={currentUser?.uid || 'user-1'}
              onSaveAssessment={handleSaveAssessment}
              onNavigateToScoreEntry={handleNavigateToScoreEntry}
            />
          )}

          {activeTab === 'question-bank' && (
            <QuestionBankManager
              questions={bankQuestions}
              subjects={subjects}
              classArms={classArms}
              schoolConfig={schoolConfig}
              currentUser={currentUser}
              onSaveQuestion={handleSaveBankQuestion}
              onBatchSaveQuestions={handleBatchSaveBankQuestions}
              onDeleteQuestion={handleDeleteBankQuestion}
              onUpdateQuestionStatus={handleUpdateBankQuestionStatus}
            />
          )}

          {activeTab === 'scores' && (
            <ScoreEntrySheet
              assessments={assessments}
              classArms={classArms}
              subjects={subjects}
              students={students}
              scoreRecords={scoreRecords}
              schoolConfig={schoolConfig}
              currentUserId={currentUser?.uid || 'user-1'}
              currentUserRole={currentUser?.role || 'admin'}
              currentUser={currentUser}
              selectedAssessmentId={scoreEntryAssessmentId}
              onSaveScores={handleSaveScores}
              onSubmitForApproval={handleSubmitResultsForApproval}
            />
          )}

          {activeTab === 'results' && (
            <BroadsheetView
              classArms={classArms}
              subjects={subjects}
              students={students}
              termResults={termResults}
              schoolConfig={schoolConfig}
              currentUserId={currentUser?.uid || 'user-1'}
              currentUserRole={currentUser?.role || 'admin'}
              onApproveResults={handleApproveResults}
              onGenerateReportCards={handleGenerateReportCards}
            />
          )}

          {activeTab === 'reports' && (
            <ReportCardManager
              reportCards={reportCards}
              classArms={classArms}
              students={students}
              schoolConfig={schoolConfig}
              onGenerateReportCards={handleGenerateReportCards}
              onUpdateReportCard={handleUpdateReportCard}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTracker
              classArms={classArms}
              students={students}
              attendanceRecords={attendanceRecords}
              currentSession={schoolConfig?.currentSession || '2025/2026'}
              currentTerm={schoolConfig?.currentTerm || '1st Term'}
              currentUserId={currentUser?.uid || 'user-1'}
              onSaveAttendance={handleSaveAttendance}
            />
          )}

          {activeTab === 'academics' && (
            <ClassArmManager
              classArms={classArms}
              subjects={subjects}
              staff={staffList}
              currentSession={schoolConfig?.currentSession || '2025/2026'}
              onSaveClassArm={handleSaveClassArm}
              onSaveSubject={handleSaveSubject}
            />
          )}

          {activeTab === 'staff' && (
            <StaffManager
              staffList={staffList}
              classArms={classArms}
              subjects={subjects}
              currentUserId={currentUser?.uid || 'user-1'}
              currentUserRole={currentUser?.role || 'admin'}
              onSaveStaff={handleSaveStaff}
            />
          )}

          {activeTab === 'settings' && (
            <SchoolSettings
              schoolConfig={schoolConfig}
              currentUserRole={currentUser?.role || 'admin'}
              onSaveConfig={handleSaveSchoolConfig}
            />
          )}

          {activeTab === 'student-portal' && <StudentPortal schoolConfig={schoolConfig} />}
        </main>
      </div>

      {/* Staff Login Modal */}
      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        onSuccess={() => setActiveTab('dashboard')}
      />

      {/* Student Login Modal */}
      <StudentLoginModal
        isOpen={isStudentLoginOpen}
        onClose={() => setIsStudentLoginOpen(false)}
        onSuccess={() => setActiveTab('student-portal')}
      />

      {/* Student Dossier Inspection Modal */}
      {inspectingStudent && (
        <StudentDetailModal
          isOpen={true}
          onClose={() => setInspectingStudent(null)}
          student={inspectingStudent}
          termResults={termResults}
          reportCards={reportCards}
          schoolConfig={schoolConfig}
          subjects={subjects}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
