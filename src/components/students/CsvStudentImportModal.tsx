import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  FileText,
  Trash2,
  RefreshCw,
  Sliders,
  Users,
  Check,
} from 'lucide-react';
import { Student, ClassArm, Subject } from '../../types';
import {
  extractTextFromFile,
  parseStudentsFromDocumentText,
  ExtractedStudentRow,
} from '../../services/documentParser';

interface CsvStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (students: Student[]) => Promise<void>;
  classArms: ClassArm[];
  subjects: Subject[];
  currentSession: string;
}

export const CsvStudentImportModal: React.FC<CsvStudentImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  classArms,
  subjects,
  currentSession,
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste'>('upload');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [targetArmId, setTargetArmId] = useState<string>(classArms[0]?.id || '');

  // Editable preview rows
  const [extractedRows, setExtractedRows] = useState<
    Array<ExtractedStudentRow & { id: string }>
  >([]);

  if (!isOpen) return null;

  const sampleCsv = `AdmissionNumber,FullName,Gender,DOB,ArmName,ParentName,ParentPhone,ParentEmail,Address
SAMS/2025/J101,Tariq Al-Mansoor,Male,2013-04-12,JSS 1 Gold,Mansoor Al-Mansoor,+234 803 111 2233,mansoor@gmail.com,15 Marina Street Lagos
SAMS/2025/J102,Chioma Blessing Okonkwo,Female,2013-09-20,JSS 1 Gold,Chief Paul Okonkwo,+234 802 444 5566,paul.okonkwo@yahoo.com,22 Awolowo Road Ikoyi
SAMS/2025/J103,Damilola Joshua Balogun,Male,2013-01-18,JSS 1 Diamond,Mr. Samuel Balogun,+234 807 888 9900,balogun.s@hotmail.com,5 Allen Avenue Ikeja`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sams_student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadWordTemplate = () => {
    const textTemplate = `KINGS MODEL SECONDARY SCHOOL
STUDENT ADMISSION ENROLLMENT ROSTER
SESSION: 2025/2026

Admission No\tFull Name\tGender\tDOB\tClass Arm\tParent Name\tParent Phone\tAddress
SAMS/2025/J104\tEmeka Chukwudi Obi\tMale\t2013-06-15\tJSS 1 Gold\tDr. Obi Chukwudi\t+234 803 555 1234\t10 Admiralty Way Lekki
SAMS/2025/J105\tFatima Aisha Bello\tFemale\t2013-11-22\tJSS 1 Gold\tAlhaji Bello Umar\t+234 802 666 7890\t14 Victoria Island Lagos
SAMS/2025/J106\tOluwaseun David Adeleke\tMale\t2013-03-30\tJSS 1 Diamond\tChief Adeleke David\t+234 809 777 4321\t8 Broad Street Lagos
`;
    const blob = new Blob([textTemplate], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sams_student_roster_template.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Process text parsed from File or Textarea
  const processDocumentText = (text: string) => {
    setErrorMsg(null);
    const result = parseStudentsFromDocumentText(text, classArms);
    if (result.students.length === 0) {
      setErrorMsg('No student records found in file. Ensure headers (Admission, Name, Gender, Class Arm) or tabular rows are present.');
      setExtractedRows([]);
      return;
    }

    const rowsWithId = result.students.map((s, idx) => ({
      ...s,
      id: `std-import-${Date.now()}-${idx + 1}`,
    }));
    setExtractedRows(rowsWithId);
  };

  // Universal File Upload (.docx, .doc, .pdf, .csv, .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let text = '';
      if (ext === 'csv' || ext === 'txt') {
        text = await file.text();
      } else {
        // DOCX, DOC, PDF
        text = await extractTextFromFile(file);
      }
      setRawText(text);
      processDocumentText(text);
    } catch (err: any) {
      console.error('Student import file error:', err);
      setErrorMsg(`Failed to extract students from file: ${err.message || 'Format unsupported'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Inline Row Field Editor
  const handleUpdateStudentField = (
    id: string,
    field: keyof ExtractedStudentRow,
    value: any
  ) => {
    setExtractedRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          // re-evaluate flags
          const flagReasons: string[] = [];
          if (!updated.fullName || updated.fullName.length < 3) {
            flagReasons.push('Student name is required');
          }
          if (!updated.admissionNumber) {
            flagReasons.push('Admission number is required');
          }
          return {
            ...updated,
            isFlagged: flagReasons.length > 0,
            flagReason: flagReasons.join('; '),
          };
        }
        return row;
      })
    );
  };

  // Delete single row from preview
  const handleRemoveRow = (id: string) => {
    setExtractedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Perform Final Bulk Import to Firestore / Database
  const handleConfirmImport = async () => {
    if (extractedRows.length === 0) {
      setErrorMsg('No students available for import.');
      return;
    }

    const validRows = extractedRows.filter((r) => r.fullName && r.admissionNumber);
    if (validRows.length === 0) {
      setErrorMsg('All rows contain errors. Please provide valid names and admission numbers.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const allSubjectIds = subjects.map((s) => s.id);

      const studentsToImport: Student[] = validRows.map((r, i) => {
        // Find matching arm or fallback
        const matchedArm =
          classArms.find(
            (a) =>
              a.name.toLowerCase().includes(r.armName.toLowerCase()) ||
              a.id.toLowerCase() === r.armName.toLowerCase()
          ) ||
          classArms.find((a) => a.id === targetArmId) ||
          classArms[0];

        // Break name into First and Surname if possible
        const nameParts = r.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || 'Student';
        const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

        return {
          id: `std-bulk-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          admissionNumber: r.admissionNumber.toUpperCase().trim(),
          fullName: r.fullName.trim(),
          firstName,
          surname,
          middleName,
          gender: r.gender === 'Female' ? 'Female' : 'Male',
          dob: r.dob || '2013-01-01',
          currentClassId: matchedArm?.classLevelId || 'jss-1',
          currentArmId: matchedArm?.id || targetArmId || classArms[0]?.id || '',
          currentSession,
          parentName: r.parentName || 'Parent / Guardian',
          parentPhone: r.parentPhone || '+234 800 000 0000',
          parentEmail: r.parentEmail || '',
          address: r.address || 'Lagos, Nigeria',
          admissionDate: new Date().toISOString().split('T')[0],
          status: 'active',
          assignedSubjectIds: allSubjectIds,
          createdAt: new Date().toISOString(),
        };
      });

      await onImport(studentsToImport);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMsg(err.message || 'Failed to import student roster.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = extractedRows.filter((r) => !r.isFlagged).length;
  const flaggedCount = extractedRows.filter((r) => r.isFlagged).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/70 border border-blue-400/40 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Student Roster Bulk Importer</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 font-normal">
                  Word (.docx) • PDF • CSV
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Extract student admission numbers, names, gender, class arms, and parent details
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

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Controls Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Target Class Arm (Fallback)
                </label>
                <select
                  value={targetArmId}
                  onChange={(e) => setTargetArmId(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  {classArms.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Template Download Buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center space-x-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadWordTemplate}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sample Word / TXT</span>
              </button>
            </div>
          </div>

          {/* Mode Switch: Upload vs Paste */}
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

          {/* Upload Area */}
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
                {uploadedFileName
                  ? `Selected File: ${uploadedFileName}`
                  : 'Click or drop Word (.docx), PDF (.pdf), or CSV student roster here'}
              </h4>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                Automatic table and column recognition for Admission Numbers, Full Names, Gender, Class Arm, Parent details, and Addresses.
              </p>
            </div>
          )}

          {/* Paste Area */}
          {activeInputMode === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Paste Student Data (CSV, Tabular, or Line-by-Line):</span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  processDocumentText(e.target.value);
                }}
                rows={6}
                placeholder={`AdmissionNumber,FullName,Gender,DOB,ArmName,ParentName,ParentPhone\nSAMS/2025/J101,Tariq Al-Mansoor,Male,2013-04-12,JSS 1 Gold,Mansoor Al-Mansoor,+234 803 111 2233`}
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50"
              />
            </div>
          )}

          {/* Notifications */}
          {isProcessing && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-blue-600" />
              <span>Extracting and mapping student records from document...</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Editable Preview Table */}
          {extractedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-slate-800">
                    Extracted Students Preview ({extractedRows.length})
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {validCount} Ready
                  </span>
                  {flaggedCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      {flaggedCount} Notice/Flagged
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Modify fields inline before confirming import to school database
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3 w-32">Admission No</th>
                      <th className="py-2 px-3">Full Name</th>
                      <th className="py-2 px-3 w-20">Gender</th>
                      <th className="py-2 px-3 w-28">Class Arm</th>
                      <th className="py-2 px-3 w-32">Parent / Guardian</th>
                      <th className="py-2 px-3 w-28">Parent Phone</th>
                      <th className="py-2 px-3 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {extractedRows.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          r.isFlagged ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.admissionNumber}
                            onChange={(e) =>
                              handleUpdateStudentField(
                                r.id,
                                'admissionNumber',
                                e.target.value
                              )
                            }
                            className="w-full font-mono text-[11px] font-bold border border-slate-200 rounded px-1.5 py-0.5 uppercase"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.fullName}
                            onChange={(e) =>
                              handleUpdateStudentField(r.id, 'fullName', e.target.value)
                            }
                            className="w-full font-medium border border-slate-200 rounded px-1.5 py-0.5"
                          />
                          {r.isFlagged && r.flagReason && (
                            <p className="text-[10px] text-amber-700 mt-0.5">
                              {r.flagReason}
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={r.gender}
                            onChange={(e) =>
                              handleUpdateStudentField(r.id, 'gender', e.target.value)
                            }
                            className="w-full border border-slate-200 rounded px-1 py-0.5 text-[11px]"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={r.armName}
                            onChange={(e) =>
                              handleUpdateStudentField(r.id, 'armName', e.target.value)
                            }
                            className="w-full border border-slate-200 rounded px-1 py-0.5 text-[11px]"
                          >
                            {classArms.map((a) => (
                              <option key={a.id} value={a.name}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.parentName}
                            onChange={(e) =>
                              handleUpdateStudentField(
                                r.id,
                                'parentName',
                                e.target.value
                              )
                            }
                            className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-[11px]"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.parentPhone}
                            onChange={(e) =>
                              handleUpdateStudentField(
                                r.id,
                                'parentPhone',
                                e.target.value
                              )
                            }
                            className="w-full font-mono border border-slate-200 rounded px-1.5 py-0.5 text-[11px]"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            {extractedRows.length > 0 ? (
              <span>
                Found <strong>{extractedRows.length} students</strong> ({validCount} ready for enrolment)
              </span>
            ) : (
              <span>Upload Word, PDF, or CSV to parse student records</span>
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
              onClick={handleConfirmImport}
              disabled={extractedRows.length === 0 || isProcessing}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 shadow-xs transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enrolling Students...</span>
                </>
              ) : importSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Imported Successfully!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Enrol {extractedRows.length} Students</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
