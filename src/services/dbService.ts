import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  SchoolConfig,
  Staff,
  Student,
  ClassArm,
  Subject,
  Assessment,
  ScoreRecord,
  TermResult,
  ReportCard,
  AttendanceRecord,
  BankQuestion,
  PromotionStatus,
  TermAssessmentComponent,
} from '../types';
import {
  INITIAL_SCHOOL_CONFIG,
  INITIAL_CLASS_ARMS,
  INITIAL_SUBJECTS,
  INITIAL_STAFF,
  INITIAL_STUDENTS,
  INITIAL_QUESTION_BANK,
  INITIAL_ASSESSMENTS,
  INITIAL_SCORE_RECORDS,
  INITIAL_TERM_RESULTS,
  INITIAL_REPORT_CARDS,
  INITIAL_ATTENDANCE,
} from './seedData';
import {
  getGradeForScore,
  calculateRanks,
  evaluatePromotion,
  normalizeComponentScore,
} from './calculationEngine';

const CACHE_KEY_PREFIX = 'sams_cache_v2_';

function getCached<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setCached<T>(key: string, value: T): void {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export class DatabaseService {
  private static instance: DatabaseService;
  private isInitialized = false;

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initializeDatabaseIfEmpty(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const configDoc = await getDoc(doc(db, 'school_config', 'main_school_config'));
      if (!configDoc.exists()) {
        console.log('Seeding Urban Day Grammar School SAMS data to Firestore...');
        await this.seedAllData();
      } else {
        // Ensure school branding is synchronized
        const currentData = configDoc.data() as SchoolConfig;
        if (currentData.schoolName !== 'Urban Day Grammar School') {
          await this.updateSchoolConfig({
            schoolName: 'Urban Day Grammar School',
            address: 'Olaogun, Old Ife Road, Ibadan, Oyo State, Nigeria',
            primaryColor: '#4169E1',
            secondaryColor: '#2347A5',
            lightBgColor: '#F0F5FF',
            borderColor: '#D6E3FF',
          });
        }
      }
      this.isInitialized = true;
    } catch (error) {
      console.warn('Firestore initial check failed, using local cache:', error);
      this.seedLocalCache();
      this.isInitialized = true;
    }
  }

  private seedLocalCache(): void {
    setCached('school_config', INITIAL_SCHOOL_CONFIG);
    setCached('class_arms', INITIAL_CLASS_ARMS);
    setCached('subjects', INITIAL_SUBJECTS);
    setCached('staff', INITIAL_STAFF);
    setCached('students', INITIAL_STUDENTS);
    setCached('question_bank', INITIAL_QUESTION_BANK);
    setCached('assessments', INITIAL_ASSESSMENTS);
    setCached('assessment_scores', INITIAL_SCORE_RECORDS);
    setCached('term_results', INITIAL_TERM_RESULTS);
    setCached('report_cards', INITIAL_REPORT_CARDS);
    setCached('attendance_records', INITIAL_ATTENDANCE);
  }

  public async seedAllData(): Promise<void> {
    const batch = writeBatch(db);

    // School config
    batch.set(doc(db, 'school_config', 'main_school_config'), INITIAL_SCHOOL_CONFIG);

    // Bootstrap Admin mapping
    batch.set(doc(db, 'admins', 'admin_bootstrap'), {
      email: 'heritage95.EI@gmail.com',
      staffId: 'UDGS/ADM/01',
      role: 'admin',
    });

    // Class Arms
    for (const arm of INITIAL_CLASS_ARMS) {
      batch.set(doc(db, 'class_arms', arm.id), arm);
    }

    // Subjects
    for (const sub of INITIAL_SUBJECTS) {
      batch.set(doc(db, 'subjects', sub.id), sub);
    }

    // Staff
    for (const stf of INITIAL_STAFF) {
      batch.set(doc(db, 'staff', stf.id), stf);
    }

    // Students
    for (const std of INITIAL_STUDENTS) {
      batch.set(doc(db, 'students', std.id), std);
    }

    // Question Bank
    for (const q of INITIAL_QUESTION_BANK) {
      batch.set(doc(db, 'question_bank', q.id), q);
    }

    // Assessments
    for (const asm of INITIAL_ASSESSMENTS) {
      batch.set(doc(db, 'assessments', asm.id), asm);
    }

    // Assessment Scores
    for (const sc of INITIAL_SCORE_RECORDS) {
      batch.set(doc(db, 'assessment_scores', sc.id), sc);
    }

    // Term Results
    for (const tr of INITIAL_TERM_RESULTS) {
      batch.set(doc(db, 'term_results', tr.id), tr);
    }

    // Report Cards
    for (const rep of INITIAL_REPORT_CARDS) {
      batch.set(doc(db, 'report_cards', rep.id), rep);
    }

    // Attendance
    for (const att of INITIAL_ATTENDANCE) {
      batch.set(doc(db, 'attendance_records', att.id), att);
    }

    await batch.commit();
    this.seedLocalCache();
  }

  // --- SCHOOL CONFIG & BRANDING ---
  public async getSchoolConfig(): Promise<SchoolConfig> {
    try {
      const snap = await getDoc(doc(db, 'school_config', 'main_school_config'));
      if (snap.exists()) {
        const data = snap.data() as SchoolConfig;
        setCached('school_config', data);
        return data;
      }
      return getCached('school_config', INITIAL_SCHOOL_CONFIG);
    } catch {
      return getCached('school_config', INITIAL_SCHOOL_CONFIG);
    }
  }

  public async updateSchoolConfig(config: Partial<SchoolConfig>): Promise<void> {
    try {
      const ref = doc(db, 'school_config', 'main_school_config');
      await updateDoc(ref, { ...config, updatedAt: new Date().toISOString() });
      const current = await this.getSchoolConfig();
      setCached('school_config', { ...current, ...config });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'school_config/main_school_config');
    }
  }

  // --- QUESTION BANK ---
  public async getQuestionBank(
    subjectId?: string,
    classLevelId?: string,
    component?: string
  ): Promise<BankQuestion[]> {
    try {
      const snap = await getDocs(collection(db, 'question_bank'));
      let questions: BankQuestion[] = [];
      if (!snap.empty) {
        questions = snap.docs.map((d) => ({ ...d.data(), id: d.id } as BankQuestion));
        setCached('question_bank', questions);
      } else {
        questions = getCached('question_bank', INITIAL_QUESTION_BANK);
      }

      if (subjectId && subjectId !== 'all') {
        questions = questions.filter((q) => q.subjectId === subjectId);
      }
      if (classLevelId && classLevelId !== 'all') {
        questions = questions.filter((q) => q.classLevelId === classLevelId);
      }
      if (component && component !== 'all') {
        questions = questions.filter((q) => q.component === component);
      }
      return questions;
    } catch {
      let questions = getCached('question_bank', INITIAL_QUESTION_BANK);
      if (subjectId && subjectId !== 'all') questions = questions.filter((q) => q.subjectId === subjectId);
      if (classLevelId && classLevelId !== 'all') questions = questions.filter((q) => q.classLevelId === classLevelId);
      if (component && component !== 'all') questions = questions.filter((q) => q.component === component);
      return questions;
    }
  }

  public async saveQuestion(question: BankQuestion): Promise<void> {
    try {
      await setDoc(doc(db, 'question_bank', question.id), question);
      const list = await this.getQuestionBank();
      const updated = list.some((q) => q.id === question.id)
        ? list.map((q) => (q.id === question.id ? question : q))
        : [...list, question];
      setCached('question_bank', updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `question_bank/${question.id}`);
    }
  }

  public async batchSaveQuestions(questions: BankQuestion[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const q of questions) {
        batch.set(doc(db, 'question_bank', q.id), q);
      }
      await batch.commit();

      const existing = await this.getQuestionBank();
      const map = new Map<string, BankQuestion>();
      for (const q of existing) map.set(q.id, q);
      for (const q of questions) map.set(q.id, q);
      setCached('question_bank', Array.from(map.values()));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'question_bank/batch');
    }
  }

  public async deleteQuestion(questionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'question_bank', questionId));
      const list = await this.getQuestionBank();
      setCached('question_bank', list.filter((q) => q.id !== questionId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `question_bank/${questionId}`);
    }
  }

  // --- STAFF ---
  public async getStaff(): Promise<Staff[]> {
    try {
      const snap = await getDocs(collection(db, 'staff'));
      if (!snap.empty) {
        const staff = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Staff));
        setCached('staff', staff);
        return staff;
      }
      return getCached('staff', INITIAL_STAFF);
    } catch {
      return getCached('staff', INITIAL_STAFF);
    }
  }

  public async saveStaff(staff: Staff): Promise<void> {
    try {
      await setDoc(doc(db, 'staff', staff.id), staff);
      const list = await this.getStaff();
      const updated = list.some((s) => s.id === staff.id)
        ? list.map((s) => (s.id === staff.id ? staff : s))
        : [...list, staff];
      setCached('staff', updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `staff/${staff.id}`);
    }
  }

  // --- STUDENTS ---
  public async getStudents(): Promise<Student[]> {
    try {
      const snap = await getDocs(collection(db, 'students'));
      if (!snap.empty) {
        const students = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Student));
        setCached('students', students);
        return students;
      }
      return getCached('students', INITIAL_STUDENTS);
    } catch {
      return getCached('students', INITIAL_STUDENTS);
    }
  }

  public async saveStudent(student: Student): Promise<void> {
    try {
      await setDoc(doc(db, 'students', student.id), student);
      const list = await this.getStudents();
      const updated = list.some((s) => s.id === student.id)
        ? list.map((s) => (s.id === student.id ? student : s))
        : [...list, student];
      setCached('students', updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `students/${student.id}`);
    }
  }

  public async batchSaveStudents(students: Student[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const std of students) {
        batch.set(doc(db, 'students', std.id), std);
      }
      await batch.commit();

      const existing = await this.getStudents();
      const map = new Map<string, Student>();
      for (const s of existing) map.set(s.id, s);
      for (const s of students) map.set(s.id, s);
      setCached('students', Array.from(map.values()));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'students/batch');
    }
  }

  public async deleteStudent(studentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'students', studentId));
      const list = await this.getStudents();
      setCached('students', list.filter((s) => s.id !== studentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${studentId}`);
    }
  }

  public async findStudentByAdmissionNumber(admissionNumber: string): Promise<Student | null> {
    const students = await this.getStudents();
    const cleanNum = admissionNumber.trim().toUpperCase();
    return (
      students.find(
        (s) => s.admissionNumber.toUpperCase() === cleanNum || s.id.toLowerCase() === cleanNum.toLowerCase()
      ) || null
    );
  }

  // --- CLASS ARMS & SUBJECTS ---
  public async getClassArms(): Promise<ClassArm[]> {
    try {
      const snap = await getDocs(collection(db, 'class_arms'));
      if (!snap.empty) {
        const arms = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ClassArm));
        setCached('class_arms', arms);
        return arms;
      }
      return getCached('class_arms', INITIAL_CLASS_ARMS);
    } catch {
      return getCached('class_arms', INITIAL_CLASS_ARMS);
    }
  }

  public async saveClassArm(arm: ClassArm): Promise<void> {
    try {
      await setDoc(doc(db, 'class_arms', arm.id), arm);
      const list = await this.getClassArms();
      const updated = list.some((a) => a.id === arm.id) ? list.map((a) => (a.id === arm.id ? arm : a)) : [...list, arm];
      setCached('class_arms', updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `class_arms/${arm.id}`);
    }
  }

  public async getSubjects(): Promise<Subject[]> {
    try {
      const snap = await getDocs(collection(db, 'subjects'));
      if (!snap.empty) {
        const subjects = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Subject));
        setCached('subjects', subjects);
        return subjects;
      }
      return getCached('subjects', INITIAL_SUBJECTS);
    } catch {
      return getCached('subjects', INITIAL_SUBJECTS);
    }
  }

  public async saveSubject(subject: Subject): Promise<void> {
    try {
      await setDoc(doc(db, 'subjects', subject.id), subject);
      const list = await this.getSubjects();
      const updated = list.some((s) => s.id === subject.id)
        ? list.map((s) => (s.id === subject.id ? subject : s))
        : [...list, subject];
      setCached('subjects', updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `subjects/${subject.id}`);
    }
  }

  // --- QUESTION BANK ---
  public async getBankQuestions(
    subjectId?: string,
    classLevelId?: string,
    component?: TermAssessmentComponent
  ): Promise<BankQuestion[]> {
    try {
      const snap = await getDocs(collection(db, 'question_bank'));
      let questions: BankQuestion[] = [];
      if (!snap.empty) {
        questions = snap.docs.map((d) => ({ ...d.data(), id: d.id } as BankQuestion));
        setCached('question_bank', questions);
      } else {
        questions = getCached('question_bank', INITIAL_QUESTION_BANK);
      }

      if (subjectId && subjectId !== 'all') {
        questions = questions.filter((q) => q.subjectId === subjectId);
      }
      if (classLevelId && classLevelId !== 'all') {
        questions = questions.filter((q) => q.classLevelId === classLevelId);
      }
      if (component) {
        questions = questions.filter((q) => q.component === component);
      }
      return questions;
    } catch {
      let questions = getCached('question_bank', INITIAL_QUESTION_BANK);
      if (subjectId && subjectId !== 'all') {
        questions = questions.filter((q) => q.subjectId === subjectId);
      }
      if (classLevelId && classLevelId !== 'all') {
        questions = questions.filter((q) => q.classLevelId === classLevelId);
      }
      if (component) {
        questions = questions.filter((q) => q.component === component);
      }
      return questions;
    }
  }

  public async saveBankQuestion(question: BankQuestion): Promise<void> {
    try {
      await setDoc(doc(db, 'question_bank', question.id), question);
      const list = await this.getBankQuestions();
      const updated = list.some((q) => q.id === question.id)
        ? list.map((q) => (q.id === question.id ? question : q))
        : [...list, question];
      setCached('question_bank', updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `question_bank/${question.id}`);
    }
  }

  public async batchSaveBankQuestions(questions: BankQuestion[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const q of questions) {
        batch.set(doc(db, 'question_bank', q.id), q);
      }
      await batch.commit();

      const existing = await this.getBankQuestions();
      const map = new Map<string, BankQuestion>();
      for (const q of existing) map.set(q.id, q);
      for (const q of questions) map.set(q.id, q);
      setCached('question_bank', Array.from(map.values()));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'question_bank/batch');
    }
  }

  public async deleteBankQuestion(questionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'question_bank', questionId));
      const list = await this.getBankQuestions();
      setCached('question_bank', list.filter((q) => q.id !== questionId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `question_bank/${questionId}`);
    }
  }

  public async updateQuestionStatus(questionId: string, status: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'question_bank', questionId), {
        status,
        updatedAt: new Date().toISOString(),
      });
      const list = await this.getBankQuestions();
      setCached(
        'question_bank',
        list.map((q) => (q.id === questionId ? { ...q, status, updatedAt: new Date().toISOString() } : q))
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `question_bank/${questionId}`);
    }
  }

  // --- FIXED ASSESSMENTS & SCORES ---
  public async getAssessments(): Promise<Assessment[]> {
    try {
      const snap = await getDocs(collection(db, 'assessments'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Assessment));
        setCached('assessments', list);
        return list;
      }
      return getCached('assessments', INITIAL_ASSESSMENTS);
    } catch {
      return getCached('assessments', INITIAL_ASSESSMENTS);
    }
  }

  public async saveAssessment(assessment: Assessment): Promise<void> {
    try {
      await setDoc(doc(db, 'assessments', assessment.id), assessment);
      const list = await this.getAssessments();
      const updated = list.some((a) => a.id === assessment.id)
        ? list.map((a) => (a.id === assessment.id ? assessment : a))
        : [...list, assessment];
      setCached('assessments', updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `assessments/${assessment.id}`);
    }
  }

  public async getScoreRecords(assessmentId?: string): Promise<ScoreRecord[]> {
    try {
      let q = collection(db, 'assessment_scores');
      const snap = assessmentId
        ? await getDocs(query(q, where('assessmentId', '==', assessmentId)))
        : await getDocs(q);

      if (!snap.empty) {
        const scores = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ScoreRecord));
        if (!assessmentId) setCached('assessment_scores', scores);
        return scores;
      }
      const all = getCached('assessment_scores', INITIAL_SCORE_RECORDS);
      return assessmentId ? all.filter((s) => s.assessmentId === assessmentId) : all;
    } catch {
      const all = getCached('assessment_scores', INITIAL_SCORE_RECORDS);
      return assessmentId ? all.filter((s) => s.assessmentId === assessmentId) : all;
    }
  }

  public async saveScoreRecords(records: ScoreRecord[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const rec of records) {
        batch.set(doc(db, 'assessment_scores', rec.id), rec);
      }
      await batch.commit();

      const existing = await this.getScoreRecords();
      const map = new Map<string, ScoreRecord>();
      for (const s of existing) map.set(s.id, s);
      for (const s of records) map.set(s.id, s);
      setCached('assessment_scores', Array.from(map.values()));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'assessment_scores/batch');
    }
  }

  // --- FIXED CA1, CA2, AND EXAM RESULT COMPUTATION ---
  public async getTermResults(session?: string, term?: string, armId?: string): Promise<TermResult[]> {
    try {
      const snap = await getDocs(collection(db, 'term_results'));
      let results: TermResult[] = [];
      if (!snap.empty) {
        results = snap.docs.map((d) => ({ ...d.data(), id: d.id } as TermResult));
        setCached('term_results', results);
      } else {
        results = getCached('term_results', INITIAL_TERM_RESULTS);
      }

      if (session) results = results.filter((r) => r.session === session);
      if (term) results = results.filter((r) => r.term === term);
      if (armId) results = results.filter((r) => r.armId === armId);
      return results;
    } catch {
      let results = getCached('term_results', INITIAL_TERM_RESULTS);
      if (session) results = results.filter((r) => r.session === session);
      if (term) results = results.filter((r) => r.term === term);
      if (armId) results = results.filter((r) => r.armId === armId);
      return results;
    }
  }

  public async saveTermResult(result: TermResult): Promise<void> {
    try {
      await setDoc(doc(db, 'term_results', result.id), result);
      const list = await this.getTermResults();
      const updated = list.some((r) => r.id === result.id)
        ? list.map((r) => (r.id === result.id ? result : r))
        : [...list, result];
      setCached('term_results', updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `term_results/${result.id}`);
    }
  }

  public async batchSaveTermResults(results: TermResult[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const res of results) {
        batch.set(doc(db, 'term_results', res.id), res);
      }
      await batch.commit();

      const existing = await this.getTermResults();
      const map = new Map<string, TermResult>();
      for (const r of existing) map.set(r.id, r);
      for (const r of results) map.set(r.id, r);
      setCached('term_results', Array.from(map.values()));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'term_results/batch');
    }
  }

  /**
   * Computes consolidated Term Results from fixed CA1, CA2, and Examination components
   */
  public async computeSubjectTermResults(
    armId: string,
    subjectId: string,
    session: string,
    term: string,
    actingUserId: string,
    actingUserRole: string
  ): Promise<TermResult[]> {
    const students = (await this.getStudents()).filter((s) => s.currentArmId === armId && s.status === 'active');
    const assessments = (await this.getAssessments()).filter(
      (a) => a.armId === armId && a.subjectId === subjectId && a.session === session && a.term === term
    );
    const allScores = await this.getScoreRecords();
    const config = await this.getSchoolConfig();
    const struct = config.assessmentStructure || {
      ca1MaxScore: 10,
      ca1Weight: 10,
      ca2MaxScore: 10,
      ca2Weight: 10,
      examMaxScore: 80,
      examWeight: 80,
    };

    const ca1Asm = assessments.find((a) => a.component === 'CA1');
    const ca2Asm = assessments.find((a) => a.component === 'CA2');
    const examAsm = assessments.find((a) => a.component === 'EXAM' || a.assessmentType === 'terminal_exam');

    const computedResults: TermResult[] = [];

    for (const student of students) {
      // CA1 score
      const ca1ScoreRec = ca1Asm ? allScores.find((s) => s.assessmentId === ca1Asm.id && s.studentId === student.id) : null;
      const rawCa1 = ca1ScoreRec && !ca1ScoreRec.isAbsent && !ca1ScoreRec.isExcused && ca1ScoreRec.score !== null ? ca1ScoreRec.score : 0;
      const normCa1 = normalizeComponentScore(rawCa1, ca1Asm?.maxScore || struct.ca1MaxScore, struct.ca1Weight);

      // CA2 score
      const ca2ScoreRec = ca2Asm ? allScores.find((s) => s.assessmentId === ca2Asm.id && s.studentId === student.id) : null;
      const rawCa2 = ca2ScoreRec && !ca2ScoreRec.isAbsent && !ca2ScoreRec.isExcused && ca2ScoreRec.score !== null ? ca2ScoreRec.score : 0;
      const normCa2 = normalizeComponentScore(rawCa2, ca2Asm?.maxScore || struct.ca2MaxScore, struct.ca2Weight);

      const caTotal = Math.round((normCa1 + normCa2) * 10) / 10;

      // Exam score
      const examScoreRec = examAsm ? allScores.find((s) => s.assessmentId === examAsm.id && s.studentId === student.id) : null;
      const rawExam = examScoreRec && !examScoreRec.isAbsent && !examScoreRec.isExcused && examScoreRec.score !== null ? examScoreRec.score : 0;
      const normExam = normalizeComponentScore(rawExam, examAsm?.maxScore || struct.examMaxScore, struct.examWeight);

      const finalScore = Math.round((caTotal + normExam) * 10) / 10;
      const { grade, remark } = getGradeForScore(finalScore, config.gradingScale);

      const resultId = `tr-${student.id}-${subjectId}-${session.replace('/', '_')}-${term.replace(' ', '_')}`;

      computedResults.push({
        id: resultId,
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        classLevelId: student.currentClassId,
        armId,
        subjectId,
        session,
        term,
        caScores: {
          ca1Score: normCa1,
          ca2Score: normCa2,
          normalizedCaTotal: caTotal,
        },
        ca1Score: normCa1,
        ca2Score: normCa2,
        caTotal,
        examScore: normExam,
        finalScore,
        grade,
        remark,
        status: 'draft',
        updatedAt: new Date().toISOString(),
        auditTrail: [
          {
            action: 'Computed from CA1, CA2, and Exam records',
            userId: actingUserId,
            userRole: actingUserRole,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

    await this.batchSaveTermResults(computedResults);
    return computedResults;
  }

  // --- REPORT CARDS ---
  public async getReportCards(session?: string, term?: string, studentId?: string): Promise<ReportCard[]> {
    try {
      const snap = await getDocs(collection(db, 'report_cards'));
      let reports: ReportCard[] = [];
      if (!snap.empty) {
        reports = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ReportCard));
        setCached('report_cards', reports);
      } else {
        reports = getCached('report_cards', INITIAL_REPORT_CARDS);
      }

      if (session) reports = reports.filter((r) => r.session === session);
      if (term) reports = reports.filter((r) => r.term === term);
      if (studentId) reports = reports.filter((r) => r.studentId === studentId);
      return reports;
    } catch {
      let reports = getCached('report_cards', INITIAL_REPORT_CARDS);
      if (session) reports = reports.filter((r) => r.session === session);
      if (term) reports = reports.filter((r) => r.term === term);
      if (studentId) reports = reports.filter((r) => r.studentId === studentId);
      return reports;
    }
  }

  public async saveReportCard(card: ReportCard): Promise<void> {
    try {
      await setDoc(doc(db, 'report_cards', card.id), card);
      const list = await this.getReportCards();
      const updated = list.some((c) => c.id === card.id) ? list.map((c) => (c.id === card.id ? card : c)) : [...list, card];
      setCached('report_cards', updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `report_cards/${card.id}`);
    }
  }

  /**
   * Generates or refreshes report cards with fixed CA1, CA2, and Exam breakdown
   */
  public async generateClassReportCards(armId: string, session: string, term: string): Promise<ReportCard[]> {
    const students = (await this.getStudents()).filter((s) => s.currentArmId === armId && s.status === 'active');
    const classArms = await this.getClassArms();
    const currentArm = classArms.find((a) => a.id === armId);
    const subjects = await this.getSubjects();
    const termResults = await this.getTermResults(session, term, armId);
    const config = await this.getSchoolConfig();

    const studentAverages: { id: string; score: number }[] = [];

    // Precalculate subject stats
    const subjectStats: Record<string, { total: number; count: number; high: number; low: number }> = {};
    for (const res of termResults) {
      if (!subjectStats[res.subjectId]) {
        subjectStats[res.subjectId] = { total: 0, count: 0, high: -Infinity, low: Infinity };
      }
      subjectStats[res.subjectId].total += res.finalScore;
      subjectStats[res.subjectId].count += 1;
      if (res.finalScore > subjectStats[res.subjectId].high) subjectStats[res.subjectId].high = res.finalScore;
      if (res.finalScore < subjectStats[res.subjectId].low) subjectStats[res.subjectId].low = res.finalScore;
    }

    const studentSubjectRows: Record<string, any[]> = {};
    for (const std of students) {
      const studentRes = termResults.filter((r) => r.studentId === std.id);
      let total = 0;
      const rows = [];

      for (const r of studentRes) {
        const sub = subjects.find((s) => s.id === r.subjectId);
        const stat = subjectStats[r.subjectId];
        const classAvg = stat && stat.count > 0 ? Math.round((stat.total / stat.count) * 10) / 10 : r.finalScore;
        total += r.finalScore;

        rows.push({
          subjectId: r.subjectId,
          subjectCode: sub?.code || 'SUB',
          subjectName: sub?.name || 'Subject',
          ca1Score: r.ca1Score ?? (r.caScores.ca1Score || 0),
          ca2Score: r.ca2Score ?? (r.caScores.ca2Score || 0),
          caTotal: r.caTotal,
          examScore: r.examScore,
          totalScore: r.finalScore,
          grade: r.grade,
          remark: r.remark,
          classAverage: classAvg,
          highestInClass: stat?.high ?? r.finalScore,
          lowestInClass: stat?.low ?? r.finalScore,
        });
      }

      studentSubjectRows[std.id] = rows;
      const avg = rows.length > 0 ? Math.round((total / rows.length) * 10) / 10 : 0;
      studentAverages.push({ id: std.id, score: avg });
    }

    const ranks = calculateRanks(studentAverages);
    const cards: ReportCard[] = [];

    for (const std of students) {
      const rows = studentSubjectRows[std.id] || [];
      const totalScore = rows.reduce((acc, curr) => acc + curr.totalScore, 0);
      const avgScore = rows.length > 0 ? Math.round((totalScore / rows.length) * 10) / 10 : 0;
      const pos = ranks[std.id] || 1;

      let promotion: PromotionStatus = 'pending';
      if (term.includes('3rd')) {
        promotion = evaluatePromotion(
          avgScore,
          rows.map((r) => ({
            subjectCode: r.subjectCode,
            finalScore: r.totalScore,
            isCore: r.subjectCode === 'ENG' || r.subjectCode === 'MTH',
          })),
          config.promotionMinAverage,
          config.promotionCoreSubjectPassCount
        );
      }

      const reportCardId = `rep-${std.id}-${session.replace('/', '_')}-${term.replace(' ', '_')}`;

      let teacherComment = 'Demonstrates diligent commitment and exemplary character in class exercises.';
      let principalComment = 'A laudable performance this term at Urban Day Grammar School.';
      if (avgScore >= 80) {
        teacherComment = 'Exceptional scholarship and academic distinction. Keep leading by example!';
        principalComment = 'Sterling academic record. Warm congratulations on achieving top honors!';
      } else if (avgScore < 50) {
        teacherComment = 'Requires intensive remedial assistance and more focus on assignments.';
        principalComment = 'Fair effort, but dedication to study must improve next term.';
      }

      cards.push({
        id: reportCardId,
        studentId: std.id,
        admissionNumber: std.admissionNumber,
        studentName: std.fullName,
        classLevelId: std.currentClassId,
        classLevelName: currentArm?.classLevelId?.toUpperCase() || 'JSS 1',
        armId,
        armName: currentArm?.name || 'Class Arm',
        session,
        term,
        subjects: rows,
        totalScore,
        maxPossibleScore: rows.length * 100,
        averageScore: avgScore,
        classPosition: pos,
        totalStudentsInArm: students.length,
        attendance: {
          daysOpened: 65,
          daysPresent: 63,
          daysAbsent: 2,
          daysLate: 0,
          daysExcused: 1,
          attendancePercentage: 96.9,
        },
        affectiveDomain: {
          punctuality: 5,
          neatness: 5,
          politeness: 5,
          honesty: 5,
          cooperation: 4,
          leadership: 4,
        },
        psychomotorDomain: {
          handwriting: 4,
          sports: 4,
          crafts: 4,
          musicalSkills: 4,
          speakingFluency: 5,
        },
        classTeacherRemark: teacherComment,
        principalRemark: principalComment,
        promotionStatus: promotion,
        isPublished: true,
        publishedAt: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
      });
    }

    const batch = writeBatch(db);
    for (const card of cards) {
      batch.set(doc(db, 'report_cards', card.id), card);
    }
    await batch.commit();

    const existingReports = await this.getReportCards();
    const map = new Map<string, ReportCard>();
    for (const c of existingReports) map.set(c.id, c);
    for (const c of cards) map.set(c.id, c);
    setCached('report_cards', Array.from(map.values()));

    return cards;
  }

  // --- ATTENDANCE ---
  public async getAttendanceRecords(armId?: string, date?: string): Promise<AttendanceRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'attendance_records'));
      let records: AttendanceRecord[] = [];
      if (!snap.empty) {
        records = snap.docs.map((d) => ({ ...d.data(), id: d.id } as AttendanceRecord));
        setCached('attendance_records', records);
      } else {
        records = getCached('attendance_records', INITIAL_ATTENDANCE);
      }

      if (armId) records = records.filter((r) => r.armId === armId);
      if (date) records = records.filter((r) => r.date === date);
      return records;
    } catch {
      let records = getCached('attendance_records', INITIAL_ATTENDANCE);
      if (armId) records = records.filter((r) => r.armId === armId);
      if (date) records = records.filter((r) => r.date === date);
      return records;
    }
  }

  public async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'attendance_records', record.id), record);
      const list = await this.getAttendanceRecords();
      const updated = list.some((r) => r.id === record.id)
        ? list.map((r) => (r.id === record.id ? record : r))
        : [...list, record];
      setCached('attendance_records', updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `attendance_records/${record.id}`);
    }
  }
}

export const dbService = DatabaseService.getInstance();
