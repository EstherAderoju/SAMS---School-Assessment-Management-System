import mammoth from 'mammoth';
import { BankQuestion, QuestionType, QuestionDifficulty, TermAssessmentComponent } from '../types';

export interface ExtractedQuestionDraft {
  id: string;
  questionNumber?: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  markingGuide?: string;
  marks: number;
  topic: string;
  subtopic?: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  component: TermAssessmentComponent;
  hasErrors: boolean;
  validationIssues: string[];
}

export interface ParseResult {
  success: boolean;
  questions: ExtractedQuestionDraft[];
  rawText: string;
  totalParsed: number;
  validCount: number;
  errorCount: number;
  warnings: string[];
}

/**
 * Extracts plain text from various file formats (.docx, .pdf, .csv, .txt)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (extension === 'txt' || extension === 'csv') {
    return await file.text();
  }

  if (extension === 'pdf') {
    // Client-side text extraction from PDF stream
    const buffer = await file.arrayBuffer();
    return extractTextFromPdfBuffer(buffer);
  }

  // Fallback for doc or other text-like files
  try {
    return await file.text();
  } catch {
    throw new Error(`Unsupported document format: .${extension}. Please upload a .docx, .pdf, or .csv file.`);
  }
}

/**
 * Basic client-side text extractor for text-based PDF documents
 */
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const textDecoder = new TextDecoder('latin1');
  const fullContent = textDecoder.decode(bytes);

  // Search for text operators in PDF content streams (BT ... ET blocks and Tj/TJ strings)
  const textChunks: string[] = [];
  const textPattern = /\((.*?)\)\s*Tj|\[(.*?)\]\s*TJ/g;
  let match;

  while ((match = textPattern.exec(fullContent)) !== null) {
    if (match[1]) {
      textChunks.push(cleanPdfString(match[1]));
    } else if (match[2]) {
      // Array of strings in TJ operator
      const subMatches = match[2].match(/\((.*?)\)/g);
      if (subMatches) {
        const line = subMatches.map((s) => cleanPdfString(s.slice(1, -1))).join('');
        textChunks.push(line);
      }
    }
  }

  if (textChunks.length > 0) {
    return textChunks.join('\n');
  }

  // Fallback string scanner if streams are uncompressed
  const readable = fullContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  const questionMatches = readable.match(/(Question\s*\d+[\s\S]*?)(?=(Question\s*\d+|$))/gi);
  if (questionMatches && questionMatches.length > 0) {
    return questionMatches.join('\n\n');
  }

  return readable;
}

function cleanPdfString(str: string): string {
  return str.replace(/\\([()\\])/g, '$1').replace(/\\r|\\n/g, '\n');
}

/**
 * Parses raw text into structured question drafts with validation
 */
