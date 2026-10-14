import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import {
  BankQuestion,
  QuestionType,
  QuestionDifficulty,
  TermAssessmentComponent,
  Student,
  ClassArm,
  Subject,
} from '../types';

// Set up PDF.js worker fallback for browser Vite environment
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

/**
 * Extract plain text from DOCX, PDF, CSV, or TXT File
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'docx' || extension === 'doc') {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value;
      }
    } catch (docxErr) {
      console.warn('Mammoth docx extraction note:', docxErr);
    }
    // Fallback: try reading as text
    return await file.text();
  }

  if (extension === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });
      const pdfDoc = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageItems = textContent.items as Array<{ str?: string }>;
        const pageString = pageItems
          .map((item) => item.str || '')
          .join(' ');
        fullText += `\n--- Page ${i} ---\n` + pageString;
      }
      return fullText;
    } catch (pdfErr) {
      console.warn('PDF parsing error, trying text fallback:', pdfErr);
      return await file.text();
    }
  }

  // Default text-based (CSV, TXT, etc.)
  return await file.text();
}

export interface ExtractedQuestionResult {
  questions: Array<{
    questionText: string;
    questionType: QuestionType;
    options: string[];
    correctAnswer: string;
    marks: number;
    topic: string;
    difficulty: QuestionDifficulty;
    explanation?: string;
    isFlagged: boolean;
    flagReason?: string;
  }>;
  totalFound: number;
  unmatchedAnswersCount: number;
  warnings: string[];
}

/**
 * Intelligent Document Parser for Word & PDF Questions
 * Identifies question boundaries, numbers, options (A-E), correct answers, marks, topics, and question types.
 * Supports inline correct answers as well as trailing "Answer Key" sections!
 */
