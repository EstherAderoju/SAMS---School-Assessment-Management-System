import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Award,
  Layers,
  Palette,
  Sliders,
} from 'lucide-react';
import { SchoolConfig, GradeBoundary } from '../../types';
import { validateGradingScale } from '../../services/calculationEngine';
import { BrandingSettings } from './BrandingSettings';

interface SchoolSettingsProps {
  schoolConfig: SchoolConfig | null;
  currentUserRole?: string;
  onSaveConfig: (config: Partial<SchoolConfig>) => Promise<void>;
}

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({
  schoolConfig,
  currentUserRole = 'admin',
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<SchoolConfig>(
    schoolConfig || {
      schoolName: 'Kingsway Model Secondary School',
      motto: 'Excellence, Knowledge and Character',
      address: '14 Education Boulevard, Victoria Island, Lagos State, Nigeria',
      contactPhone: '+234 803 123 4567',
      contactEmail: 'admissions@kingswayschool.edu.ng',
      logoUrl: '',
      primaryColor: '#065F46',
      secondaryColor: '#D97706',
      currentSession: '2025/2026',
      currentTerm: '1st Term',
      availableSessions: ['2023/2024', '2024/2025', '2025/2026', '2026/2027'],
      rankingEnabled: true,
      minAttendanceDays: 60,
      gradingScale: [],
      assessmentStructure: {
        ca1MaxScore: 10,
        ca1Weight: 10,
        ca2MaxScore: 10,
        ca2Weight: 10,
        examMaxScore: 80,
        examWeight: 80,
        totalMaxScore: 100,
        totalWeight: 100,
      },
      promotionMinAverage: 50,
      promotionCoreSubjectPassCount: 2,
    }
  );

  const [activeTab, setActiveTab] = useState<'general' | 'session' | 'weights' | 'grading' | 'promotion'>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStructureChange = (field: keyof typeof formData.assessmentStructure, val: number) => {
    const updated = { ...formData.assessmentStructure, [field]: val };
    const sumWeight = (updated.ca1Weight || 0) + (updated.ca2Weight || 0) + (updated.examWeight || 0);
    const sumScore = (updated.ca1MaxScore || 0) + (updated.ca2MaxScore || 0) + (updated.examMaxScore || 0);
    updated.totalWeight = sumWeight;
    updated.totalMaxScore = sumScore;
    setFormData({ ...formData, assessmentStructure: updated });
  };

  const handleGradeBoundaryChange = (idx: number, field: keyof GradeBoundary, val: any) => {
    const scale = [...formData.gradingScale];
    scale[idx] = { ...scale[idx], [field]: val };
    setFormData({ ...formData, gradingScale: scale });
  };

  const handleAddGradeBoundary = () => {
    const newGrade: GradeBoundary = {
      grade: 'D',
      minScore: 45,
      maxScore: 49.99,
      remark: 'Pass',
      points: 3,
    };
    setFormData({ ...formData, gradingScale: [...formData.gradingScale, newGrade] });
  };

  const handleRemoveGradeBoundary = (idx: number) => {
    const scale = [...formData.gradingScale];
    scale.splice(idx, 1);
    setFormData({ ...formData, gradingScale: scale });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate weights
    const totalWeight = formData.assessmentStructure?.totalWeight ?? 100;
    if (totalWeight !== 100) {
      setValidationError(`Total assessment weight must equal exactly 100% (currently ${totalWeight}%).`);
      return;
    }

    // Validate grading scale
    const check = validateGradingScale(formData.gradingScale);
    if (!check.valid) {
      setValidationError(check.error || 'Invalid grading boundary intervals.');
      return;
    }

    setLoading(true);
    try {
      await onSaveConfig(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Settings className="w-6 h-6 text-emerald-700" />
            <span>School Configuration & Assessment Policy</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional branding, academic sessions, CA/Exam weight ratios, and Nigerian grading scales
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-2 shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>School parameters, assessment weights, and grading boundaries updated successfully!</span>
        </div>
      )}

      {validationError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'general' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>School Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('session')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'session' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Sessions & Terms</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('weights')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'weights' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Assessment Weights</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grading')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'grading' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Grading Scale (A1 - F9)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('promotion')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'promotion' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Promotion & Ranking</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        {/* Tab 1: General Branding */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <BrandingSettings
              schoolConfig={formData}
              currentUserRole={currentUserRole}
              onSaveConfig={async (cfg) => {
                const merged = { ...formData, ...cfg };
                setFormData(merged);
                await onSaveConfig(merged);
              }}
            />

            {/* Campus Address & Contact Details */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Institutional Contact & Physical Campus
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campus Address (Printed on Report Sheets)
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Telephone
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sessions & Terms */}
        {activeTab === 'session' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Active Academic Session</label>
              <select
                value={formData.currentSession}
                onChange={(e) => setFormData({ ...formData, currentSession: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-slate-900"
              >
                {formData.availableSessions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Academic Term</label>
              <select
                value={formData.currentTerm}
                onChange={(e) => setFormData({ ...formData, currentTerm: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-emerald-800"
              >
                <option value="1st Term">1st Term (September - December)</option>
                <option value="2nd Term">2nd Term (January - April)</option>
                <option value="3rd Term">3rd Term (May - July / Promotional)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mandatory School Days Opened</label>
              <input
                type="number"
                value={formData.minAttendanceDays}
                onChange={(e) => setFormData({ ...formData, minAttendanceDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Used to calculate student termly attendance percentage</p>
            </div>
          </div>
        )}

        {/* Tab 3: Fixed Assessment Structure (CA1, CA2 & Exam) */}
        {activeTab === 'weights' && (
          <div className="space-y-5 max-w-2xl">
            <div className={`p-4 rounded-xl border text-xs ${
              (formData.assessmentStructure?.totalWeight || 100) === 100
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm">
                  Total Final Contribution: {formData.assessmentStructure?.totalWeight || 100}%
                </span>
                <span className="font-mono text-xs font-bold">
                  Total Max Raw Score: {formData.assessmentStructure?.totalMaxScore || 100} Marks
                </span>
              </div>
              <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
                Nigerian secondary school standard: Every academic term comprises exactly three components:
                <strong> Continuous Assessment 1 (CA1)</strong>, <strong>Continuous Assessment 2 (CA2)</strong>, and the <strong>End-of-Term Examination</strong>.
                Raw marks on papers are automatically normalized to their configured weight contributions.
              </p>
            </div>

            {/* Component 1: CA1 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h4 className="text-xs font-bold text-slate-900">1. Continuous Assessment 1 (CA1)</h4>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Mid-Term Task</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Paper Raw Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.assessmentStructure?.ca1MaxScore || 10}
                    onChange={(e) => handleStructureChange('ca1MaxScore', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Maximum points attainable on CA1 paper</p>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Final Result Contribution (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.assessmentStructure?.ca1Weight || 10}
                    onChange={(e) => handleStructureChange('ca1Weight', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-emerald-800 font-bold bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Percentage weight towards terminal grade</p>
                </div>
              </div>
            </div>

            {/* Component 2: CA2 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <h4 className="text-xs font-bold text-slate-900">2. Continuous Assessment 2 (CA2)</h4>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Pre-Exam Task</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Paper Raw Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.assessmentStructure?.ca2MaxScore || 10}
                    onChange={(e) => handleStructureChange('ca2MaxScore', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Maximum points attainable on CA2 paper</p>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Final Result Contribution (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.assessmentStructure?.ca2Weight || 10}
                    onChange={(e) => handleStructureChange('ca2Weight', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-indigo-800 font-bold bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Percentage weight towards terminal grade</p>
                </div>
              </div>
            </div>

            {/* Component 3: Examination */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <h4 className="text-xs font-bold text-slate-900">3. End-of-Term Examination</h4>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Terminal Assessment</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Paper Raw Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.assessmentStructure?.examMaxScore || 80}
                    onChange={(e) => handleStructureChange('examMaxScore', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Maximum points attainable on examination</p>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Final Result Contribution (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.assessmentStructure?.examWeight || 80}
                    onChange={(e) => handleStructureChange('examWeight', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-rose-800 font-bold bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Percentage weight towards terminal grade</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Grading Scale */}
        {activeTab === 'grading' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Grading Boundaries & WAEC/NECO Remark Scales</h4>
                <p className="text-[11px] text-slate-500">
                  Defines marks range for A1, B2, C4, etc. System automatically guards against overlapping or gap ranges.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddGradeBoundary}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Grade Level</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Grade Code</th>
                    <th className="py-2.5 px-3">Min Score</th>
                    <th className="py-2.5 px-3">Max Score</th>
                    <th className="py-2.5 px-3">Official Remark</th>
                    <th className="py-2.5 px-3">GPA Points</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.gradingScale.map((boundary, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={boundary.grade}
                          onChange={(e) => handleGradeBoundaryChange(idx, 'grade', e.target.value)}
                          className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-lg font-bold text-emerald-900 uppercase"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          value={boundary.minScore}
                          onChange={(e) => handleGradeBoundaryChange(idx, 'minScore', Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          value={boundary.maxScore}
                          onChange={(e) => handleGradeBoundaryChange(idx, 'maxScore', Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={boundary.remark}
                          onChange={(e) => handleGradeBoundaryChange(idx, 'remark', e.target.value)}
                          className="w-36 px-2 py-1 text-xs border border-slate-300 rounded-lg"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={boundary.points || 0}
                          onChange={(e) => handleGradeBoundaryChange(idx, 'points', Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveGradeBoundary(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Promotion & Ranking */}
        {activeTab === 'promotion' && (
          <div className="space-y-4 max-w-xl">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rankingEnabled}
                  onChange={(e) => setFormData({ ...formData, rankingEnabled: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900">Enable Class Arm Positions / Ranking</span>
                  <p className="text-[11px] text-slate-500">
                    Computes standard competitive rank (1st, 2nd, 3rd) on report cards and broadsheets
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Overall Average for Unconditional Promotion (%)
                </label>
                <input
                  type="number"
                  value={formData.promotionMinAverage}
                  onChange={(e) => setFormData({ ...formData, promotionMinAverage: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Core Passes (English & Mathematics)
                </label>
                <input
                  type="number"
                  value={formData.promotionCoreSubjectPassCount}
                  onChange={(e) => setFormData({ ...formData, promotionCoreSubjectPassCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Students failing English or Math may be placed on trial or required to repeat
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
