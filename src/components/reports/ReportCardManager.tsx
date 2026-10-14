import React, { useState } from 'react';
import { FileText, Printer, CheckCircle2, Award, Search, Sparkles, RefreshCw } from 'lucide-react';
import { ReportCard, ClassArm, SchoolConfig, Student } from '../../types';
import { ReportCardView } from './ReportCardView';

interface ReportCardManagerProps {
  reportCards: ReportCard[];
  classArms: ClassArm[];
  students: Student[];
  schoolConfig: SchoolConfig | null;
  onGenerateReportCards: (armId: string) => Promise<void>;
  onUpdateReportCard: (card: ReportCard) => Promise<void>;
}

export const ReportCardManager: React.FC<ReportCardManagerProps> = ({
  reportCards,
  classArms,
  students,
  schoolConfig,
  onGenerateReportCards,
  onUpdateReportCard,
}) => {
  const [selectedArmId, setSelectedArmId] = useState<string>(classArms[0]?.id || '');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const armCards = reportCards.filter((c) => c.armId === selectedArmId);
  const activeCard = armCards.find((c) => c.id === selectedCardId) || armCards[0];

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      await onGenerateReportCards(selectedArmId);
      setSuccessMsg(`Generated and updated all student report cards for ${classArms.find(a => a.id === selectedArmId)?.name}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-emerald-700" />
            <span>Official Termly Report Cards</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate, preview, customize remarks, and print official Nigerian secondary school terminal academic reports
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateAll}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Computing Cards...' : 'Regenerate Class Cards'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Current Report</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Class Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-700">Class Arm:</label>
          <select
            value={selectedArmId}
            onChange={(e) => {
              setSelectedArmId(e.target.value);
              setSelectedCardId(null);
            }}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden font-semibold text-slate-800"
          >
            {classArms.map((arm) => (
              <option key={arm.id} value={arm.id}>
                {arm.name} ({arm.classLevelId.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
          {armCards.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                activeCard?.id === card.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{card.studentName}</span>
              <span className="font-mono text-[10px] opacity-75">({card.averageScore}%)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Report Card Viewer */}
      {activeCard ? (
        <div className="space-y-6">
          <ReportCardView reportCard={activeCard} schoolConfig={schoolConfig} />
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No report cards compiled for this arm yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Regenerate Class Cards" above to automatically calculate subject results, totals, class positions, and affective domain summaries.
          </p>
          <button
            onClick={handleGenerateAll}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Class Report Cards</span>
          </button>
        </div>
      )}
    </div>
  );
};
