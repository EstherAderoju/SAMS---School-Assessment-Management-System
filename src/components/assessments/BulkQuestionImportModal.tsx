import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Sparkles,
  FileCheck,
  Edit2,
  Trash2,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  BankQuestion,
  Subject,
  ClassLevel,
  TermAssessmentComponent,
  QuestionType,
  QuestionDifficulty,
} from '../../types';
import {
  extractTextFromFile,
  parseQuestionsFromDocumentText,
} from '../../services/documentParser';

interface BulkQuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  classLevels: ClassLevel[];
  defaultSubjectId?: string;
  defaultComponent?: TermAssessmentComponent;
  creatorId: string;
  creatorName: string;
  onImport: (questions: BankQuestion[]) => Promise<void>;
}

interface ParsedRow {
  rowNum: number;
  data: Partial<BankQuestion>;
  raw: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

export const BulkQuestionImportModal: React.FC<BulkQuestionImportModalProps> = ({
  isOpen,
  onClose,
  subjects,
  classLevels,
  defaultSubjectId,
  defaultComponent = 'CA1',
  creatorId,
  creatorName,
  onImport,
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste'>('upload');
  const [fileInputName, setFileInputName] = useState<string>('');
  const [rawText, setRawText] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    defaultSubjectId || subjects[0]?.id || ''
  );
  const [selectedClassLevelId, setSelectedClassLevelId] = useState<string>('jss-1');
  const [selectedComponent, setSelectedComponent] = useState<TermAssessmentComponent>(
    defaultComponent
  );
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [documentWarnings, setDocumentWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  // Generate Sample CSV
  const handleDownloadSampleCsv = () => {
    const headers = [
      'SubjectCode',
      'ClassLevel',
      'Component',
      'QuestionType',
      'Topic',
      'Difficulty',
      'QuestionText',
      'OptionA',
      'OptionB',
      'OptionC',
      'OptionD',
      'OptionE',
      'CorrectAnswer',
      'Marks',
      'Explanation',
    ].join(',');

    const sampleRows = [
      'MTH,jss-1,CA1,mcq,"Number Bases",easy,"Convert binary number 1011_2 to base 10.",9,10,11,12,,C,2,"1*8 + 0*4 + 1*2 + 1*1 = 11."',
      'ENG,jss-1,CA1,mcq,"Parts of Speech",easy,"Identify the noun in: The clever student passed easily.",clever,student,passed,easily,,B,2,"Student is a common noun."',
      'ENG,jss-1,CA2,true_false,"Concord",medium,"The verb in \\"Either the teacher or the students was late\\" is grammatically correct.",True,False,,,,B,2,"With either/or, the verb agrees with the nearer subject (students - plural).',
      'BIO,sss-2,CA1,mcq,"Cell Biology",medium,"Which organelle is responsible for cellular respiration?",Ribosome,Mitochondria,Golgi body,Vacuole,,B,2,"Mitochondria produces ATP through aerobic respiration."',
      'ENG,jss-1,EXAM,essay,"Composition",hard,"Write a composition of 200 words on: The Day I Will Never Forget.",,,,,,Marking Guide,10,"Assess content (4m), organisation (3m), expression (2m), accuracy (1m)."',
    ];

    const csvContent = headers + '\n' + sampleRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sams_question_bank_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download Sample Word / Text Question Paper Format
  const handleDownloadSampleWordFormat = () => {
    const sampleDoc = `KINGS MODEL SECONDARY SCHOOL
ASSESSMENT COMPONENT: Continuous Assessment 1 (CA1)
SUBJECT: English Studies
CLASS: JSS 1

Question 1: What is the basic unit of life in living organisms?
A. Tissue
B. Cell
C. Organ
D. System
Correct Answer: B
Marks: 2
Topic: Cell Biology
Question Type: Multiple Choice

Question 2: Which of the following words is an abstract noun?
A. Chair
B. Courage
C. Abuja
D. Teacher
Correct Answer: B
Marks: 2
Topic: Nouns
Question Type: Multiple Choice

Question 3: Photosynthesis takes place primarily in the roots of green plants.
A. True
B. False
Correct Answer: B
Marks: 1
Topic: Botany
Question Type: True/False

Question 4: Write a well-structured essay of not less than 150 words describing your school library.
Correct Answer: Marking Guide: Content (4m), Organisation (3m), Expression (2m), Mechanical Accuracy (1m).
Marks: 10
Topic: Descriptive Writing
Question Type: Essay

Answer Key:
1. B
2. B
3. B
4. Marking Guide
`;

    const blob = new Blob([sampleDoc], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sams_sample_question_paper.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV Line Parser
  const parseCsvLines = (text: string): string[][] => {
    const lines: string[][] = [];
    const rawLines = text.split(/\r\n|\n|\r/);

    for (const line of rawLines) {
      if (!line.trim()) continue;
      const row: string[] = [];
      let inQuotes = false;
      let currentField = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      row.push(currentField.trim());
      lines.push(row);
    }
    return lines;
  };

  // Process and validate CSV text
  const handleParseCsv = (content: string) => {
    setErrorMsg(null);
    setDocumentWarnings([]);

    const rows = parseCsvLines(content);
    if (rows.length < 2) {
      setParsedRows([]);
      if (content.trim()) {
        setErrorMsg('CSV must contain a header row and at least one data row.');
      }
      return;
    }

    const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const parsed: ParsedRow[] = [];

    const colIndex = {
      subjectCode: headers.findIndex((h) => h.includes('subject')),
      classLevel: headers.findIndex((h) => h.includes('class') || h.includes('level')),
      component: headers.findIndex((h) => h.includes('comp')),
      questionType: headers.findIndex((h) => h.includes('type')),
      topic: headers.findIndex((h) => h.includes('topic')),
      difficulty: headers.findIndex((h) => h.includes('diff')),
      questionText: headers.findIndex((h) => h.includes('question') || h.includes('text')),
      optionA: headers.findIndex((h) => h === 'optiona' || h === 'a'),
      optionB: headers.findIndex((h) => h === 'optionb' || h === 'b'),
      optionC: headers.findIndex((h) => h === 'optionc' || h === 'c'),
      optionD: headers.findIndex((h) => h === 'optiond' || h === 'd'),
      optionE: headers.findIndex((h) => h === 'optione' || h === 'e'),
      correctAnswer: headers.findIndex((h) => h.includes('correct') || h.includes('answer')),
      marks: headers.findIndex((h) => h.includes('mark') || h.includes('point')),
      explanation: headers.findIndex((h) => h.includes('explain') || h.includes('guide')),
    };

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const errors: string[] = [];

      const rawSubject = colIndex.subjectCode >= 0 ? r[colIndex.subjectCode] || '' : '';
      const rawClassLevel = colIndex.classLevel >= 0 ? r[colIndex.classLevel] || '' : '';
      const rawComp = colIndex.component >= 0 ? r[colIndex.component]?.toUpperCase() || '' : '';
      const rawType = colIndex.questionType >= 0 ? r[colIndex.questionType]?.toLowerCase() || '' : 'mcq';
      const topic = colIndex.topic >= 0 ? r[colIndex.topic] || 'General' : 'General';
      const difficulty = (colIndex.difficulty >= 0 ? r[colIndex.difficulty]?.toLowerCase() : 'medium') as QuestionDifficulty;
      const questionText = colIndex.questionText >= 0 ? r[colIndex.questionText] || '' : '';
      const optA = colIndex.optionA >= 0 ? r[colIndex.optionA] || '' : '';
      const optB = colIndex.optionB >= 0 ? r[colIndex.optionB] || '' : '';
      const optC = colIndex.optionC >= 0 ? r[colIndex.optionC] || '' : '';
      const optD = colIndex.optionD >= 0 ? r[colIndex.optionD] || '' : '';
      const optE = colIndex.optionE >= 0 ? r[colIndex.optionE] || '' : '';
      const rawCorrect = colIndex.correctAnswer >= 0 ? r[colIndex.correctAnswer] || '' : '';
      const rawMarks = colIndex.marks >= 0 ? r[colIndex.marks] || '2' : '2';
      const explanation = colIndex.explanation >= 0 ? r[colIndex.explanation] || '' : '';

      if (!questionText) {
        errors.push('Question text is missing');
      }

      let matchedSubject = subjects.find(
        (s) => s.code.toLowerCase() === rawSubject.toLowerCase() || s.name.toLowerCase().includes(rawSubject.toLowerCase())
      );
      if (!matchedSubject) {
        matchedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
      }

      let classLevelId = selectedClassLevelId || 'jss-1';
      if (rawClassLevel) {
        const cl = classLevels.find(
          (c) => c.id.toLowerCase() === rawClassLevel.toLowerCase() || c.name.toLowerCase().replace(/\s+/g, '') === rawClassLevel.toLowerCase().replace(/\s+/g, '')
        );
        if (cl) classLevelId = cl.id;
      }

      let comp: TermAssessmentComponent = selectedComponent;
      if (rawComp === 'CA1' || rawComp === 'CA2' || rawComp === 'EXAM') {
        comp = rawComp;
      }

      let qType: QuestionType = 'mcq';
      if (['mcq', 'multiple_choice'].includes(rawType)) qType = 'mcq';
      else if (['true_false', 'boolean'].includes(rawType)) qType = 'true_false';
      else if (['fill_in_the_gap', 'gap'].includes(rawType)) qType = 'fill_in_the_gap';
      else if (['essay', 'theory'].includes(rawType)) qType = 'essay';
      else if (['short_answer', 'structured'].includes(rawType)) qType = 'short_answer';

      const options: string[] = [];
      if (qType === 'mcq') {
        if (optA) options.push(`A. ${optA}`);
        if (optB) options.push(`B. ${optB}`);
        if (optC) options.push(`C. ${optC}`);
        if (optD) options.push(`D. ${optD}`);
        if (optE) options.push(`E. ${optE}`);

        if (options.length < 2) {
          errors.push('MCQs require at least Option A and Option B');
        }
      } else if (qType === 'true_false') {
        options.push('A. True', 'B. False');
      }

      const marksNum = parseFloat(rawMarks);
      if (isNaN(marksNum) || marksNum <= 0) {
        errors.push('Marks must be a positive number');
      }

      if (!rawCorrect && qType !== 'essay') {
        errors.push('Correct answer is required');
      }

      let formattedCorrect = rawCorrect.trim();
      if (qType === 'mcq' && !['A', 'B', 'C', 'D', 'E'].includes(formattedCorrect.toUpperCase())) {
        const matchIdx = [optA, optB, optC, optD, optE].findIndex(
          (opt) => opt && opt.toLowerCase() === rawCorrect.toLowerCase()
        );
        if (matchIdx >= 0) {
          formattedCorrect = String.fromCharCode(65 + matchIdx);
        } else {
          errors.push(`Correct answer "${rawCorrect}" does not match A, B, C, D`);
        }
      } else if (qType === 'mcq') {
        formattedCorrect = formattedCorrect.toUpperCase();
      }

      const qItem: BankQuestion = {
        id: `qb-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        subjectId: matchedSubject?.id || selectedSubjectId,
        classLevelId,
        component: comp,
        questionType: qType,
        topic: topic || 'General',
        difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
        questionText,
        options: options.length > 0 ? options : undefined,
        correctAnswer: formattedCorrect,
        marks: isNaN(marksNum) ? 2 : marksNum,
        explanation: explanation || undefined,
        creatorId,
        creatorName,
        status: 'approved',
        createdAt: new Date().toISOString(),
      };

      parsed.push({
        rowNum: i,
        data: qItem,
        raw: {
          question: questionText,
          type: qType,
          correct: formattedCorrect,
          marks: String(marksNum),
          topic,
          comp,
        },
        isValid: errors.length === 0,
        errors,
      });
    }

    setParsedRows(parsed);
  };

  // Process Document Text from Word (.docx/.doc) or PDF (.pdf)
  const handleParseDocumentText = (text: string) => {
    setErrorMsg(null);
    setDocumentWarnings([]);

    const result = parseQuestionsFromDocumentText(text, selectedComponent);
    setDocumentWarnings(result.warnings);

    if (result.questions.length === 0) {
      setParsedRows([]);
      setErrorMsg('No structured questions detected in the uploaded file. Ensure questions are numbered (e.g. "Question 1:" or "1.") with options A-D.');
      return;
    }

    const matchedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

    const parsed: ParsedRow[] = result.questions.map((q, idx) => {
      const errors: string[] = [];
      if (!q.questionText) errors.push('Question text missing');
      if (q.questionType === 'mcq' && q.options.length < 2) errors.push('MCQs need at least 2 options');
      if (!q.correctAnswer && q.questionType !== 'essay') errors.push('Missing correct answer');

      const qItem: BankQuestion = {
        id: `qb-${Date.now()}-${idx + 1}-${Math.random().toString(36).substr(2, 4)}`,
        subjectId: matchedSubject?.id || selectedSubjectId,
        classLevelId: selectedClassLevelId,
        component: selectedComponent,
        questionType: q.questionType,
        topic: q.topic,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: q.options.length > 0 ? q.options : undefined,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        explanation: q.explanation || undefined,
        creatorId,
        creatorName,
        status: 'approved',
        createdAt: new Date().toISOString(),
      };

      return {
        rowNum: idx + 1,
        data: qItem,
        raw: {
          question: q.questionText,
          type: q.questionType,
          correct: q.correctAnswer,
          marks: String(q.marks),
          topic: q.topic,
          comp: selectedComponent,
        },
        isValid: errors.length === 0,
        errors,
      };
    });

    setParsedRows(parsed);
  };

  // Universal File Upload Handler (.docx, .doc, .pdf, .csv, .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileInputName(file.name);
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (ext === 'csv') {
        const text = await file.text();
        setRawText(text);
        handleParseCsv(text);
      } else {
        // DOCX, DOC, PDF, TXT
        const extracted = await extractTextFromFile(file);
        setRawText(extracted);
        // If it starts with CSV header, parse as CSV; otherwise parse as Question Document
        if (extracted.includes('SubjectCode') && extracted.includes('QuestionText')) {
          handleParseCsv(extracted);
        } else {
          handleParseDocumentText(extracted);
        }
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(`Failed to extract text from file: ${err.message || 'Format unsupported'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Inline Row Editor
  const handleUpdateRowField = (
    rowNum: number,
    field: keyof BankQuestion,
    val: any
  ) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.rowNum === rowNum) {
          const updatedData = { ...r.data, [field]: val };
          const errs: string[] = [];
          if (!updatedData.questionText) errs.push('Question text missing');
          if (
            updatedData.questionType === 'mcq' &&
            (!updatedData.options || updatedData.options.length < 2)
          ) {
            errs.push('MCQs require at least 2 options');
          }
          if (!updatedData.correctAnswer && updatedData.questionType !== 'essay') {
            errs.push('Missing correct answer');
          }
          return {
            ...r,
            data: updatedData,
            isValid: errs.length === 0,
            errors: errs,
          };
        }
        return r;
      })
    );
  };

  // Remove Row
  const handleRemoveRow = (rowNum: number) => {
    setParsedRows((prev) => prev.filter((r) => r.rowNum !== rowNum));
  };

  // Execute Import
  const handleImportValid = async () => {
    const validQuestions = parsedRows
      .filter((r) => r.isValid)
      .map((r) => r.data as BankQuestion);

    if (validQuestions.length === 0) {
      setErrorMsg('No valid questions to import. Please correct errors in the table.');
      return;
    }

    setIsProcessing(true);
    try {
      await onImport(validQuestions);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import questions');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const errorCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/70 border border-blue-400/40 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Bulk Question Import & Document Parser</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 font-normal">
                  Word (.docx) • PDF • CSV
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Automatically extract questions, options, answer keys, and marks into the question bank
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Assignment Selector Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class Level
              </label>
              <select
                value={selectedClassLevelId}
                onChange={(e) => setSelectedClassLevelId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                {classLevels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assessment Component
              </label>
              <select
                value={selectedComponent}
                onChange={(e) =>
                  setSelectedComponent(e.target.value as TermAssessmentComponent)
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="CA1">Continuous Assessment 1 (CA1)</option>
                <option value="CA2">Continuous Assessment 2 (CA2)</option>
                <option value="EXAM">End-of-Term Examination</option>
              </select>
            </div>
          </div>

          {/* Mode Switch & Download Templates */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveInputMode('upload')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  activeInputMode === 'upload'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                Upload Document (Word / PDF / CSV)
              </button>

              <button
                type="button"
                onClick={() => setActiveInputMode('paste')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  activeInputMode === 'paste'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                Paste Text / Content
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleDownloadSampleWordFormat}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center space-x-1"
                title="Download formatted sample question paper format"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sample Word / TXT Paper</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center space-x-1"
                title="Download structured CSV template"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sample CSV Sheet</span>
              </button>
            </div>
          </div>

          {/* Upload Mode Area */}
          {activeInputMode === 'upload' && (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100/70 transition-all cursor-pointer relative group">
              <input
                type="file"
                accept=".docx,.doc,.pdf,.csv,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 mb-1">
                {fileInputName ? `Selected File: ${fileInputName}` : 'Click to select or drag & drop examination document'}
              </h4>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                Supports Microsoft Word <strong>.docx / .doc</strong>, text-based <strong>.pdf</strong>, and <strong>.csv</strong> spreadsheets.
              </p>
              <div className="mt-2 flex items-center justify-center space-x-2 text-[10px] text-slate-400">
                <span>Identifies question boundaries</span>
                <span>•</span>
                <span>Extracts Options A-E</span>
                <span>•</span>
                <span>Matches answer keys</span>
              </div>
            </div>
          )}

          {/* Paste Mode Area */}
          {activeInputMode === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Paste Exam Document Text or CSV Content:</span>
                <span className="text-[11px] font-normal text-slate-400">
                  Detects "Question 1: ... A. ... B. ... Correct Answer: B" or CSV rows
                </span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (e.target.value.includes('QuestionText') || e.target.value.includes(',')) {
                    handleParseCsv(e.target.value);
                  } else {
                    handleParseDocumentText(e.target.value);
                  }
                }}
                rows={6}
                placeholder="Question 1: What is the capital of Nigeria?&#10;A. Lagos&#10;B. Abuja&#10;C. Kano&#10;D. Ibadan&#10;Correct Answer: B&#10;Marks: 2"
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50"
              />
            </div>
          )}

          {/* Status & Validation Notifications */}
          {isProcessing && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-blue-600" />
              <span>Analyzing document structure and extracting questions...</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {documentWarnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>Document Notice:</span>
              </div>
              {documentWarnings.map((w, idx) => (
                <p key={idx} className="text-[11px] text-amber-800">
                  • {w}
                </p>
              ))}
            </div>
          )}

          {/* Parsed Questions Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-slate-800">
                    Extracted Questions Preview ({parsedRows.length})
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {validCount} Ready
                  </span>
                  {errorCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                      {errorCount} Need Review
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Review and edit text, options, answers or marks inline before confirming
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">#</th>
                      <th className="py-2 px-3 w-28">Type & Component</th>
                      <th className="py-2 px-3">Question Text & Options</th>
                      <th className="py-2 px-3 w-24">Correct Ans</th>
                      <th className="py-2 px-3 w-16">Marks</th>
                      <th className="py-2 px-3 w-28">Topic</th>
                      <th className="py-2 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {parsedRows.map((r) => {
                      const isRowValid = r.isValid;
                      return (
                        <tr
                          key={r.rowNum}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !isRowValid ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                            {r.rowNum}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 uppercase mr-1">
                              {r.data.component || selectedComponent}
                            </span>
                            <span className="inline-block text-[10px] text-slate-600 capitalize">
                              {r.data.questionType || 'mcq'}
                            </span>
                            {!isRowValid && (
                              <p className="text-[10px] text-rose-600 font-medium mt-1">
                                {r.errors.join(', ')}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={r.data.questionText || ''}
                              onChange={(e) =>
                                handleUpdateRowField(
                                  r.rowNum,
                                  'questionText',
                                  e.target.value
                                )
                              }
                              className="w-full text-xs font-medium border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                            />
                            {r.data.options && r.data.options.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-500">
                                {r.data.options.map((opt, oIdx) => (
                                  <span
                                    key={oIdx}
                                    className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200"
                                  >
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={r.data.correctAnswer || ''}
                              onChange={(e) =>
                                handleUpdateRowField(
                                  r.rowNum,
                                  'correctAnswer',
                                  e.target.value.toUpperCase()
                                )
                              }
                              placeholder="e.g. B"
                              className="w-full text-xs font-bold text-center border border-slate-200 rounded px-1.5 py-1 uppercase text-blue-700 font-mono"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={r.data.marks || 2}
                              onChange={(e) =>
                                handleUpdateRowField(
                                  r.rowNum,
                                  'marks',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full text-xs text-center border border-slate-200 rounded px-1 py-1 font-mono"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={r.data.topic || 'General'}
                              onChange={(e) =>
                                handleUpdateRowField(
                                  r.rowNum,
                                  'topic',
                                  e.target.value
                                )
                              }
                              className="w-full text-xs border border-slate-200 rounded px-1.5 py-1"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(r.rowNum)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            {parsedRows.length > 0 ? (
              <span>
                Ready to import: <strong>{validCount} questions</strong> (Total{' '}
                {parsedRows.reduce((acc, cur) => acc + (cur.data.marks || 2), 0)} marks)
              </span>
            ) : (
              <span>Upload a Word (.docx), PDF, or CSV file to begin extraction</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleImportValid}
              disabled={validCount === 0 || isProcessing}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 shadow-xs transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : importSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Imported Successfully!</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Import {validCount} Valid Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
