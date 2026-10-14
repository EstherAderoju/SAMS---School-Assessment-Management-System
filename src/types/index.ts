export type StaffRole =
  | 'admin'
  | 'principal'
  | 'vp'
  | 'exam_officer'
  | 'class_teacher'
  | 'subject_teacher';

export type StudentStatus = 'active' | 'graduated' | 'transferred' | 'suspended';

export type TermAssessmentComponent = 'CA1' | 'CA2' | 'EXAM';

export type AssessmentType =
  | 'written'
  | 'quiz'
  | 'practical'
  | 'project'
  | 'essay'
  | 'classwork'
  | 'homework'
  | 'assignment'
  | 'weekly_test'
  | 'monthly_test'
  | 'terminal_exam'
  | 'custom';

export type AssessmentStatus = 'draft' | 'published' | 'closed' | 'archived';

export type ResultApprovalStatus = 'draft' | 'submitted' | 'approved' | 'published' | 'rejected';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type PromotionStatus = 'promoted' | 'promoted_on_trial' | 'repeat' | 'pending' | 'graduated';

export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'fill_in_the_gap'
  | 'short_answer'
  | 'essay'
  | 'structured';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionApprovalStatus = 'draft' | 'under_review' | 'approved' | 'rejected' | 'archived';

export interface GradeBoundary {
  grade: string;
  minScore: number;
  maxScore: number;
  remark: string;
  points?: number;
}

export interface TermAssessmentStructureConfig {
  ca1MaxScore: number;       // default: 10
  ca1Weight: number;         // default: 10%
  ca2MaxScore: number;       // default: 10
  ca2Weight: number;         // default: 10%
  examMaxScore: number;      // default: 80
  examWeight: number;        // default: 80%
  totalMaxScore: number;     // 100
  totalWeight: number;       // 100%
}

export interface SchoolConfig {
  id?: string;
  schoolName: string;
  motto: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  logoUrl?: string;
  primaryColor: string; // #4169E1 (Royal Blue)
  secondaryColor: string; // #2347A5 (Deep Royal Blue)
  lightBgColor?: string; // #F0F5FF
  borderColor?: string; // #D6E3FF
  currentSession: string; // e.g., "2025/2026"
  currentTerm: string;    // e.g., "1st Term" | "2nd Term" | "3rd Term"
  availableSessions: string[];
  rankingEnabled: boolean;
  minAttendanceDays: number;
  gradingScale: GradeBoundary[];
  assessmentStructure: TermAssessmentStructureConfig;
  promotionMinAverage: number;
  promotionCoreSubjectPassCount: number;
  updatedAt?: string;
}

export interface Staff {
  id: string;
  staffId: string; // e.g., "STF/2024/001"
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  assignedArmIds: string[]; // Class Arms they are class teacher for
  assignedSubjectArmPairs: { subjectId: string; armId: string }[];
  isActive: boolean;
  qualification?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  admissionNumber: string; // e.g., "SAMS/2024/J042"
  fullName: string;
  firstName?: string;
  surname?: string;
  middleName?: string;
  gender: 'Male' | 'Female';
  dob: string;
  currentClassId: string; // e.g., "jss-1"
  currentArmId: string;   // e.g., "jss-1-gold"
  currentSession: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  admissionDate: string;
  status: StudentStatus;
  assignedSubjectIds: string[];
  photoUrl?: string;
  createdAt: string;
}

export interface ClassLevel {
  id: string;
  name: string; // "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"
  category: 'junior' | 'senior';
  order: number;
}

export interface ClassArm {
  id: string;
  name: string; // "JSS 1 Gold"
  classLevelId: string; // "jss-1"
  armName: string; // "Gold", "Diamond", "Science A", "Art B"
  classTeacherId?: string;
  academicSession: string;
  capacity?: number;
}

export interface Subject {
  id: string;
  code: string; // e.g., "MTH", "ENG", "PHY"
  name: string; // "Mathematics", "English Language"
  category: 'junior' | 'senior' | 'both';
  isCore: boolean;
  classLevelIds: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
}

