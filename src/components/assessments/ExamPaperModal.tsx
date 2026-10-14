import React, { useRef } from 'react';
import { X, Printer, BookOpen, CheckCircle2, Award, Clock } from 'lucide-react';
import { BankQuestion, Subject, ClassArm, SchoolConfig } from '../../types';

interface ExamPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: BankQuestion[];
  subject?: Subject;
  classArm?: ClassArm;
  component: string;
  session: string;
  term: string;
  schoolConfig: SchoolConfig | null;
}

export const ExamPaperModal: React.FC<ExamPaperModalProps> = ({
  isOpen,
  onClose,
  questions,
  subject,
  classArm,
  component,
  session,
  term,
  schoolConfig,
}) => {
  const [showAnswerKey, setShowAnswerKey] = React.useState(false);

  if (!isOpen) return null;

  const schoolName = schoolConfig?.schoolName || 'Urban Day Grammar School';
  const schoolAddress = schoolConfig?.address || 'Olaogun, Old Ife Road, Ibadan, Oyo State, Nigeria';
  const schoolMotto = schoolConfig?.motto || 'Excellence, Knowledge and Character';

  const componentTitle =
    component === 'CA1'
      ? 'Continuous Assessment 1 (CA1) Test'
      : component === 'CA2'
      ? 'Continuous Assessment 2 (CA2) Test'
      : `${term} Examination`;

  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);
  const timeAllowed = component === 'EXAM' ? '1 Hour 30 Minutes' : '45 Minutes';

  const objectiveQuestions = questions.filter(
    (q) => q.questionType === 'mcq' || q.questionType === 'true_false'
  );
  const theoryQuestions = questions.filter(
    (q) => q.questionType === 'short_answer' || q.questionType === 'essay' || q.questionType === 'structured' || q.questionType === 'fill_in_the_gap'
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Bar - Hidden during print */}
        <div className="print:hidden p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-wide">
              Printable Examination Paper & Marking Guide
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAnswerKey}
                onChange={(e) => setShowAnswerKey(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Include Answer Key / Marking Guide</span>
            </label>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Paper</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document */}
        <div className="p-6 sm:p-10 overflow-y-auto font-serif text-slate-900 bg-white space-y-6">
          {/* Institutional Header */}
          {/* Official School Header with Crest */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            {schoolConfig?.logoUrl ? (
              <div className="flex justify-center mb-2">
                <img
                  src={schoolConfig.logoUrl}
                  alt={schoolName}
                  className="w-16 h-16 object-contain"
                />
              </div>
            ) : (
              <div className="flex justify-center mb-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: schoolConfig?.primaryColor || '#4169E1' }}
                >
                  <Award className="w-7 h-7 text-white" />
                </div>
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-950 font-sans">
              {schoolName}
            </h1>
            <p className="text-xs text-slate-700 italic font-sans">{schoolMotto}</p>
            <p className="text-xs text-slate-600 font-sans">{schoolAddress}</p>

            <div className="pt-2 text-sm font-bold uppercase tracking-wide text-slate-900 font-sans flex flex-wrap items-center justify-center gap-x-4">
              <span>{session} ACADEMIC SESSION</span>
              <span>•</span>
              <span>{term.toUpperCase()}</span>
              <span>•</span>
              <span
                className="font-extrabold"
                style={{ color: schoolConfig?.primaryColor || '#4169E1' }}
              >
                {componentTitle.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Exam Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-300 p-3 bg-slate-50/50 font-sans">
            <div>
              <span className="text-slate-500 block">SUBJECT:</span>
              <strong className="text-slate-900">{subject?.name || 'General Subject'} ({subject?.code || 'SUB'})</strong>
            </div>
            <div>
              <span className="text-slate-500 block">CLASS:</span>
              <strong className="text-slate-900">{classArm?.name || 'Secondary Class'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">TIME ALLOWED:</span>
              <strong className="text-slate-900">{timeAllowed}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">TOTAL MARKS:</span>
              <strong className="text-slate-900">{totalMarks} Marks</strong>
            </div>
          </div>

          {/* Student Info Entry Lines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-slate-600 whitespace-nowrap">STUDENT NAME:</span>
              <div className="flex-1 border-b border-dotted border-slate-400 h-5"></div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-600 whitespace-nowrap">ADMISSION NO:</span>
              <div className="flex-1 border-b border-dotted border-slate-400 h-5"></div>
            </div>
          </div>

          {/* General Instructions */}
          <div className="p-3 bg-slate-100/70 border-l-4 border-slate-900 text-xs font-sans space-y-1">
            <strong>GENERAL INSTRUCTIONS:</strong>
            <p className="text-slate-700">
              1. Do not open this booklet until you are instructed to do so by the invigilator.
              <br />
              2. For objective questions, carefully shade or circle the letter corresponding to the correct answer.
              <br />
              3. For theory questions, write your answers legibly in the spaces provided or on the supplementary answer sheet.
            </p>
          </div>

          {/* SECTION A: OBJECTIVE QUESTIONS */}
          {objectiveQuestions.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-900 pb-1">
                <h3 className="text-sm font-bold uppercase tracking-wider font-sans">
                  SECTION A: OBJECTIVE QUESTIONS ({objectiveQuestions.reduce((a, b) => a + (b.marks || 1), 0)} Marks)
                </h3>
                <p className="text-xs text-slate-500 font-sans italic">Answer ALL questions in this section.</p>
              </div>

              <div className="space-y-4">
                {objectiveQuestions.map((q, idx) => (
                  <div key={q.id} className="text-xs space-y-1.5 leading-relaxed">
                    <div className="flex items-start space-x-1.5 font-medium">
                      <span className="font-bold text-slate-900 w-6 shrink-0">{idx + 1}.</span>
                      <div className="flex-1">
                        <span>{q.questionText}</span>
                        <span className="ml-1 text-slate-500 text-[11px] font-sans">({q.marks} mk{q.marks > 1 ? 's' : ''})</span>
                      </div>
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-6 text-slate-800">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center space-x-1.5">
                            <span className="font-semibold">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt.replace(/^[A-E]\.\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION B: THEORY / ESSAY QUESTIONS */}
          {theoryQuestions.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="border-b border-slate-900 pb-1">
                <h3 className="text-sm font-bold uppercase tracking-wider font-sans">
                  SECTION B: THEORY & STRUCTURED QUESTIONS ({theoryQuestions.reduce((a, b) => a + (b.marks || 1), 0)} Marks)
                </h3>
                <p className="text-xs text-slate-500 font-sans italic">Answer the following questions in clear handwriting.</p>
              </div>

              <div className="space-y-6">
                {theoryQuestions.map((q, idx) => (
                  <div key={q.id} className="text-xs space-y-2">
                    <div className="flex items-start space-x-1.5 font-medium">
                      <span className="font-bold text-slate-900 w-6 shrink-0">
                        {objectiveQuestions.length + idx + 1}.
                      </span>
                      <div className="flex-1">
                        <span className="font-semibold text-slate-900">{q.questionText}</span>
                        <span className="ml-1 text-slate-500 text-[11px] font-sans">({q.marks} marks)</span>
                      </div>
                    </div>

                    {/* Answer Writing Lines for students */}
                    <div className="pl-6 space-y-3 pt-1">
                      <div className="border-b border-dashed border-slate-300 h-4"></div>
                      <div className="border-b border-dashed border-slate-300 h-4"></div>
                      <div className="border-b border-dashed border-slate-300 h-4"></div>
                      <div className="border-b border-dashed border-slate-300 h-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEACHER MARKING GUIDE / ANSWER KEY (Optional / Toggleable) */}
          {showAnswerKey && (
            <div className="mt-8 pt-6 border-t-2 border-emerald-700 bg-emerald-50/40 p-4 rounded-xl space-y-4 font-sans text-xs">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>CONFIDENTIAL: TEACHER MARKING GUIDE & ANSWER KEY</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 underline">Section A (Objectives)</h4>
                  <div className="space-y-1">
                    {objectiveQuestions.map((q, idx) => (
                      <div key={q.id} className="flex items-center justify-between border-b border-emerald-100 py-1">
                        <span className="text-slate-700">Q{idx + 1}: {q.questionText.slice(0, 35)}...</span>
                        <span className="font-bold text-emerald-800 px-2 py-0.5 bg-emerald-100 rounded">
                          {q.correctAnswer} ({q.marks}m)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2 underline">Section B (Theory Rubric)</h4>
                  <div className="space-y-2">
                    {theoryQuestions.map((q, idx) => (
                      <div key={q.id} className="p-2 bg-white rounded border border-emerald-200 text-[11px] space-y-1">
                        <strong className="text-slate-900 block">
                          Q{objectiveQuestions.length + idx + 1}: {q.questionText.slice(0, 40)}... ({q.marks}m)
                        </strong>
                        <p className="text-slate-600 italic">
                          Guide: {q.markingGuide || q.correctAnswer || 'Standard assessment grading criteria applied.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Invigilation Signature */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs font-sans text-slate-500">
            <div>
              <span>Invigilator Name: _______________________</span>
            </div>
            <div className="text-right">
              <span>Invigilator Signature & Date: _______________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
