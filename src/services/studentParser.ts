import mammoth from 'mammoth';
import { Student } from '../types';

export interface ExtractedStudentDraft {
  id: string;
  admissionNumber: string;
  fullName: string;
  firstName?: string;
  surname?: string;
  middleName?: string;
  gender: 'Male' | 'Female';
  dob: string;
  classLevelId: string;
  classArmName: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  status: 'active' | 'graduated' | 'transferred' | 'suspended';
  isDuplicate?: boolean;
  hasErrors: boolean;
  validationIssues: string[];
}

export interface StudentParseResult {
  success: boolean;
  students: ExtractedStudentDraft[];
  headersFound: string[];
  totalParsed: number;
  duplicateCount: number;
  errorCount: number;
}

/**
 * Extracts student records from Word (.docx), PDF text, or CSV
 */
export async function extractStudentsFromFile(
  file: File,
  existingStudents: Student[],
  defaultArmName = 'JSS 1 Gold',
  defaultClassId = 'jss-1'
): Promise<StudentParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let rawText = '';

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    rawText = result.value;
  } else if (extension === 'pdf') {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textDecoder = new TextDecoder('latin1');
    const fullContent = textDecoder.decode(bytes);
    rawText = fullContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  } else {
    rawText = await file.text();
  }

  return parseStudentsFromRawText(rawText, existingStudents, defaultArmName, defaultClassId);
}

export function parseStudentsFromRawText(
  rawText: string,
  existingStudents: Student[],
  defaultArmName = 'JSS 1 Gold',
  defaultClassId = 'jss-1'
): StudentParseResult {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { success: false, students: [], headersFound: [], totalParsed: 0, duplicateCount: 0, errorCount: 0 };
  }

  // Detect delimiter: comma, tab, or semicolon
  const headerLine = lines[0];
  const delimiter = headerLine.includes('\t') ? '\t' : headerLine.includes(';') ? ';' : ',';

  const rawHeaders = headerLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const normalizedHeaders = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Header indices
  const admIdx = normalizedHeaders.findIndex((h) => h.includes('adm') || h.includes('reg') || h.includes('id'));
  const nameIdx = normalizedHeaders.findIndex((h) => h === 'fullname' || h === 'name' || h.includes('student'));
  const fnIdx = normalizedHeaders.findIndex((h) => h.includes('first'));
  const snIdx = normalizedHeaders.findIndex((h) => h.includes('sur') || h.includes('last'));
  const mnIdx = normalizedHeaders.findIndex((h) => h.includes('middle'));
  const genIdx = normalizedHeaders.findIndex((h) => h.includes('gender') || h.includes('sex'));
  const dobIdx = normalizedHeaders.findIndex((h) => h.includes('dob') || h.includes('birth'));
  const armIdx = normalizedHeaders.findIndex((h) => h.includes('arm') || h.includes('class'));
  const pNameIdx = normalizedHeaders.findIndex((h) => h.includes('parent') || h.includes('guardian'));
  const pPhoneIdx = normalizedHeaders.findIndex((h) => h.includes('phone') || h.includes('tel') || h.includes('mobile'));
  const pEmailIdx = normalizedHeaders.findIndex((h) => h.includes('email') || h.includes('mail'));
  const addrIdx = normalizedHeaders.findIndex((h) => h.includes('addr') || h.includes('residence'));

  const existingAdmSet = new Set(existingStudents.map((s) => s.admissionNumber.toUpperCase().trim()));
  const students: ExtractedStudentDraft[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));

    let adm = admIdx !== -1 && cols[admIdx] ? cols[admIdx].toUpperCase() : '';
    let fn = fnIdx !== -1 && cols[fnIdx] ? cols[fnIdx] : '';
    let sn = snIdx !== -1 && cols[snIdx] ? cols[snIdx] : '';
    let mn = mnIdx !== -1 && cols[mnIdx] ? cols[mnIdx] : '';
    let fullName = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : '';

    if (!fullName && (fn || sn)) {
      fullName = `${sn} ${fn} ${mn}`.trim();
    }

    if (!fullName && cols.length >= 2 && !adm) {
      // Auto-assign if 2nd col looks like a name
      fullName = cols[1];
      adm = cols[0];
    }

    if (!adm) {
      adm = `UDGS/2025/J${Math.floor(100 + Math.random() * 900)}`;
    }

    if (!fullName) continue;

    let gender: 'Male' | 'Female' = 'Male';
    if (genIdx !== -1 && cols[genIdx]) {
      const g = cols[genIdx].toLowerCase();
      if (g.startsWith('f')) gender = 'Female';
    }

    const dob = dobIdx !== -1 && cols[dobIdx] ? cols[dobIdx] : '2013-05-15';
    const arm = armIdx !== -1 && cols[armIdx] ? cols[armIdx] : defaultArmName;
    const parentName = pNameIdx !== -1 && cols[pNameIdx] ? cols[pNameIdx] : 'Mr. & Mrs. ' + (sn || fullName.split(' ')[0]);
    const parentPhone = pPhoneIdx !== -1 && cols[pPhoneIdx] ? cols[pPhoneIdx] : '+234 800 000 0000';
    const parentEmail = pEmailIdx !== -1 && cols[pEmailIdx] ? cols[pEmailIdx] : undefined;
    const address = addrIdx !== -1 && cols[addrIdx] ? cols[addrIdx] : 'Ibadan, Oyo State, Nigeria';

    const issues: string[] = [];
    const isDuplicate = existingAdmSet.has(adm);
    if (isDuplicate) {
      issues.push(`Admission number ${adm} already exists in database`);
    }

    if (!fullName || fullName.length < 3) {
      issues.push('Student full name missing or invalid');
    }

    students.push({
      id: `ext-std-${Date.now()}-${i}`,
      admissionNumber: adm,
      fullName,
      firstName: fn,
      surname: sn,
      middleName: mn,
      gender,
      dob,
      classLevelId: defaultClassId,
      classArmName: arm,
      parentName,
      parentPhone,
      parentEmail,
      address,
      status: 'active',
      isDuplicate,
      hasErrors: issues.length > 0,
      validationIssues: issues,
    });
  }

  const duplicateCount = students.filter((s) => s.isDuplicate).length;
  const errorCount = students.filter((s) => s.hasErrors).length;

  return {
    success: students.length > 0,
    students,
    headersFound: rawHeaders,
    totalParsed: students.length,
    duplicateCount,
    errorCount,
  };
}
