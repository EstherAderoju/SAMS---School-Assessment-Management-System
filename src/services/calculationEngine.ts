import { GradeBoundary, TermAssessmentStructureConfig, PromotionStatus } from '../types';

export const DEFAULT_GRADING_SCALE: GradeBoundary[] = [
  { grade: 'A1', minScore: 75, maxScore: 100, remark: 'Excellent', points: 9 },
  { grade: 'B2', minScore: 70, maxScore: 74.99, remark: 'Very Good', points: 8 },
  { grade: 'B3', minScore: 65, maxScore: 69.99, remark: 'Good', points: 7 },
  { grade: 'C4', minScore: 60, maxScore: 64.99, remark: 'Credit', points: 6 },
  { grade: 'C5', minScore: 55, maxScore: 59.99, remark: 'Credit', points: 5 },
  { grade: 'C6', minScore: 50, maxScore: 54.99, remark: 'Credit', points: 4 },
  { grade: 'D7', minScore: 45, maxScore: 49.99, remark: 'Pass', points: 3 },
  { grade: 'E8', minScore: 40, maxScore: 44.99, remark: 'Pass', points: 2 },
  { grade: 'F9', minScore: 0, maxScore: 39.99, remark: 'Fail', points: 1 },
];

export const DEFAULT_ASSESSMENT_STRUCTURE: TermAssessmentStructureConfig = {
  ca1MaxScore: 10,
  ca1Weight: 10,
  ca2MaxScore: 10,
  ca2Weight: 10,
  examMaxScore: 80,
  examWeight: 80,
  totalMaxScore: 100,
  totalWeight: 100,
};

/**
 * Validates fixed CA1, CA2, and Exam assessment component weights
 */
export function validateAssessmentStructure(config: TermAssessmentStructureConfig): { valid: boolean; error?: string } {
  const sumWeights = (config.ca1Weight || 0) + (config.ca2Weight || 0) + (config.examWeight || 0);
  if (Math.abs(sumWeights - 100) > 0.01) {
    return {
      valid: false,
      error: `Sum of CA1 (${config.ca1Weight}%), CA2 (${config.ca2Weight}%), and Examination (${config.examWeight}%) must equal exactly 100%. Current total: ${sumWeights}%`,
    };
  }
  if (config.ca1MaxScore <= 0 || config.ca2MaxScore <= 0 || config.examMaxScore <= 0) {
    return { valid: false, error: 'Maximum scores for CA1, CA2, and Examination must be greater than 0.' };
  }
  return { valid: true };
}

/**
 * Normalize raw marks against component maximum and percentage contribution
 */
export function normalizeComponentScore(rawScore: number | null, maxScore: number, weightPercent: number): number {
  if (rawScore === null || rawScore === undefined || isNaN(rawScore)) return 0;
  if (maxScore <= 0) return 0;
  const clamped = Math.max(0, Math.min(rawScore, maxScore));
  return Math.round(((clamped / maxScore) * weightPercent) * 10) / 10;
}

/**
 * Determine grade, remark, and points based on final score
 */
export function getGradeForScore(score: number, gradingScale = DEFAULT_GRADING_SCALE): { grade: string; remark: string; points: number } {
  const rounded = Math.round(score * 10) / 10;
  for (const boundary of gradingScale) {
    if (rounded >= boundary.minScore && rounded <= boundary.maxScore) {
      return {
        grade: boundary.grade,
        remark: boundary.remark,
        points: boundary.points || 0,
      };
    }
  }
  // Boundary fallback
  if (rounded >= 75) return { grade: 'A1', remark: 'Excellent', points: 9 };
  if (rounded >= 70) return { grade: 'B2', remark: 'Very Good', points: 8 };
  if (rounded >= 65) return { grade: 'B3', remark: 'Good', points: 7 };
  if (rounded >= 60) return { grade: 'C4', remark: 'Credit', points: 6 };
  if (rounded >= 55) return { grade: 'C5', remark: 'Credit', points: 5 };
  if (rounded >= 50) return { grade: 'C6', remark: 'Credit', points: 4 };
  if (rounded >= 45) return { grade: 'D7', remark: 'Pass', points: 3 };
  if (rounded >= 40) return { grade: 'E8', remark: 'Pass', points: 2 };
  return { grade: 'F9', remark: 'Fail', points: 1 };
}

/**
 * Validates grading boundaries to ensure no overlaps and no gaps
 */
export function validateGradingScale(scale: GradeBoundary[]): { valid: boolean; error?: string } {
  if (!scale || scale.length === 0) {
    return { valid: false, error: 'Grading scale cannot be empty' };
  }

  // Sort descending by minScore
  const sorted = [...scale].sort((a, b) => b.minScore - a.minScore);

  // Highest boundary should reach 100
  if (sorted[0].maxScore < 100) {
    return { valid: false, error: `Top boundary must reach 100 (currently ${sorted[0].maxScore})` };
  }

  // Lowest boundary must reach 0
  if (sorted[sorted.length - 1].minScore > 0) {
    return { valid: false, error: `Bottom boundary must start at 0 (currently ${sorted[sorted.length - 1].minScore})` };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.minScore <= next.maxScore) {
      return {
        valid: false,
        error: `Overlap detected between grade ${current.grade} (min ${current.minScore}) and ${next.grade} (max ${next.maxScore})`,
      };
    }

    // Gap check (> 1 point gap)
    if (current.minScore - next.maxScore > 0.02) {
      return {
        valid: false,
        error: `Gap detected between grade ${current.grade} (min ${current.minScore}) and ${next.grade} (max ${next.maxScore})`,
      };
    }
  }

  return { valid: true };
}

/**
 * Standard competitive rank calculation (ties receive same rank, next rank is skipped)
 */
export function calculateRanks(scores: { id: string; score: number }[]): Record<string, number> {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const ranks: Record<string, number> = {};

  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].score < sorted[i - 1].score) {
      currentRank = i + 1;
    }
    ranks[sorted[i].id] = currentRank;
  }

  return ranks;
}

/**
 * Format position to ordinal: 1st, 2nd, 3rd, 4th, etc.
 */
export function formatOrdinal(n?: number): string {
  if (!n) return '-';
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

/**
 * Calculate promotion decision
 */
export function evaluatePromotion(
  averageScore: number,
  subjectScores: { subjectCode: string; finalScore: number; isCore: boolean }[],
  minAverage = 50,
  minCorePass = 2
): PromotionStatus {
  if (averageScore >= minAverage) {
    const corePasses = subjectScores.filter((s) => s.isCore && s.finalScore >= 50).length;
    if (corePasses >= minCorePass) {
      return 'promoted';
    }
    return 'promoted_on_trial';
  } else if (averageScore >= minAverage - 8) {
    return 'promoted_on_trial';
  }
  return 'repeat';
}