export interface BankQuestion {
  id: string;
  subjectId: string;
  classLevelId: string;
  armId?: string;
  academicSession?: string;
  component: TermAssessmentComponent; // 'CA1' | 'CA2' | 'EXAM'
  questionType: QuestionType;
  topic: string;
  subtopic?: string;
  difficulty: QuestionDifficulty;
  questionText: string;
  options?: string[]; // for MCQs e.g. ["Tissue", "Cell", "Organ", "System"]
  correctAnswer: string; // e.g. "B" or "Cell"
  markingGuide?: string; // for essay / structured
  marks: number;
  explanation?: string;
  diagramUrl?: string;
  creatorId: string;
  creatorName: string;
  status: QuestionApprovalStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Assessment {
  id: string;
  title: string;
  component: TermAssessmentComponent; // 'CA1' | 'CA2' | 'EXAM'
  assessmentType: AssessmentType;     // format: 'written' | 'quiz' | 'practical' | 'essay'
  description?: string;
  subjectId: string;
  classLevelId: string;
  armId: string;
  session: string;
  term: string;
  assignedTeacherId: string;
  maxScore: number;
  weightPercent: number; // contribution to final term score
  dueDate?: string;
  assessmentDate: string;
  status: AssessmentStatus;
  durationMinutes?: number;
  questionIds?: string[];
  bankQuestions?: BankQuestion[];
  quizQuestions?: QuizQuestion[];
  rubricCriteria?: RubricCriterion[];
  createdAt: string;
}

export interface ScoreRecord {
  id: string;
  assessmentId: string;
  component?: TermAssessmentComponent;
  studentId: string;
  admissionNumber: string;
  score: number | null; // null if absent/excused/unmarked
  isAbsent: boolean;
  isExcused: boolean;
  isExempt: boolean;
  feedback?: string;
  rubricScores?: Record<string, number>;
  recordedBy: string;
  updatedAt: string;
}

export interface TermResultAudit {
  action: string;
  userId: string;
  userRole: string;
  timestamp: string;
  previousScores?: { ca1?: number; ca2?: number; examScore?: number; finalScore?: number };
  reason?: string;
}

export interface TermResult {
  id: string;
  studentId: string;
  admissionNumber: string;
  classLevelId: string;
  armId: string;
  subjectId: string;
  session: string;
  term: string;
  caScores: {
    ca1Score?: number;
    ca2Score?: number;
    normalizedCaTotal: number;
    classwork?: number;
    assignments?: number;
    quizzes?: number;
    tests?: number;
    projects?: number;
    practicals?: number;
  };
  ca1Score: number; // e.g. 10
  ca2Score: number; // e.g. 10
  caTotal: number;  // CA1 + CA2 (e.g. 20)
  examScore: number; // e.g. 80
  finalScore: number; // CA1 + CA2 + Exam (e.g. 100)
  grade: string;
  remark: string;
  teacherComment?: string;
  status: ResultApprovalStatus;
  approvedBy?: string;
  publishedBy?: string;
  updatedAt: string;
  auditTrail: TermResultAudit[];
}

export interface AffectiveDomainRating {
  punctuality: number; // 1-5
  neatness: number;
  politeness: number;
  honesty: number;
  cooperation: number;
  leadership: number;
}

export interface PsychomotorDomainRating {
  handwriting: number; // 1-5
  sports: number;
  crafts: number;
  musicalSkills: number;
  speakingFluency: number;
}

export interface AttendanceSummary {
  daysOpened: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  daysExcused: number;
  attendancePercentage: number;
}

export interface ReportCardSubjectRow {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  ca1Score: number;
  ca2Score: number;
  caTotal: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
  classAverage?: number;
  highestInClass?: number;
  lowestInClass?: number;
  position?: number;
}

export interface ReportCard {
  id: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  classLevelId: string;
  classLevelName: string;
  armId: string;
  armName: string;
  session: string;
  term: string;
  subjects: ReportCardSubjectRow[];
  totalScore: number;
  maxPossibleScore: number;
  averageScore: number;
  classPosition?: number;
  totalStudentsInArm: number;
  attendance: AttendanceSummary;
  affectiveDomain: AffectiveDomainRating;
  psychomotorDomain: PsychomotorDomainRating;
  classTeacherRemark: string;
  classTeacherSignature?: string;
  principalRemark: string;
  principalSignature?: string;
  promotionStatus: PromotionStatus;
  isPublished: boolean;
  publishedAt?: string;
  generatedAt: string;
}

export interface AttendanceEntry {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  armId: string;
  classLevelId: string;
  session: string;
  term: string;
  date: string; // YYYY-MM-DD
  recordedBy: string;
  entries: AttendanceEntry[];
  createdAt: string;
}

export interface ActiveUser {
  uid: string;
  email: string;
  role: StaffRole | 'student';
  displayName: string;
  staffRecord?: Staff;
  studentRecord?: Student;
  isImpersonating?: boolean;
}