export function parseQuestionsFromDocumentText(
  text: string,
  defaultComponent: TermAssessmentComponent = 'CA1'
): ExtractedQuestionResult {
  const warnings: string[] = [];
  const rawLines = text.split(/\r\n|\n|\r/);
  const cleanLines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

  // Check for separate Answer Key section at the bottom (e.g. "Answer Key", "Answers:", "Marking Guide")
  const answerKeyMap: Map<number, string> = new Map();
  let answerKeyStartIndex = -1;

  for (let i = 0; i < cleanLines.length; i++) {
    const l = cleanLines[i].toLowerCase();
    if (
      l.startsWith('answer key') ||
      l.startsWith('marking scheme') ||
      l.startsWith('answers:') ||
      l.startsWith('solutions:')
    ) {
      answerKeyStartIndex = i;
      break;
    }
  }

  if (answerKeyStartIndex !== -1) {
    const keyLines = cleanLines.slice(answerKeyStartIndex + 1);
    for (const kl of keyLines) {
      // Matches formats like "1. B", "1: B", "1 - C", "Q1: B", "1. (A)"
      const match = kl.match(/(?:q(?:uestion)?\s*)?(\d+)[\.\:\-\s]+(?:\()?([a-eA-E]|true|false|[\w\s]{1,40})(?:\))?/i);
      if (match) {
        const qNum = parseInt(match[1], 10);
        const ans = match[2].trim().toUpperCase();
        answerKeyMap.set(qNum, ans);
      }
    }
  }

  const linesToParse = answerKeyStartIndex !== -1 ? cleanLines.slice(0, answerKeyStartIndex) : cleanLines;

  // Split into question blocks using regex patterns
  // Pattern matches: "Question 1:", "Q1.", "1.", "1)", "Question 1."
  const questionBlocks: Array<{ headerNumber: number; lines: string[] }> = [];
  let currentBlock: { headerNumber: number; lines: string[] } | null = null;
  let runningIndex = 1;

  for (const line of linesToParse) {
    const qMatch = line.match(/^(?:question\s*(\d+)[\:\.]*|q(\d+)[\:\.]*|(\d+)[\.\)](?!\d))\s*(.*)/i);
    if (qMatch) {
      if (currentBlock && currentBlock.lines.length > 0) {
        questionBlocks.push(currentBlock);
      }
      const qNum = parseInt(qMatch[1] || qMatch[2] || qMatch[3], 10) || runningIndex++;
      const remainder = (qMatch[4] || '').trim();
      currentBlock = {
        headerNumber: qNum,
        lines: remainder ? [remainder] : [],
      };
    } else {
      if (currentBlock) {
        currentBlock.lines.push(line);
      } else {
        // Line before any question header, if it looks like a question, start block
        if (line.endsWith('?') || line.includes('Which of') || line.includes('What is') || line.includes('Define')) {
          currentBlock = { headerNumber: runningIndex++, lines: [line] };
        }
      }
    }
  }

  if (currentBlock && currentBlock.lines.length > 0) {
    questionBlocks.push(currentBlock);
  }

  const extractedList: ExtractedQuestionResult['questions'] = [];
  let unmatchedAnswers = 0;

  for (const block of questionBlocks) {
    let questionText = '';
    const options: string[] = [];
    let correctAnswer = '';
    let marks = 2;
    let topic = 'General';
    let qType: QuestionType = 'mcq';
    let difficulty: QuestionDifficulty = 'medium';
    let explanation = '';
    let isFlagged = false;
    let flagReasons: string[] = [];

    // Check if separate answer key has this question's answer
    if (answerKeyMap.has(block.headerNumber)) {
      correctAnswer = answerKeyMap.get(block.headerNumber) || '';
    }

    const textLines: string[] = [];

    for (const line of block.lines) {
      // Check for Correct Answer line
      const ansMatch = line.match(/^(?:correct\s*answer|answer|ans)[\:\.]*\s*([a-eA-E]|true|false|.+)/i);
      if (ansMatch) {
        correctAnswer = ansMatch[1].trim().toUpperCase();
        continue;
      }

      // Check for Marks line (e.g. "Marks: 2", "Mark: 5m", "[3 Marks]", "(2 marks)")
      const markMatch = line.match(/(?:marks?|points?|pts?)[\:\s]*(\d+)/i) || line.match(/\[(\d+)\s*marks?\]/i) || line.match(/\((\d+)\s*marks?\)/i);
      if (markMatch) {
        marks = parseInt(markMatch[1], 10) || 2;
        continue;
      }

      // Check for Topic line
      const topicMatch = line.match(/^topic[\:\.]*\s*(.+)/i);
      if (topicMatch) {
        topic = topicMatch[1].trim();
        continue;
      }

      // Check for Question Type line
      const typeMatch = line.match(/^(?:question\s*type|type)[\:\.]*\s*(.+)/i);
      if (typeMatch) {
        const t = typeMatch[1].toLowerCase();
        if (t.includes('multiple') || t.includes('mcq')) qType = 'mcq';
        else if (t.includes('true') || t.includes('false')) qType = 'true_false';
        else if (t.includes('gap') || t.includes('fill')) qType = 'fill_in_the_gap';
        else if (t.includes('essay') || t.includes('theory')) qType = 'essay';
        else if (t.includes('short') || t.includes('structured')) qType = 'short_answer';
        continue;
      }

      // Check for Explanation or Marking Guide line
      const expMatch = line.match(/^(?:explanation|marking\s*guide|guide)[\:\.]*\s*(.+)/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        continue;
      }

      // Check for Option format: "A. ...", "A) ...", "[A] ...", "a. ..."
      const optMatch = line.match(/^([a-eA-E])[\.\)\]]\s*(.+)/);
      if (optMatch) {
        const letter = optMatch[1].toUpperCase();
        const content = optMatch[2].trim();
        options.push(`${letter}. ${content}`);
        continue;
      }

      // Check for True / False options
      if (line.match(/^(true|false)$/i)) {
        options.push(line.trim());
        qType = 'true_false';
        continue;
      }

      // Otherwise, part of question text
      textLines.push(line);
    }

    questionText = textLines.join(' ').trim();

    // Determine type automatically if options exist
    if (options.length >= 2 && qType !== 'true_false') {
      qType = 'mcq';
    } else if (options.length === 0 && qType === 'mcq') {
      if (questionText.toLowerCase().includes('write an essay') || marks >= 5) {
        qType = 'essay';
      } else if (questionText.includes('_____') || questionText.includes('fill in')) {
        qType = 'fill_in_the_gap';
      } else {
        qType = 'short_answer';
      }
    }

    // Flagging logic
    if (!questionText) {
      isFlagged = true;
      flagReasons.push('Question text is empty');
    }

    if (qType === 'mcq') {
      if (options.length < 2) {
        isFlagged = true;
        flagReasons.push('MCQ has fewer than 2 detected options');
      }
      if (!correctAnswer) {
        isFlagged = true;
        flagReasons.push('Missing correct answer (no option marked)');
        unmatchedAnswers++;
      } else {
        // Clean single letter answer (e.g., if user wrote "Option B" -> "B")
        const singleLetter = correctAnswer.match(/([A-E])/i);
        if (singleLetter) {
          correctAnswer = singleLetter[1].toUpperCase();
        }
      }
    }

    extractedList.push({
      questionText,
      questionType: qType,
      options,
      correctAnswer: correctAnswer || (qType === 'essay' ? 'Marking Guide' : 'A'),
      marks: isNaN(marks) || marks <= 0 ? 2 : marks,
      topic: topic || 'General',
      difficulty,
      explanation,
      isFlagged,
      flagReason: flagReasons.join('; '),
    });
  }

  if (extractedList.length === 0) {
    warnings.push('Could not detect distinct question numbers or boundaries in document text.');
  }

  return {
    questions: extractedList,
    totalFound: extractedList.length,
    unmatchedAnswersCount: unmatchedAnswers,
    warnings,
  };
}

