import type { PuzzleDefinition, SolutionStep } from '../types/cube';

export interface EstimatedTimeBreakdown {
  summary: string;
  speedcuber: string;
  intermediate: string;
  beginner: string;
  disclaimer: string;
}

/**
 * Calculates estimated manual solving time based on speedcuber, intermediate,
 * and beginner turns-per-second (TPS) metrics. Clearly designated as an estimate.
 */
export function calculateEstimatedTime(
  moveCount: number,
  puzzleType: string
): EstimatedTimeBreakdown {
  if (moveCount === 0) {
    return {
      summary: '0 seconds (Already Solved)',
      speedcuber: '0s',
      intermediate: '0s',
      beginner: '0s',
      disclaimer: 'Puzzle is already in a solved configuration.',
    };
  }

  // TPS factors based on puzzle mechanics
  let intermediateTPS = 1.0;
  let speedcuberTPS = 2.5;
  let beginnerTPS = 0.5;

  if (puzzleType === '2x2') {
    intermediateTPS = 1.5;
    speedcuberTPS = 4.0;
    beginnerTPS = 0.8;
  } else if (puzzleType === 'pyraminx' || puzzleType === 'skewb') {
    intermediateTPS = 1.2;
    speedcuberTPS = 3.2;
    beginnerTPS = 0.6;
  }

  const speedSec = Math.max(1, Math.round(moveCount / speedcuberTPS));
  const interSec = Math.max(2, Math.round(moveCount / intermediateTPS));
  const begSec = Math.max(3, Math.round(moveCount / beginnerTPS));

  return {
    summary: `~${interSec} seconds (Estimated: ${speedSec}s – ${begSec}s)`,
    speedcuber: `~${speedSec}s (at ${speedcuberTPS} TPS)`,
    intermediate: `~${interSec}s (at ${intermediateTPS} TPS)`,
    beginner: `~${begSec}s (at ${beginnerTPS} TPS)`,
    disclaimer:
      'Estimated manual solving duration based on standard turns-per-second (TPS) averages. Actual execution time varies depending on finger-trick familiarity and hardware speed.',
  };
}

/**
 * Converts solution steps into clean, standard Singmaster notation.
 * Example: "R U R' U' F2 D L2 U'"
 */
export function formatSolutionString(steps: SolutionStep[]): string {
  return steps.map((s) => s.move).join(' ');
}

/**
 * Generates and downloads a structured TXT file containing complete solution details.
 */
export function downloadSolutionAsTXT(
  puzzle: PuzzleDefinition,
  steps: SolutionStep[],
  scrambleMoves: string[] = []
): void {
  const moveString = formatSolutionString(steps);
  const estimate = calculateEstimatedTime(steps.length, puzzle.id);
  const dateStr = new Date().toLocaleString();

  const lines: string[] = [
    '====================================================================',
    `  CUBEMASTER PUZZLE SOLUTION GUIDE`,
    `  Generated on: ${dateStr}`,
    '====================================================================',
    '',
    `Puzzle:            ${puzzle.name} (${puzzle.dimensionsLabel})`,
    `Solving Engine:    ${puzzle.engineName}`,
    `Algorithm Method:  ${puzzle.algorithmSupport}`,
    `Total Move Count:  ${steps.length} moves`,
    `Solving Time:      ${estimate.summary} [ESTIMATED]`,
    '',
  ];

  if (scrambleMoves.length > 0) {
    lines.push(
      '--------------------------------------------------------------------',
      'ORIGINAL SCRAMBLE SEQUENCE:',
      '--------------------------------------------------------------------',
      scrambleMoves.join(' '),
      ''
    );
  }

  lines.push(
    '--------------------------------------------------------------------',
    'COMPLETE VERIFIED MOVE SEQUENCE (Standard Notation):',
    '--------------------------------------------------------------------',
    moveString || '(Already Solved - 0 moves)',
    '',
    '--------------------------------------------------------------------',
    'ESTIMATED SOLVING DURATION BY SKILL LEVEL [ESTIMATE]:',
    '--------------------------------------------------------------------',
    `• Speedcuber Pace:     ${estimate.speedcuber}`,
    `• Intermediate Pace:   ${estimate.intermediate}`,
    `• Beginner Pace:       ${estimate.beginner}`,
    `Note: ${estimate.disclaimer}`,
    '',
    '--------------------------------------------------------------------',
    'STEP-BY-STEP MOVE INSTRUCTIONS:',
    '--------------------------------------------------------------------'
  );

  steps.forEach((step, idx) => {
    lines.push(
      `Step ${idx + 1}: ${step.move}`,
      `  Layer / Axis:   ${step.face}`,
      `  Action:         ${step.description}`,
      `  Explanation:    ${step.explanation}`,
      ''
    );
  });

  lines.push(
    '====================================================================',
    '  Verified & Solved via CubeMaster • End of Solution Document',
    '===================================================================='
  );

  const content = lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `CubeMaster_${puzzle.id}_Solution.txt`);
}

/**
 * Generates a valid standard PDF 1.4 document containing complete solution details.
 */
