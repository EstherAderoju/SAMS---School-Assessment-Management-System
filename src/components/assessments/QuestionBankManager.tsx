import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Upload,
  Printer,
  Play,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Trash2,
  Edit3,
  Layers,
  Award,
  Sparkles,
  Tag,
  Check,
  ChevronRight,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  BankQuestion,
  Subject,
  ClassArm,
  ClassLevel,
  Staff,
  SchoolConfig,
  TermAssessmentComponent,
  QuestionType,
  QuestionDifficulty,
  QuestionApprovalStatus,
  Assessment,
} from '../../types';
import { BulkQuestionImportModal } from './BulkQuestionImportModal';
import { ExamPaperModal } from './ExamPaperModal';
import { QuizTakerModal } from './QuizTakerModal';

interface QuestionBankManagerProps {
  questions: BankQuestion[];
  subjects: Subject[];
  classArms: ClassArm[];
  schoolConfig: SchoolConfig | null;
  currentUser: any;
  onSaveQuestion: (question: BankQuestion) => Promise<void>;
  onBatchSaveQuestions: (questions: BankQuestion[]) => Promise<void>;
  onDeleteQuestion: (questionId: string) => Promise<void>;
  onUpdateQuestionStatus: (questionId: string, status: QuestionApprovalStatus) => Promise<void>;
  onCreateAssessmentFromBank?: (assessment: Partial<Assessment>) => Promise<void>;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  questions,
  subjects,
  classArms,
  schoolConfig,
  currentUser,
  onSaveQuestion,
  onBatchSaveQuestions,
  onDeleteQuestion,
  onUpdateQuestionStatus,
  onCreateAssessmentFromBank,
}) => {
  const isTeacher =
    currentUser?.role === 'class_teacher' || currentUser?.role === 'subject_teacher';
  const isAdminOrExamOfficer =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'principal' ||
    currentUser?.role === 'vp' ||
    currentUser?.role === 'exam_officer';

  // Determine authorized subjects for the current user
  const authorizedSubjects = useMemo(() => {
    if (!isTeacher) return subjects;
    const staffRec: Staff | undefined = currentUser?.staffRecord;
    if (!staffRec) return subjects;

    const allowedSubjectIds = new Set(
      (staffRec.assignedSubjectArmPairs || []).map((p) => p.subjectId)
    );
    return subjects.filter((s) => allowedSubjectIds.has(s.id));
  }, [subjects, currentUser, isTeacher]);

  // Filters State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    authorizedSubjects[0]?.id || subjects[0]?.id || ''
  );
  const [selectedClassLevelId, setSelectedClassLevelId] = useState<string>('all');
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isExamPaperOpen, setIsExamPaperOpen] = useState(false);
  const [isCbtPreviewOpen, setIsCbtPreviewOpen] = useState(false);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);

  // Question Form State
  const [formComponent, setFormComponent] = useState<TermAssessmentComponent>('CA1');
  const [formType, setFormType] = useState<QuestionType>('mcq');
  const [formSubjectId, setFormSubjectId] = useState<string>(
    authorizedSubjects[0]?.id || subjects[0]?.id || ''
  );
  const [formClassLevelId, setFormClassLevelId] = useState<string>('jss-1');
  const [formTopic, setFormTopic] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<QuestionDifficulty>('medium');
  const [formQuestionText, setFormQuestionText] = useState('');
  const [formMarks, setFormMarks] = useState<number>(2);
  const [formExplanation, setFormExplanation] = useState('');
  const [formCorrectAnswer, setFormCorrectAnswer] = useState('A');
  const [formOptions, setFormOptions] = useState<string[]>([
    'Option A text',
    'Option B text',
    'Option C text',
    'Option D text',
  ]);
  const [formMarkingGuide, setFormMarkingGuide] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Available Class Levels
  const classLevels: ClassLevel[] = [
    { id: 'jss-1', name: 'JSS 1', category: 'junior', order: 1 },
    { id: 'jss-2', name: 'JSS 2', category: 'junior', order: 2 },
    { id: 'jss-3', name: 'JSS 3', category: 'junior', order: 3 },
    { id: 'sss-1', name: 'SSS 1', category: 'senior', order: 4 },
    { id: 'sss-2', name: 'SSS 2', category: 'senior', order: 5 },
    { id: 'sss-3', name: 'SSS 3', category: 'senior', order: 6 },
  ];

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Authorization filter: teachers can only view questions in their authorized subjects
      if (isTeacher) {
        const isAuthorized = authorizedSubjects.some((s) => s.id === q.subjectId);
        if (!isAuthorized) return false;
      }

      const matchesSub = selectedSubjectId === 'all' || q.subjectId === selectedSubjectId;
      const matchesLevel =
        selectedClassLevelId === 'all' || q.classLevelId === selectedClassLevelId;
      const matchesComp = selectedComponent === 'all' || q.component === selectedComponent;
      const matchesType = selectedType === 'all' || q.questionType === selectedType;
      const matchesDiff =
        selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const matchesStat = selectedStatus === 'all' || q.status === selectedStatus;
      const matchesSearch =
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchesSub &&
        matchesLevel &&
        matchesComp &&
        matchesType &&
        matchesDiff &&
        matchesStat &&
        matchesSearch
      );
    });
  }, [
    questions,
    isTeacher,
    authorizedSubjects,
    selectedSubjectId,
    selectedClassLevelId,
    selectedComponent,
    selectedType,
    selectedDifficulty,
    selectedStatus,
    searchTerm,
  ]);

  // Open Form for Create / Edit
  const handleOpenForm = (q?: BankQuestion) => {
    setFormError(null);
    if (q) {
      setEditingQuestion(q);
      setFormComponent(q.component);
      setFormType(q.questionType);
      setFormSubjectId(q.subjectId);
      setFormClassLevelId(q.classLevelId);
      setFormTopic(q.topic);
      setFormDifficulty(q.difficulty);
      setFormQuestionText(q.questionText);
      setFormMarks(q.marks || 2);
      setFormExplanation(q.explanation || '');
      setFormCorrectAnswer(q.correctAnswer);
      setFormOptions(
        q.options && q.options.length > 0
          ? q.options.map((opt) => opt.replace(/^[A-E]\.\s*/, ''))
          : ['Option A', 'Option B', 'Option C', 'Option D']
      );
      setFormMarkingGuide(q.markingGuide || '');
    } else {
      setEditingQuestion(null);
      setFormComponent('CA1');
      setFormType('mcq');
      setFormSubjectId(authorizedSubjects[0]?.id || subjects[0]?.id || '');
      setFormClassLevelId('jss-1');
      setFormTopic('');
      setFormDifficulty('medium');
      setFormQuestionText('');
      setFormMarks(2);
      setFormExplanation('');
      setFormCorrectAnswer('A');
      setFormOptions(['Option A', 'Option B', 'Option C', 'Option D']);
      setFormMarkingGuide('');
    }
    setIsQuestionFormOpen(true);
  };

  const handleSaveQuestionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formQuestionText.trim()) {
      setFormError('Please enter the question text.');
      return;
    }

    if (formType === 'mcq') {
      if (formOptions.some((opt) => !opt.trim())) {
        setFormError('All MCQ options must contain text.');
        return;
      }
    }

    const formattedOptions =
      formType === 'mcq'
        ? formOptions.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt.trim()}`)
        : formType === 'true_false'
        ? ['A. True', 'B. False']
        : undefined;

    const newQuestion: BankQuestion = {
      id: editingQuestion ? editingQuestion.id : `qb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      subjectId: formSubjectId,
      classLevelId: formClassLevelId,
      component: formComponent,
      questionType: formType,
      topic: formTopic.trim() || 'General',
      difficulty: formDifficulty,
      questionText: formQuestionText.trim(),
      options: formattedOptions,
      correctAnswer: formCorrectAnswer,
      marks: formMarks,
      explanation: formExplanation.trim() || undefined,
      markingGuide: formMarkingGuide.trim() || undefined,
      creatorId: currentUser?.uid || 'staff-tch',
      creatorName: currentUser?.displayName || 'Authorized Teacher',
      status: editingQuestion ? editingQuestion.status : 'approved',
      createdAt: editingQuestion ? editingQuestion.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveQuestion(newQuestion);
      setIsQuestionFormOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save question');
    }
  };

  const currentSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  // Convert Bank Questions to Assessment Quiz Question format for CBT test
  const cbtAssessmentMock: Assessment = {
    id: `cbt-${Date.now()}`,
    title: `${currentSubjectObj?.name || 'Subject'} CBT Test (${selectedComponent})`,
    component: (selectedComponent !== 'all' ? selectedComponent : 'CA1') as TermAssessmentComponent,
    assessmentType: 'quiz',
    subjectId: selectedSubjectId,
    classLevelId: selectedClassLevelId !== 'all' ? selectedClassLevelId : 'jss-1',
    armId: classArms[0]?.id || '',
    session: schoolConfig?.currentSession || '2025/2026',
    term: schoolConfig?.currentTerm || '1st Term',
    assignedTeacherId: currentUser?.uid || '',
    maxScore: filteredQuestions.reduce((acc, q) => acc + (q.marks || 1), 0),
    weightPercent: 10,
    assessmentDate: new Date().toISOString().split('T')[0],
    status: 'published',
    durationMinutes: 30,
    quizQuestions: filteredQuestions
      .filter((q) => q.questionType === 'mcq' || q.questionType === 'true_false')
      .map((q) => ({
        id: q.id,
        question: q.questionText,
        type: q.questionType === 'mcq' ? 'multiple_choice' : 'true_false',
        options: q.options ? q.options.map((opt) => opt.replace(/^[A-E]\.\s*/, '')) : ['True', 'False'],
        correctAnswer:
          q.questionType === 'mcq' && q.options
            ? q.options[q.correctAnswer.charCodeAt(0) - 65]?.replace(/^[A-E]\.\s*/, '') || q.correctAnswer
            : q.correctAnswer === 'A' ? 'True' : 'False',
        points: q.marks || 2,
      })),
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Subject Question Banks
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build and manage curriculum question repositories for Continuous Assessment 1 (CA1), CA2, and Terminal Exams
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            onClick={() => setIsExamPaperOpen(true)}
            disabled={filteredQuestions.length === 0}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Print Exam Paper</span>
          </button>

          {cbtAssessmentMock.quizQuestions && cbtAssessmentMock.quizQuestions.length > 0 && (
            <button
              onClick={() => setIsCbtPreviewOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center space-x-1.5 transition-colors"
            >
              <Play className="w-4 h-4 text-indigo-600" />
              <span>Preview CBT Test ({cbtAssessmentMock.quizQuestions.length})</span>
            </button>
          )}

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Question</span>
          </button>
        </div>
      </div>

      {/* Teacher Authorization Notice */}
      {isTeacher && (
        <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Authorized Access: Displaying question banks for your assigned subjects:{' '}
              <strong className="text-emerald-950 font-bold">
                {authorizedSubjects.map((s) => s.name).join(', ')}
              </strong>
            </span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
            {authorizedSubjects.length} Subject{authorizedSubjects.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Component Tabs Bar: ALL | CA1 | CA2 | EXAM */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSelectedComponent('all')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            selectedComponent === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Components ({questions.length})
        </button>

        <button
          onClick={() => setSelectedComponent('CA1')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            selectedComponent === 'CA1'
              ? 'bg-emerald-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Continuous Assessment 1 (CA1)</span>
          <span className="text-[10px] opacity-75 font-mono">
            ({questions.filter((q) => q.component === 'CA1').length})
          </span>
        </button>

        <button
          onClick={() => setSelectedComponent('CA2')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            selectedComponent === 'CA2'
              ? 'bg-indigo-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span>Continuous Assessment 2 (CA2)</span>
          <span className="text-[10px] opacity-75 font-mono">
            ({questions.filter((q) => q.component === 'CA2').length})
          </span>
        </button>

        <button
          onClick={() => setSelectedComponent('EXAM')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            selectedComponent === 'EXAM'
              ? 'bg-rose-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          <span>End-of-Term Examination</span>
          <span className="text-[10px] opacity-75 font-mono">
            ({questions.filter((q) => q.component === 'EXAM').length})
          </span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-emerald-500"
            >
              {!isTeacher && <option value="all">All Subjects</option>}
              {authorizedSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Class Level */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Class Level</label>
            <select
              value={selectedClassLevelId}
              onChange={(e) => setSelectedClassLevelId(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Levels</option>
              {classLevels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Format / Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="true_false">True / False</option>
              <option value="fill_in_the_gap">Fill in the Gap</option>
              <option value="essay">Essay / Theory</option>
              <option value="short_answer">Structured / Short Answer</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="sm:col-span-2 md:col-span-4 lg:col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Search Question</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Topic or keyword..."
                className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions Listing */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No questions found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No questions match your current filters. Add individual questions or import questions in bulk from a CSV spreadsheet.
          </p>
          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={() => handleOpenForm()}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Create New Question
            </button>
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
            >
              Bulk Import CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing {filteredQuestions.length} Question{filteredQuestions.length === 1 ? '' : 's'}</span>
            <span>Total Marks in Selection: {filteredQuestions.reduce((a, b) => a + (b.marks || 1), 0)} Marks</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredQuestions.map((q, idx) => {
              const sub = subjects.find((s) => s.id === q.subjectId);
              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-4 shadow-2xs space-y-3 transition-all"
                >
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-mono font-bold text-slate-400">Q{idx + 1}</span>

                      {/* Component Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          q.component === 'CA1'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.component === 'CA2'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {q.component}
                      </span>

                      {/* Subject */}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {sub?.name || 'Subject'} ({q.classLevelId.toUpperCase()})
                      </span>

                      {/* Type */}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-mono text-[10px]">
                        {q.questionType}
                      </span>

                      {/* Topic */}
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {q.topic}
                      </span>

                      {/* Difficulty */}
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                          q.difficulty === 'easy'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : q.difficulty === 'hard'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-bold text-slate-700 font-mono">
                        {q.marks || 1} mark{q.marks > 1 ? 's' : ''}
                      </span>

                      {/* Status toggle for Admin / Exam Officer */}
                      {isAdminOrExamOfficer ? (
                        <button
                          onClick={() =>
                            onUpdateQuestionStatus(
                              q.id,
                              q.status === 'approved' ? 'draft' : 'approved'
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                            q.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {q.status}
                        </button>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            q.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {q.status}
                        </span>
                      )}

                      <button
                        onClick={() => handleOpenForm(q)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Edit Question"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteQuestion(q.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-xs font-semibold text-slate-900 leading-relaxed">
                    {q.questionText}
                  </div>

                  {/* Options (if MCQ) */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {q.options.map((opt, oIdx) => {
                        const optLetter = String.fromCharCode(65 + oIdx);
                        const isCorrect = q.correctAnswer === optLetter;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-xl border flex items-center space-x-2 transition-colors ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {optLetter}
                            </span>
                            <span className="flex-1">{opt.replace(/^[A-E]\.\s*/, '')}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Marking Guide / Explanation */}
                  {(q.markingGuide || q.explanation) && (
                    <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-600 border border-slate-200 space-y-0.5">
                      {q.markingGuide && (
                        <p>
                          <strong className="text-slate-800">Marking Guide:</strong> {q.markingGuide}
                        </p>
                      )}
                      {q.explanation && (
                        <p>
                          <strong className="text-slate-800">Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Authored by: {q.creatorName}</span>
                    <span>Created: {new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Form Modal (Create / Edit) */}
      {isQuestionFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>{editingQuestion ? 'Edit Question' : 'Create New Question'}</span>
              </h2>
              <button
                onClick={() => setIsQuestionFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestionForm} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Grid: Component & Format */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Component</label>
                  <select
                    value={formComponent}
                    onChange={(e) => setFormComponent(e.target.value as TermAssessmentComponent)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="CA1">CA1 Test</option>
                    <option value="CA2">CA2 Test</option>
                    <option value="EXAM">Terminal Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    {authorizedSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Level</label>
                  <select
                    value={formClassLevelId}
                    onChange={(e) => setFormClassLevelId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    {classLevels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Format Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as QuestionType)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="fill_in_the_gap">Fill in the Gap</option>
                    <option value="essay">Essay / Theory</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
              </div>

              {/* Topic & Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Curriculum Topic</label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="e.g., Number Bases, Photosynthesis, Concord"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formMarks}
                    onChange={(e) => setFormMarks(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Prompt</label>
                <textarea
                  rows={3}
                  value={formQuestionText}
                  onChange={(e) => setFormQuestionText(e.target.value)}
                  placeholder="Type the question clearly..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* MCQ Options */}
              {formType === 'mcq' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700">Options & Correct Answer</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formOptions.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200"
                        >
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={formCorrectAnswer === letter}
                            onChange={() => setFormCorrectAnswer(letter)}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-bold text-slate-600">{letter}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...formOptions];
                              updated[idx] = e.target.value;
                              setFormOptions(updated);
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* True False */}
              {formType === 'true_false' && (
                <div className="flex items-center space-x-4 pt-2">
                  <span className="font-bold text-slate-700">Correct Answer:</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="tfAnswer"
                      checked={formCorrectAnswer === 'A'}
                      onChange={() => setFormCorrectAnswer('A')}
                      className="text-emerald-600"
                    />
                    <span>True</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="tfAnswer"
                      checked={formCorrectAnswer === 'B'}
                      onChange={() => setFormCorrectAnswer('B')}
                      className="text-emerald-600"
                    />
                    <span>False</span>
                  </label>
                </div>
              )}

              {/* Theory Marking Guide */}
              {(formType === 'essay' || formType === 'short_answer' || formType === 'fill_in_the_gap') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teacher's Marking Guide / Sample Solution
                  </label>
                  <textarea
                    rows={2}
                    value={formMarkingGuide}
                    onChange={(e) => setFormMarkingGuide(e.target.value)}
                    placeholder="Provide keywords, steps, or breakdown of marks..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Educational Explanation / Feedback
                </label>
                <input
                  type="text"
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explains why this answer is correct..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      <BulkQuestionImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        subjects={authorizedSubjects}
        classLevels={classLevels}
        defaultSubjectId={selectedSubjectId}
        defaultComponent={(selectedComponent !== 'all' ? selectedComponent : 'CA1') as TermAssessmentComponent}
        creatorId={currentUser?.uid || 'staff'}
        creatorName={currentUser?.displayName || 'Teacher'}
        onImport={async (imported) => {
          await onBatchSaveQuestions(imported);
        }}
      />

      {/* Exam Paper Modal */}
      <ExamPaperModal
        isOpen={isExamPaperOpen}
        onClose={() => setIsExamPaperOpen(false)}
        questions={filteredQuestions}
        subject={currentSubjectObj}
        classArm={classArms[0]}
        component={selectedComponent !== 'all' ? selectedComponent : 'CA1'}
        session={schoolConfig?.currentSession || '2025/2026'}
        term={schoolConfig?.currentTerm || '1st Term'}
        schoolConfig={schoolConfig}
      />

      {/* CBT / Quiz Preview Modal */}
      {isCbtPreviewOpen && (
        <QuizTakerModal
          isOpen={isCbtPreviewOpen}
          onClose={() => setIsCbtPreviewOpen(false)}
          assessment={cbtAssessmentMock}
          studentName={currentUser?.displayName || 'Student Preview'}
          onCompleteQuiz={(score: number) => {
            alert(`CBT Preview Complete! Scored ${score} / ${cbtAssessmentMock.maxScore} marks.`);
            setIsCbtPreviewOpen(false);
          }}
        />
      )}
    </div>
  );
};