export function parseQuestionsFromText(
  rawText: string,
  defaultComponent: TermAssessmentComponent = 'CA1',
  defaultTopic = 'General'
): ParseResult {
  const questions: ExtractedQuestionDraft[] = [];
  const warnings: string[] = [];

  // Check if text is structured CSV
  if (rawText.includes(',') && (rawText.toLowerCase().includes('question') || rawText.toLowerCase().includes('option a'))) {
    const csvParsed = parseQuestionsFromCsv(rawText, defaultComponent, defaultTopic);
    if (csvParsed.questions.length > 0) {
      return csvParsed;
    }
  }

  // Normalize line breaks
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into question blocks using patterns:
  // "Question 1:", "1.", "Q1.", "1)", "Question 1."
  const blockRegex = /(?:^|\n)(?:Question\s*(\d+)[:.]?|Q(\d+)[:.]?|(\d+)[\.\)])\s+/gi;
  const blocks: { number: number; text: string }[] = [];

  let lastIndex = 0;
  let lastMatch: RegExpExecArray | null = null;

  while ((lastMatch = blockRegex.exec(normalized)) !== null) {
    const num = parseInt(lastMatch[1] || lastMatch[2] || lastMatch[3], 10);
    if (blocks.length > 0) {
      blocks[blocks.length - 1].text = normalized.slice(lastIndex, lastMatch.index).trim();
    }
    blocks.push({ number: num, text: '' });
    lastIndex = blockRegex.lastIndex;
  }

  if (blocks.length > 0) {
    blocks[blocks.length - 1].text = normalized.slice(lastIndex).trim();
  } else {
    // If no numbered headings found, split by double newlines
    const paragraphs = normalized.split(/\n\s*\n/).filter((p) => p.trim().length > 10);
    paragraphs.forEach((p, idx) => {
      blocks.push({ number: idx + 1, text: p.trim() });
    });
  }

  // Separate Answer Key section if present at the end
  let separateAnswerKey: Record<number, string> = {};
  const answerKeyIndex = normalized.search(/(?:ANSWER\s*KEY|ANSWERS|MARKING\s*SCHEME|SOLUTIONS)/i);
  if (answerKeyIndex !== -1) {
    const keySection = normalized.slice(answerKeyIndex);
    const keyRegex = /(\d+)[\.\):\s]+([A-Ea-e]|True|False|true|false|[^\n]+)/g;
    let km;
    while ((km = keyRegex.exec(keySection)) !== null) {
      separateAnswerKey[parseInt(km[1], 10)] = km[2].trim();
    }
  }

  // Process each question block
  blocks.forEach((block, idx) => {
    if (!block.text) return;

    const issues: string[] = [];
    const lines = block.text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return;

    let questionText = lines[0];
    const options: string[] = [];
    let correctAnswer = '';
    let marks = 2;
    let topic = defaultTopic;
    let subtopic = '';
    let questionType: QuestionType = 'mcq';
    let difficulty: QuestionDifficulty = 'medium';

    // Parse options and metadata lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Option format: A. Text, A) Text, (A) Text, [A] Text
      const optionMatch = line.match(/^(?:(?:\(([A-Ea-e])\)|\[([A-Ea-e])\]|([A-Ea-e])[\.\)]))\s+(.*)/i);
      if (optionMatch) {
        const optLetter = (optionMatch[1] || optionMatch[2] || optionMatch[3]).toUpperCase();
        const optText = optionMatch[4].trim();
        options.push(`${optLetter}. ${optText}`);
        continue;
      }

      // Inline correct answer
      const answerMatch = line.match(/(?:Correct\s*Answer|Answer|Ans)[\s:]+([A-Ea-e]|True|False|[^\n]+)/i);
      if (answerMatch) {
        correctAnswer = answerMatch[1].trim();
        continue;
      }

      // Inline marks
      const marksMatch = line.match(/(?:Marks?|Score|Points?)[\s:]+(\d+)/i);
      if (marksMatch) {
        marks = parseInt(marksMatch[1], 10);
        continue;
      }

      // Inline topic
      const topicMatch = line.match(/(?:Topic)[\s:]+([^\n]+)/i);
      if (topicMatch) {
        topic = topicMatch[1].trim();
        continue;
      }

      // Inline question type
      const typeMatch = line.match(/(?:Question\s*Type|Type)[\s:]+([^\n]+)/i);
      if (typeMatch) {
        const t = typeMatch[1].toLowerCase();
        if (t.includes('multiple') || t.includes('mcq')) questionType = 'mcq';
        else if (t.includes('true')) questionType = 'true_false';
        else if (t.includes('fill') || t.includes('gap')) questionType = 'fill_in_the_gap';
        else if (t.includes('short')) questionType = 'short_answer';
        else if (t.includes('essay')) questionType = 'essay';
        else if (t.includes('structured')) questionType = 'structured';
        continue;
      }

      // Difficulty
      const diffMatch = line.match(/(?:Difficulty)[\s:]+([^\n]+)/i);
      if (diffMatch) {
        const d = diffMatch[1].toLowerCase();
        if (d.includes('easy')) difficulty = 'easy';
        else if (d.includes('hard')) difficulty = 'hard';
        else difficulty = 'medium';
        continue;
      }

      // If not the first line and not matching an option or metadata, append to question text
      if (i > 0 && options.length === 0 && !correctAnswer) {
        questionText += ' ' + line;
      }
    }

    // If options were found but questionType is still default, it's MCQ
    if (options.length >= 2) {
      questionType = 'mcq';
    } else if (questionText.toLowerCase().includes('true or false') || questionText.toLowerCase().includes('true/false')) {
      questionType = 'true_false';
      if (options.length === 0) {
        options.push('True', 'False');
      }
    } else if (options.length === 0 && !correctAnswer) {
      questionType = 'short_answer';
    }

    // Match separate answer key if available
    if (!correctAnswer && separateAnswerKey[block.number]) {
      correctAnswer = separateAnswerKey[block.number];
    }

    // Validation checks
    if (!questionText || questionText.trim().length < 5) {
      issues.push('Question text is missing or too short');
    }

    if (questionType === 'mcq' && options.length < 2) {
      issues.push(`MCQ has only ${options.length} option(s) (minimum 2 required)`);
    }

    if (!correctAnswer) {
      issues.push('Missing correct answer / marking key (requires manual input)');
    }

    if (marks <= 0 || isNaN(marks)) {
      marks = 2;
      issues.push('Marks must be greater than 0; defaulted to 2');
    }

    questions.push({
      id: `ext-q-${Date.now()}-${idx}`,
      questionNumber: block.number,
      questionText: questionText.replace(/^Question\s*\d+[:.]?\s*/i, '').trim(),
      options,
      correctAnswer,
      markingGuide: questionType === 'essay' || questionType === 'structured' ? correctAnswer : undefined,
      marks,
      topic,
      subtopic,
      questionType,
      difficulty,
      component: defaultComponent,
      hasErrors: issues.length > 0,
      validationIssues: issues,
    });
  });

  const validCount = questions.filter((q) => !q.hasErrors).length;
  const errorCount = questions.filter((q) => q.hasErrors).length;

  return {
    success: questions.length > 0,
    questions,
    rawText,
    totalParsed: questions.length,
    validCount,
    errorCount,
    warnings,
  };
}