export function generateSolutionPDF(
  puzzle: PuzzleDefinition,
  steps: SolutionStep[],
  scrambleMoves: string[] = []
): Blob {
  const moveString = formatSolutionString(steps) || 'None (Already Solved)';
  const estimate = calculateEstimatedTime(steps.length, puzzle.id);
  const dateStr = new Date().toLocaleDateString();

  // Escape special PDF characters: (, ), \
  const sanitize = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // Build stream content with Helvetica & Helvetica-Bold
  const streamLines: string[] = [];
  streamLines.push('BT');

  // Title
  streamLines.push('/F2 18 Tf');
  streamLines.push('50 780 Td');
  streamLines.push(`(${sanitize('CubeMaster • Puzzle Solution Guide')}) Tj`);

  // Subtitle / Date
  streamLines.push('/F1 9 Tf');
  streamLines.push('0 -16 Td');
  streamLines.push(`(${sanitize(`Verified Solver Export • ${dateStr}`)}) Tj`);

  // Meta Section
  streamLines.push('/F2 11 Tf');
  streamLines.push('0 -24 Td');
  streamLines.push(`(${sanitize(`Puzzle: ${puzzle.name} (${puzzle.dimensionsLabel})`)}) Tj`);

  streamLines.push('/F1 10 Tf');
  streamLines.push('0 -14 Td');
  streamLines.push(`(${sanitize(`Solving Engine: ${puzzle.engineName} | Algorithm: ${puzzle.algorithmSupport}`)}) Tj`);

  streamLines.push('0 -14 Td');
  streamLines.push(`(${sanitize(`Total Move Count: ${steps.length} moves | Estimated Time: ${estimate.summary}`)}) Tj`);

  if (scrambleMoves.length > 0) {
    streamLines.push('/F1 9 Tf');
    streamLines.push('0 -13 Td');
    streamLines.push(`(${sanitize(`Original Scramble: ${scrambleMoves.join(' ')}`)}) Tj`);
  }

  // Move Sequence Box
  streamLines.push('/F2 11 Tf');
  streamLines.push('0 -24 Td');
  streamLines.push(`(${sanitize('Complete Verified Move Sequence (Standard Notation):')}) Tj`);

  streamLines.push('/F2 12 Tf');
  // Break move string into chunks of ~60 chars for readable wrapping
  const moveChunks: string[] = [];
  const words = moveString.split(' ');
  let currentChunk = '';
  for (const w of words) {
    if ((currentChunk + ' ' + w).length > 60) {
      moveChunks.push(currentChunk.trim());
      currentChunk = w;
    } else {
      currentChunk += ' ' + w;
    }
  }
  if (currentChunk.trim()) moveChunks.push(currentChunk.trim());

  for (const chunk of moveChunks) {
    streamLines.push('0 -16 Td');
    streamLines.push(`(${sanitize(chunk)}) Tj`);
  }

  // Estimated Solving Time Section
  streamLines.push('/F2 11 Tf');
  streamLines.push('0 -22 Td');
  streamLines.push(`(${sanitize('Estimated Manual Solving Time Breakdown [ESTIMATE]:')}) Tj`);

  streamLines.push('/F1 9 Tf');
  streamLines.push('0 -13 Td');
  streamLines.push(`(${sanitize(`- Speedcuber (~2.5 TPS): ${estimate.speedcuber}`)}) Tj`);
  streamLines.push('0 -12 Td');
  streamLines.push(`(${sanitize(`- Intermediate (~1.0 TPS): ${estimate.intermediate}`)}) Tj`);
  streamLines.push('0 -12 Td');
  streamLines.push(`(${sanitize(`- Beginner (~0.5 TPS): ${estimate.beginner}`)}) Tj`);
  streamLines.push('0 -12 Td');
  streamLines.push(`(${sanitize(`Note: ${estimate.disclaimer}`)}) Tj`);

  // Step-by-Step Instructions table (up to 20 steps per page sample)
  streamLines.push('/F2 11 Tf');
  streamLines.push('0 -22 Td');
  streamLines.push(`(${sanitize(`Step-by-Step Move Guide (${steps.length} steps):`)}) Tj`);

  streamLines.push('/F1 9 Tf');
  const maxStepsToList = Math.min(steps.length, 25);
  for (let i = 0; i < maxStepsToList; i++) {
    const s = steps[i];
    streamLines.push('0 -13 Td');
    streamLines.push(`(${sanitize(`Step ${i + 1}: ${s.move} -> ${s.description}`)}) Tj`);
  }

  if (steps.length > maxStepsToList) {
    streamLines.push('0 -13 Td');
    streamLines.push(`(${sanitize(`... and ${steps.length - maxStepsToList} more steps (see full text solution)`)}) Tj`);
  }

  // Footer
  streamLines.push('/F1 8 Tf');
  streamLines.push('0 -24 Td');
  streamLines.push(`(${sanitize('Generated by CubeMaster • Validated Geometric Solving Engine')}) Tj`);

  streamLines.push('ET');

  const contentStream = streamLines.join('\n');
  const streamLength = contentStream.length;

  // Construct PDF Objects
  const objects: string[] = [];

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Page
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n'
  );

  // Object 4: Font Regular (Helvetica)
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  // Object 5: Font Bold (Helvetica-Bold)
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');

  // Object 6: Content Stream
  objects.push(`6 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

  // Assemble PDF document with accurate XREF table
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Downloads the solution as a clean, standard PDF.
 */
export function downloadSolutionAsPDF(
  puzzle: PuzzleDefinition,
  steps: SolutionStep[],
  scrambleMoves: string[] = []
): void {
  const blob = generateSolutionPDF(puzzle, steps, scrambleMoves);
  triggerDownload(blob, `CubeMaster_${puzzle.id}_Solution.pdf`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
