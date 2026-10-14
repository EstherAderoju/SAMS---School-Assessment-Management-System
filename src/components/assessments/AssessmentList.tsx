import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Play,
  ClipboardEdit,
  Award,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Assessment, ClassArm, Subject, Student } from '../../types';
import { AssessmentFormModal } from './AssessmentFormModal';
import { QuizTakerModal } from './QuizTakerModal';

interface AssessmentListProps {
  assessments: Assessment[];
  classArms: ClassArm[];
  subjects: Subject[];
  students: Student[];
  currentSession: string;
  currentTerm: string;
  currentUserId: string;
  onSaveAssessment: (assessment: Assessment) => Promise<void>;
  onNavigateToScoreEntry: (assessmentId: string) => void;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  classArms,
  subjects,
  students,
  currentSession,
  currentTerm,
  currentUserId,
  onSaveAssessment,
  onNavigateToScoreEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArmId, setSelectedArmId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<Assessment | null>(null);

  const filtered = assessments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArm = selectedArmId === 'all' || a.armId === selectedArmId;
    const matchesSub = selectedSubjectId === 'all' || a.subjectId === selectedSubjectId;
    const matchesType = selectedType === 'all' || a.assessmentType === selectedType;
    return matchesSearch && matchesArm && matchesSub && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'project':
      case 'practical':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'terminal_exam':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-emerald-700" />
            <span>Continuous Assessments & Examinations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Author and administer weekly tests, classwork, projects, laboratory practicals, and terminal exams
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAssessment(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assessment title or description..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedArmId}
            onChange={(e) => setSelectedArmId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden font-medium text-slate-700"
          >
            <option value="all">All Class Arms</option>
            {classArms.map((arm) => (
              <option key={arm.id} value={arm.id}>
                {arm.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden font-medium text-slate-700"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden font-medium text-slate-700"
          >
            <option value="all">All Types</option>
            <option value="weekly_test">Weekly Test</option>
            <option value="quiz">Interactive Quiz</option>
            <option value="project">Project / Practical</option>
            <option value="terminal_exam">Terminal Exam</option>
          </select>
        </div>
      </div>

      {/* Grid of assessments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((asm) => {
          const arm = classArms.find((a) => a.id === asm.armId);
          const sub = subjects.find((s) => s.id === asm.subjectId);
          const hasQuiz = asm.quizQuestions && asm.quizQuestions.length > 0;
          const hasRubric = asm.rubricCriteria && asm.rubricCriteria.length > 0;

          return (
            <div
              key={asm.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getTypeBadge(
                      asm.assessmentType
                    )}`}
                  >
                    {asm.assessmentType.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-bold font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    Max: {asm.maxScore} marks
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{asm.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {asm.description || 'Continuous assessment task designed for academic evaluation.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Subject:</span>
                    <strong className="text-slate-800 font-medium">{sub?.name || 'Subject'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Class Arm:</span>
                    <strong className="text-slate-800 font-medium">{arm?.name || 'Class'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Session / Term:</span>
                    <span className="text-slate-700">{asm.session} • {asm.term}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Weight in Result:</span>
                    <strong className="text-emerald-700 font-bold">{asm.weightPercent}%</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onNavigateToScoreEntry(asm.id)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                >
                  <ClipboardEdit className="w-3.5 h-3.5" />
                  <span>Enter Scores</span>
                </button>

                <div className="flex items-center space-x-2">
                  {hasQuiz && (
                    <button
                      onClick={() => setPreviewQuiz(asm)}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                      title="Test Interactive Quiz"
                    >
                      <Play className="w-3 h-3" />
                      <span>Take Quiz</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingAssessment(asm);
                      setIsFormOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AssessmentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={onSaveAssessment}
        initialAssessment={editingAssessment}
        classArms={classArms}
        subjects={subjects}
        currentSession={currentSession}
        currentTerm={currentTerm}
        currentUserId={currentUserId}
      />

      {previewQuiz && (
        <QuizTakerModal
          isOpen={true}
          onClose={() => setPreviewQuiz(null)}
          assessment={previewQuiz}
          studentName="Sample Student"
          onCompleteQuiz={() => {}}
        />
      )}
    </div>
  );
};