/**
 * Parses structured CSV containing questions
 */
function parseQuestionsFromCsv(
  csvContent: string,
  defaultComponent: TermAssessmentComponent,
  defaultTopic: string
): ParseResult {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    return { success: false, questions: [], rawText: csvContent, totalParsed: 0, validCount: 0, errorCount: 0, warnings: ['CSV is empty'] };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const questions: ExtractedQuestionDraft[] = [];

  const qIdx = headers.findIndex((h) => h.includes('question'));
  const optAIdx = headers.findIndex((h) => h.includes('optiona') || h === 'a');
  const optBIdx = headers.findIndex((h) => h.includes('optionb') || h === 'b');
  const optCIdx = headers.findIndex((h) => h.includes('optionc') || h === 'c');
  const optDIdx = headers.findIndex((h) => h.includes('optiond') || h === 'd');
  const ansIdx = headers.findIndex((h) => h.includes('answer') || h.includes('correct'));
  const marksIdx = headers.findIndex((h) => h.includes('mark') || h.includes('score'));
  const topicIdx = headers.findIndex((h) => h.includes('topic'));
  const diffIdx = headers.findIndex((h) => h.includes('diff'));
  const compIdx = headers.findIndex((h) => h.includes('component'));

  if (qIdx === -1) {
    return { success: false, questions: [], rawText: csvContent, totalParsed: 0, validCount: 0, errorCount: 0, warnings: ['CSV missing Question column'] };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCsvLine(line);

    const questionText = cols[qIdx] || '';
    if (!questionText) continue;

    const options: string[] = [];
    if (optAIdx !== -1 && cols[optAIdx]) options.push(`A. ${cols[optAIdx]}`);
    if (optBIdx !== -1 && cols[optBIdx]) options.push(`B. ${cols[optBIdx]}`);
    if (optCIdx !== -1 && cols[optCIdx]) options.push(`C. ${cols[optCIdx]}`);
    if (optDIdx !== -1 && cols[optDIdx]) options.push(`D. ${cols[optDIdx]}`);

    const correctAnswer = ansIdx !== -1 ? cols[ansIdx] || '' : '';
    const marks = marksIdx !== -1 && !isNaN(parseInt(cols[marksIdx], 10)) ? parseInt(cols[marksIdx], 10) : 2;
    const topic = topicIdx !== -1 && cols[topicIdx] ? cols[topicIdx] : defaultTopic;
    let difficulty: QuestionDifficulty = 'medium';
    if (diffIdx !== -1 && cols[diffIdx]) {
      const d = cols[diffIdx].toLowerCase();
      if (d === 'easy' || d === 'hard') difficulty = d;
    }

    let comp = defaultComponent;
    if (compIdx !== -1 && cols[compIdx]) {
      const c = cols[compIdx].toUpperCase();
      if (c === 'CA1' || c === 'CA2' || c === 'EXAM') comp = c as TermAssessmentComponent;
    }

    const issues: string[] = [];
    if (!correctAnswer) issues.push('Missing correct answer');

    questions.push({
      id: `csv-q-${Date.now()}-${i}`,
      questionNumber: i,
      questionText,
      options,
      correctAnswer,
      marks,
      topic,
      questionType: options.length >= 2 ? 'mcq' : 'short_answer',
      difficulty,
      component: comp,
      hasErrors: issues.length > 0,
      validationIssues: issues,
    });
  }

  const validCount = questions.filter((q) => !q.hasErrors).length;
  const errorCount = questions.filter((q) => q.hasErrors).length;

  return {
    success: questions.length > 0,
    questions,
    rawText: csvContent,
    totalParsed: questions.length,
    validCount,
    errorCount,
    warnings: [],
  };
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}
