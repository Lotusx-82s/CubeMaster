import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  calculateEstimatedTime, 
  formatSolutionString, 
  generateSolutionPDF 
} from '../solutionExport.ts';
import { PUZZLE_DEFINITIONS } from '../puzzles.ts';
import type { SolutionStep } from '../../types/cube.ts';

describe('Solution Export: Estimated Time Calculator', () => {
  it('correctly calculates estimated solving duration clearly labeled as an estimate', () => {
    const breakdown = calculateEstimatedTime(20, '3x3');

    assert.ok(breakdown.summary.includes('Estimated:'));
    assert.ok(breakdown.summary.includes('seconds'));
    assert.ok(breakdown.speedcuber.includes('TPS'));
    assert.ok(breakdown.intermediate.includes('TPS'));
    assert.ok(breakdown.beginner.includes('TPS'));
    assert.ok(breakdown.disclaimer.includes('Estimated manual solving duration'));
  });

  it('handles 0 moves (already solved) gracefully', () => {
    const breakdown = calculateEstimatedTime(0, '3x3');
    assert.strictEqual(breakdown.summary, '0 seconds (Already Solved)');
  });
});

describe('Solution Export: Format & PDF Generator', () => {
  const mockSteps: SolutionStep[] = [
    { move: 'R', face: 'R', angle: 90, description: 'Rotate Right face 90° clockwise', explanation: 'Turn Right layer.' },
    { move: 'U', face: 'U', angle: 90, description: 'Rotate Up face 90° clockwise', explanation: 'Turn Up layer.' },
    { move: "R'", face: 'R', angle: -90, description: 'Rotate Right face 90° counter-clockwise', explanation: 'Turn Right layer counter-clockwise.' },
    { move: "U'", face: 'U', angle: -90, description: 'Rotate Up face 90° counter-clockwise', explanation: 'Turn Up layer counter-clockwise.' },
  ];

  it('formats readable standard move notation string', () => {
    const formatted = formatSolutionString(mockSteps);
    assert.strictEqual(formatted, "R U R' U'");
  });

  it('generates a valid, compliant PDF 1.4 document', async () => {
    const puzzle = PUZZLE_DEFINITIONS[1]; // 3x3
    const blob = generateSolutionPDF(puzzle, mockSteps, ["F", "R"]);

    assert.strictEqual(blob.type, 'application/pdf');
    assert.ok(blob.size > 200, `Expected PDF size > 200 bytes, got ${blob.size}`);

    const buffer = Buffer.from(await blob.arrayBuffer());
    const str = buffer.toString('utf-8');

    assert.ok(str.startsWith('%PDF-1.4'), 'Must start with %PDF-1.4 header');
    assert.ok(str.includes('%%EOF'), 'Must end with %%EOF marker');
    assert.ok(str.includes('/Type /Catalog'), 'Must contain PDF catalog');
    assert.ok(str.includes('/Type /Page'), 'Must contain PDF page');
    assert.ok(str.includes('CubeMaster'), 'Must contain CubeMaster title');
  });
});
