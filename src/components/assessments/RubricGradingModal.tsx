import React, { useState } from 'react';
import { X, Award, CheckCircle, Save } from 'lucide-react';
import { Assessment, Student, RubricCriterion } from '../../types';

interface RubricGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment;
  student: Student;
  currentScores?: Record<string, number>;
  onSaveScores: (scores: Record<string, number>, total: number, feedback: string) => Promise<void>;
}

export const RubricGradingModal: React.FC<RubricGradingModalProps> = ({
  isOpen,
  onClose,
  assessment,
  student,
  currentScores = {},
  onSaveScores,
}) => {
  const criteria: RubricCriterion[] = assessment.rubricCriteria || [];
  const [scores, setScores] = useState<Record<string, number>>(currentScores);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const totalPoints = criteria.reduce((sum, c) => sum + (scores[c.id] || 0), 0);
  const maxRubricPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0);

  const handleScoreChange = (criterionId: string, val: number) => {
    setScores({ ...scores, [criterionId]: val });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Normalize to assessment maxScore
      const normalized =
        maxRubricPoints > 0
          ? Math.round((totalPoints / maxRubricPoints) * assessment.maxScore * 10) / 10
          : totalPoints;
      await onSaveScores(scores, normalized, feedback);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
              Rubric Assessment
            </span>
            <h2 className="text-base font-bold mt-1">{assessment.title}</h2>
            <p className="text-xs text-slate-400">Student: {student.fullName} ({student.admissionNumber})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
            <span className="text-xs font-semibold text-emerald-900">Total Rubric Score</span>
            <span className="text-base font-extrabold text-emerald-950 font-mono">
              {totalPoints} / {maxRubricPoints} pts (Equivalent: {Math.round((totalPoints / (maxRubricPoints || 1)) * assessment.maxScore * 10) / 10} / {assessment.maxScore})
            </span>
          </div>

          <div className="space-y-3">
            {criteria.map((c) => (
              <div key={c.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{c.title}</h4>
                    <p className="text-[11px] text-slate-500">{c.description}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Max: {c.maxPoints} pts
                  </span>
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  {Array.from({ length: c.maxPoints + 1 }, (_, i) => i).map((pt) => {
                    const isSelected = scores[c.id] === pt;
                    return (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => handleScoreChange(c.id, pt)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Qualitative Feedback</label>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Constructive remarks on student's practical execution..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Rubric Marks'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
