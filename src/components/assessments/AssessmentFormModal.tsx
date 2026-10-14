import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen, Save, AlertCircle } from 'lucide-react';
import { Assessment, AssessmentType, ClassArm, Subject, QuizQuestion, RubricCriterion } from '../../types';

interface AssessmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assessment: Assessment) => Promise<void>;
  initialAssessment?: Assessment | null;
  classArms: ClassArm[];
  subjects: Subject[];
  currentSession: string;
  currentTerm: string;
  currentUserId: string;
}

export const AssessmentFormModal: React.FC<AssessmentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAssessment,
  classArms,
  subjects,
  currentSession,
  currentTerm,
  currentUserId,
}) => {
  const [formData, setFormData] = useState<Partial<Assessment>>({
    title: '',
    assessmentType: 'weekly_test',
    subjectId: subjects[0]?.id || '',
    classLevelId: classArms[0]?.classLevelId || 'jss-1',
    armId: classArms[0]?.id || '',
    session: currentSession,
    term: currentTerm,
    assignedTeacherId: currentUserId,
    maxScore: 10,
    weightPercent: 10,
    dueDate: new Date().toISOString().split('T')[0],
    assessmentDate: new Date().toISOString().split('T')[0],
    status: 'published',
    quizQuestions: [],
    rubricCriteria: [],
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'quiz' | 'rubric'>('basic');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialAssessment) {
      setFormData(initialAssessment);
      if (initialAssessment.quizQuestions && initialAssessment.quizQuestions.length > 0) {
        setActiveTab('quiz');
      } else if (initialAssessment.rubricCriteria && initialAssessment.rubricCriteria.length > 0) {
        setActiveTab('rubric');
      } else {
        setActiveTab('basic');
      }
    } else {
      setFormData({
        id: `asm-${Date.now()}`,
        title: '',
        assessmentType: 'weekly_test',
        subjectId: subjects[0]?.id || '',
        classLevelId: classArms[0]?.classLevelId || 'jss-1',
        armId: classArms[0]?.id || '',
        session: currentSession,
        term: currentTerm,
        assignedTeacherId: currentUserId,
        maxScore: 10,
        weightPercent: 10,
        dueDate: new Date().toISOString().split('T')[0],
        assessmentDate: new Date().toISOString().split('T')[0],
        status: 'published',
        quizQuestions: [],
        rubricCriteria: [],
      });
      setActiveTab('basic');
    }
  }, [initialAssessment, isOpen, classArms, subjects, currentSession, currentTerm, currentUserId]);

  if (!isOpen) return null;

  const handleAddQuizQuestion = () => {
    const q: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      type: 'multiple_choice',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      points: 2,
    };
    setFormData({ ...formData, quizQuestions: [...(formData.quizQuestions || []), q] });
  };

  const handleRemoveQuestion = (idx: number) => {
    const list = [...(formData.quizQuestions || [])];
    list.splice(idx, 1);
    setFormData({ ...formData, quizQuestions: list });
  };

  const handleAddRubricCriterion = () => {
    const r: RubricCriterion = {
      id: `rc-${Date.now()}`,
      title: 'Criterion',
      description: 'Description of expected work',
      maxPoints: 5,
    };
    setFormData({ ...formData, rubricCriteria: [...(formData.rubricCriteria || []), r] });
  };

  const handleRemoveRubricCriterion = (idx: number) => {
    const list = [...(formData.rubricCriteria || [])];
    list.splice(idx, 1);
    setFormData({ ...formData, rubricCriteria: list });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title?.trim()) {
      setError('Please provide an assessment title');
      return;
    }
    if ((formData.maxScore || 0) <= 0) {
      setError('Maximum score must be greater than zero');
      return;
    }

    setLoading(true);
    try {
      const selectedArm = classArms.find((a) => a.id === formData.armId);
      await onSave({
        id: formData.id || `asm-${Date.now()}`,
        title: formData.title.trim(),
        component: formData.component || 'CA1',
        assessmentType: formData.assessmentType || 'written',
        description: formData.description || '',
        subjectId: formData.subjectId || subjects[0]?.id || '',
        classLevelId: selectedArm?.classLevelId || formData.classLevelId || 'jss-1',
        armId: formData.armId || classArms[0]?.id || '',
        session: formData.session || currentSession,
        term: formData.term || currentTerm,
        assignedTeacherId: formData.assignedTeacherId || currentUserId,
        maxScore: Number(formData.maxScore),
        weightPercent: Number(formData.weightPercent || 10),
        dueDate: formData.dueDate,
        assessmentDate: formData.assessmentDate || new Date().toISOString().split('T')[0],
        status: formData.status || 'published',
        quizQuestions: formData.quizQuestions,
        rubricCriteria: formData.rubricCriteria,
        createdAt: formData.createdAt || new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-6">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">
              {initialAssessment ? 'Edit Assessment' : 'Create New Assessment'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-6 pt-3 space-x-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'basic' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
            }`}
          >
            General Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'quiz' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
            }`}
          >
            Online Quiz Builder ({formData.quizQuestions?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rubric')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'rubric' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
            }`}
          >
            Rubric Criteria ({formData.rubricCriteria?.length || 0})
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. CA 2: Algebra & Equations Midterm Test"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Type</label>
                  <select
                    value={formData.assessmentType}
                    onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
                  >
                    <option value="weekly_test">Weekly Test</option>
                    <option value="quiz">Interactive Quiz</option>
                    <option value="classwork">Classwork</option>
                    <option value="homework">Homework</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project Work</option>
                    <option value="practical">Practical / Lab Assessment</option>
                    <option value="oral">Oral Assessment</option>
                    <option value="ca">Continuous Assessment (CA)</option>
                    <option value="midterm_exam">Midterm Examination</option>
                    <option value="terminal_exam">End-of-Term Examination</option>
                    <option value="mock_exam">Mock Examination</option>
                    <option value="custom">Custom Assessment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class Arm</label>
                  <select
                    value={formData.armId}
                    onChange={(e) => {
                      const arm = classArms.find((a) => a.id === e.target.value);
                      setFormData({
                        ...formData,
                        armId: e.target.value,
                        classLevelId: arm?.classLevelId || formData.classLevelId,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
                  >
                    {classArms.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
                  >
                    <option value="published">Published (Scores Entry Open)</option>
                    <option value="draft">Draft (Private)</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Score</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Result Contribution Weight (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.weightPercent}
                    onChange={(e) => setFormData({ ...formData, weightPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Date</label>
                  <input
                    type="date"
                    value={formData.assessmentDate}
                    onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Specific guidelines for students or teachers administering the task..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Quiz Builder Tab */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Online Quiz Question Bank</h4>
                  <p className="text-[11px] text-slate-500">
                    Supports objective questions with auto-marking and short answers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuizQuestion}
                  className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.quizQuestions?.map((q, idx) => (
                  <div key={q.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Question {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const list = [...(formData.quizQuestions || [])];
                        list[idx].question = e.target.value;
                        setFormData({ ...formData, quizQuestions: list });
                      }}
                      placeholder="Enter question text here..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Type</label>
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const list = [...(formData.quizQuestions || [])];
                            list[idx].type = e.target.value as any;
                            setFormData({ ...formData, quizQuestions: list });
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="true_false">True / False</option>
                          <option value="short_answer">Short Answer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Points</label>
                        <input
                          type="number"
                          value={q.points}
                          onChange={(e) => {
                            const list = [...(formData.quizQuestions || [])];
                            list[idx].points = Number(e.target.value);
                            setFormData({ ...formData, quizQuestions: list });
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Correct Answer (for Auto-Marking)
                      </label>
                      <input
                        type="text"
                        value={q.correctAnswer}
                        onChange={(e) => {
                          const list = [...(formData.quizQuestions || [])];
                          list[idx].correctAnswer = e.target.value;
                          setFormData({ ...formData, quizQuestions: list });
                        }}
                        placeholder="Expected exact answer..."
                        className="w-full px-2.5 py-1 text-xs border border-emerald-300 rounded-lg bg-emerald-50/50 text-emerald-950 font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rubric Tab */}
          {activeTab === 'rubric' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Grading Rubric Criteria</h4>
                  <p className="text-[11px] text-slate-500">
                    Define criteria and point allocations for project or lab work
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddRubricCriterion}
                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Criterion</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.rubricCriteria?.map((r, idx) => (
                  <div key={r.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Criterion {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRubricCriterion(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Title</label>
                        <input
                          type="text"
                          value={r.title}
                          onChange={(e) => {
                            const list = [...(formData.rubricCriteria || [])];
                            list[idx].title = e.target.value;
                            setFormData({ ...formData, rubricCriteria: list });
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Max Points</label>
                        <input
                          type="number"
                          value={r.maxPoints}
                          onChange={(e) => {
                            const list = [...(formData.rubricCriteria || [])];
                            list[idx].maxPoints = Number(e.target.value);
                            setFormData({ ...formData, rubricCriteria: list });
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Description</label>
                      <input
                        type="text"
                        value={r.description}
                        onChange={(e) => {
                          const list = [...(formData.rubricCriteria || [])];
                          list[idx].description = e.target.value;
                          setFormData({ ...formData, rubricCriteria: list });
                        }}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Assessment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