export interface ExtractedStudentRow {
  admissionNumber: string;
  fullName: string;
  gender: 'Male' | 'Female';
  dob: string;
  classLevelId: string;
  armName: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  isFlagged: boolean;
  flagReason?: string;
}

/**
 * Intelligent Document Parser for Student Bulk Import from Word, PDF, or CSV
 * Supports tab-delimited, comma-delimited, and line-by-line tables.
 */
export function parseStudentsFromDocumentText(
  text: string,
  classArms: ClassArm[]
): {
  students: ExtractedStudentRow[];
  totalFound: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  const lines = text.split(/\r\n|\n|\r/).map((l) => l.trim()).filter((l) => l.length > 0);
  const result: ExtractedStudentRow[] = [];

  let isHeaderPassed = false;
  let headerIndexMap: { [key: string]: number } = {};

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Check if line looks like a table header
    const lower = line.toLowerCase();
    if (
      (lower.includes('name') && lower.includes('admission')) ||
      (lower.includes('gender') && lower.includes('arm')) ||
      (lower.includes('student') && lower.includes('class'))
    ) {
      // Determine delimiter (comma, tab, or multiple spaces)
      let cols: string[] = [];
      if (line.includes(',')) {
        cols = line.split(',').map((c) => c.trim().toLowerCase());
      } else if (line.includes('\t')) {
        cols = line.split('\t').map((c) => c.trim().toLowerCase());
      } else {
        cols = line.split(/\s{2,}/).map((c) => c.trim().toLowerCase());
      }

      headerIndexMap = {
        adm: cols.findIndex((c) => c.includes('adm') || c.includes('reg') || c.includes('id')),
        name: cols.findIndex((c) => c.includes('name') && !c.includes('parent')),
        gender: cols.findIndex((c) => c.includes('gender') || c.includes('sex')),
        dob: cols.findIndex((c) => c.includes('dob') || c.includes('birth')),
        arm: cols.findIndex((c) => c.includes('arm') || c.includes('class')),
        parentName: cols.findIndex((c) => c.includes('parent') || c.includes('guardian')),
        parentPhone: cols.findIndex((c) => c.includes('phone') || c.includes('mobile')),
        parentEmail: cols.findIndex((c) => c.includes('email')),
        address: cols.findIndex((c) => c.includes('address')),
      };
      isHeaderPassed = true;
      continue;
    }

    // Try parsing row
    let cols: string[] = [];
    if (line.includes(',')) {
      cols = line.split(',').map((c) => c.trim());
    } else if (line.includes('\t')) {
      cols = line.split('\t').map((c) => c.trim());
    } else {
      cols = line.split(/\s{2,}/).map((c) => c.trim());
    }

    if (cols.length < 2) continue;

    let adm = '';
    let name = '';
    let gender: 'Male' | 'Female' = 'Male';
    let dob = '2013-05-10';
    let armName = '';
    let parentName = '';
    let parentPhone = '';
    let parentEmail = '';
    let address = 'Lagos, Nigeria';
    let isFlagged = false;
    const flagReasons: string[] = [];

    if (isHeaderPassed && Object.keys(headerIndexMap).length > 0) {
      if (headerIndexMap.adm >= 0) adm = cols[headerIndexMap.adm] || '';
      if (headerIndexMap.name >= 0) name = cols[headerIndexMap.name] || '';
      if (headerIndexMap.gender >= 0) {
        const g = (cols[headerIndexMap.gender] || '').toLowerCase();
        gender = g.startsWith('f') ? 'Female' : 'Male';
      }
      if (headerIndexMap.dob >= 0) dob = cols[headerIndexMap.dob] || dob;
      if (headerIndexMap.arm >= 0) armName = cols[headerIndexMap.arm] || '';
      if (headerIndexMap.parentName >= 0) parentName = cols[headerIndexMap.parentName] || '';
      if (headerIndexMap.parentPhone >= 0) parentPhone = cols[headerIndexMap.parentPhone] || '';
      if (headerIndexMap.parentEmail >= 0) parentEmail = cols[headerIndexMap.parentEmail] || '';
      if (headerIndexMap.address >= 0) address = cols[headerIndexMap.address] || address;
    } else {
      // Positional heuristic: Col 0: Adm, Col 1: Name, Col 2: Gender, Col 3: Arm/DOB
      adm = cols[0];
      name = cols[1];
      if (cols[2]) {
        gender = cols[2].toLowerCase().startsWith('f') ? 'Female' : 'Male';
      }
      if (cols[3]) {
        if (cols[3].includes('-') || cols[3].includes('/')) {
          dob = cols[3];
        } else {
          armName = cols[3];
        }
      }
      if (cols[4]) armName = armName || cols[4];
      if (cols[5]) parentName = cols[5];
      if (cols[6]) parentPhone = cols[6];
    }

    // Fallback generate admission number if missing
    if (!adm || !adm.includes('/')) {
      adm = `SAMS/${new Date().getFullYear()}/J${100 + idx}`;
      flagReasons.push('Generated automatic admission number');
    }

    if (!name || name.length < 3) {
      isFlagged = true;
      flagReasons.push('Student name is missing or invalid');
    }

    // Match arm
    let matchedArm = classArms.find(
      (a) => a.name.toLowerCase().includes(armName.toLowerCase()) || a.id.toLowerCase() === armName.toLowerCase()
    );
    if (!matchedArm && classArms.length > 0) {
      matchedArm = classArms[0];
      flagReasons.push(`Defaulted to class arm ${matchedArm.name}`);
    }

    result.push({
      admissionNumber: adm.toUpperCase().replace(/\s+/g, ''),
      fullName: name,
      gender,
      dob,
      classLevelId: matchedArm?.classLevelId || 'jss-1',
      armName: matchedArm?.name || 'JSS 1 Gold',
      parentName: parentName || 'Guardian',
      parentPhone: parentPhone || '+234 800 000 0000',
      parentEmail,
      address,
      isFlagged,
      flagReason: flagReasons.join('; '),
    });
  }

  if (result.length === 0) {
    warnings.push('No student records could be identified from the document text.');
  }

  return {
    students: result,
    totalFound: result.length,
    warnings,
  };
}
