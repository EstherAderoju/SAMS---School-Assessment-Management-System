import React, { useState } from 'react';
import { X, CheckCircle, HelpCircle, Award, AlertCircle, ArrowRight } from 'lucide-react';
import { Assessment, QuizQuestion } from '../../types';

interface QuizTakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment;
  studentName?: string;
  onCompleteQuiz: (score: number, maxScore: number, answers: Record<string, string>) => void;
}

export const QuizTakerModal: React.FC<QuizTakerModalProps> = ({
  isOpen,
  onClose,
  assessment,
  studentName = 'Student',
  onCompleteQuiz,
}) => {
  const questions: QuizQuestion[] = assessment.quizQuestions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIdx];

  const handleSelectOption = (opt: string) => {
    setAnswers({ ...answers, [currentQ.id]: opt });
  };

  const handleTextAnswer = (text: string) => {
    setAnswers({ ...answers, [currentQ.id]: text });
  };

  const handleSubmit = () => {
    let score = 0;
    let max = 0;

    questions.forEach((q) => {
      max += q.points;
      const userAns = (answers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();
      if (userAns && (userAns === correctAns || userAns.includes(correctAns))) {
        score += q.points;
      }
    });

    // Scale to assessment maxScore
    const normalized = Math.round((score / (max || 1)) * assessment.maxScore * 10) / 10;
    setFinalScore(normalized);
    setIsSubmitted(true);
    onCompleteQuiz(normalized, assessment.maxScore, answers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-800 text-white p-5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
              Interactive Quiz Engine
            </span>
            <h2 className="text-base font-bold mt-1">{assessment.title}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSubmitted ? (
          <div className="p-6 space-y-6">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1">
                <span>Question {currentIdx + 1} of {questions.length}</span>
                <span>Worth: {currentQ.points} marks</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Text */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            {/* Options */}
            {currentQ.type === 'multiple_choice' || currentQ.type === 'true_false' ? (
              <div className="space-y-2">
                {currentQ.options?.map((opt, i) => {
                  const selected = answers[currentQ.id] === opt;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-600/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{opt}</span>
                      {selected && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Your Answer:</label>
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleTextAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-hidden"
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(currentIdx - 1)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white flex items-center space-x-1"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Quiz Completed!</h3>
            <p className="text-xs text-slate-500">
              Objective questions have been automatically marked. Continuous assessment records updated.
            </p>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 inline-block px-8">
              <p className="text-xs uppercase font-bold text-emerald-800">Your Score</p>
              <p className="text-3xl font-extrabold text-emerald-950 mt-1">
                {finalScore} <span className="text-base font-normal text-emerald-700">/ {assessment.maxScore}</span>
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
