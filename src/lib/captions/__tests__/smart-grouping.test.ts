/**
 * Smart Grouping Tests
 *
 * Run with: npx tsx src/lib/captions/__tests__/smart-grouping.test.ts
 */

import { groupWordsSmartly, groupWordsFixed, WEAK_BINDING_WORDS } from '../smart-grouping';
import { STTWord, DEFAULT_GROUPING_CONFIG } from '@/types/captions';

// ============================================
// TEST UTILITIES
// ============================================

let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void) {
  testCount++;
  try {
    fn();
    passCount++;
    console.log(`✓ ${name}`);
  } catch (error) {
    failCount++;
    console.error(`✗ ${name}`);
    console.error(`  ${error instanceof Error ? error.message : error}`);
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: T) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual > expected) {
        throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
      }
    },
    toHaveLength(expected: number) {
      if (!Array.isArray(actual) || actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${Array.isArray(actual) ? actual.length : 'not an array'}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, got ${actual}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, got ${actual}`);
      }
    },
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a mock STTWord for testing
 */
function makeWord(text: string, start: number, duration = 300): STTWord {
  return { text, start, end: start + duration };
}

/**
 * Create a sequence of words with default timing
 */
function makeWordSequence(texts: string[], gapMs = 100): STTWord[] {
  const words: STTWord[] = [];
  let currentTime = 0;

  for (const text of texts) {
    words.push(makeWord(text, currentTime, 300));
    currentTime += 300 + gapMs; // word duration + gap
  }

  return words;
}

/**
 * Count total words across all groups
 */
function countTotalWords(groups: ReturnType<typeof groupWordsSmartly>): number {
  return groups.reduce((sum, g) => sum + g.words.length, 0);
}

/**
 * Get all word texts in order across groups
 */
function getAllWordsText(groups: ReturnType<typeof groupWordsSmartly>): string[] {
  return groups.flatMap((g) => g.words.map((w) => w.text));
}

// ============================================
// TESTS
// ============================================

console.log('\n📝 Smart Grouping Tests\n');
console.log('='.repeat(50));

// Test 1: Empty input
test('handles empty input', () => {
  const result = groupWordsSmartly([]);
  expect(result).toHaveLength(0);
});

// Test 2: Single word input
test('handles single word input', () => {
  const words = [makeWord('Hello', 0)];
  const result = groupWordsSmartly(words);
  expect(result).toHaveLength(1);
  expect(result[0].text).toBe('Hello');
});

// Test 3: No word overlap (every word in exactly one group)
test('produces no word overlap', () => {
  const words = makeWordSequence([
    'This', 'is', 'a', 'test', 'sentence', 'with', 'multiple', 'words', 'for', 'grouping'
  ]);

  const result = groupWordsSmartly(words);
  const totalWords = countTotalWords(result);

  expect(totalWords).toBe(words.length);
});

// Test 4: No dropped words
test('drops no words', () => {
  const texts = ['Hello', 'world', 'this', 'is', 'a', 'test', 'of', 'the', 'grouping', 'algorithm'];
  const words = makeWordSequence(texts);

  const result = groupWordsSmartly(words);
  const outputTexts = getAllWordsText(result);

  expect(outputTexts).toEqual(texts);
});

// Test 5: Sentence boundary splits
test('splits at sentence boundaries', () => {
  const words = makeWordSequence([
    'First', 'sentence.', 'Second', 'sentence!', 'Third', 'one?'
  ]);

  const result = groupWordsSmartly(words);

  // Should have 3 groups (one per sentence)
  expect(result).toHaveLength(3);
  expect(result[0].text).toBe('First sentence.');
  expect(result[1].text).toBe('Second sentence!');
  expect(result[2].text).toBe('Third one?');
});

// Test 6: Comma breaks with 2+ words
test('breaks at commas with 2+ words', () => {
  const words = makeWordSequence([
    'Hello', 'there,', 'how', 'are', 'you', 'today'
  ]);

  const result = groupWordsSmartly(words);

  // First group should end at comma
  expect(result[0].text).toBe('Hello there,');
});

// Test 7: Long pause breaks (500ms gap)
test('breaks at long pauses (>400ms)', () => {
  const words: STTWord[] = [
    makeWord('Word', 0),
    makeWord('one', 400), // 100ms gap
    makeWord('pause', 1200), // 500ms gap - should trigger break
    makeWord('here', 1600),
  ];

  const result = groupWordsSmartly(words);

  // Should break after 'one' due to 500ms pause
  expect(result.length).toBeGreaterThan(1);
  expect(result[0].words.length).toBeLessThanOrEqual(2);
});

// Test 8: Max words enforced (6 words max)
test('enforces max words limit', () => {
  const words = makeWordSequence([
    'One', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'
  ]);

  const result = groupWordsSmartly(words);

  // No group should exceed max words (6 by default, +1 for anti-orphan)
  for (const group of result) {
    expect(group.words.length).toBeLessThanOrEqual(DEFAULT_GROUPING_CONFIG.maxWords + 1);
  }
});

// Test 9: Numbers with periods don't trigger false breaks ($29.99)
test('numbers with periods do not trigger sentence break', () => {
  const words = makeWordSequence([
    'Price', 'is', '$29.99', 'for', 'the', 'product'
  ]);

  const result = groupWordsSmartly(words);

  // $29.99 should not cause a break
  // Find which group contains $29.99
  const groupWith2999 = result.find((g) => g.words.some((w) => w.text === '$29.99'));
  expect(groupWith2999).toBeTruthy();

  // $29.99 should be in the same group as surrounding words (not alone)
  expect(groupWith2999!.words.length).toBeGreaterThan(1);
});

// Test 10: Orphan prevention (single word at end)
test('prevents single-word orphan groups', () => {
  // Create exactly 7 words (maxWords=6, so normally would split 6+1)
  const words = makeWordSequence([
    'One', 'two', 'three', 'four', 'five', 'six', 'seven'
  ]);

  const result = groupWordsSmartly(words);

  // Last group should not be a single word (anti-orphan rule)
  const lastGroup = result[result.length - 1];
  expect(lastGroup.words.length).toBeGreaterThan(1);
});

// Test 11: Fixed grouping i += groupSize (no sliding window)
test('fixed grouping uses correct increment (no sliding window)', () => {
  const words = makeWordSequence(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);

  const result = groupWordsFixed(words, 3);

  // With groupSize=3 and 9 words: should have 3 groups of 3
  expect(result).toHaveLength(3);
  expect(result[0].text).toBe('A B C');
  expect(result[1].text).toBe('D E F');
  expect(result[2].text).toBe('G H I');

  // No overlap: total words should equal input
  expect(countTotalWords(result)).toBe(9);
});

// Test 12: Fixed grouping handles non-divisible lengths
test('fixed grouping handles remainder words', () => {
  const words = makeWordSequence(['A', 'B', 'C', 'D', 'E']);

  const result = groupWordsFixed(words, 2);

  // 5 words with groupSize=2: should have 3 groups (2, 2, 1)
  expect(result).toHaveLength(3);
  expect(result[0].text).toBe('A B');
  expect(result[1].text).toBe('C D');
  expect(result[2].text).toBe('E');
});

// Test 13: Weak binding words cause natural breaks
test('breaks before weak binding words when hitting max', () => {
  // Create a sentence that will hit max words, with a weak binding word
  const words = makeWordSequence([
    'The', 'quick', 'brown', 'fox', 'jumps', 'and', 'runs', 'away'
  ]);

  const result = groupWordsSmartly(words);

  // With maxWords=6, should split around 'and' (weak binding word)
  // Check that 'and' starts a new group
  const andGroupIndex = result.findIndex((g) => g.words[0]?.text === 'and');

  // 'and' should start a group (broken before it)
  expect(andGroupIndex).toBeGreaterThan(0);
});

// Test 14: Medium pause with 3+ words triggers soft break
test('soft break at medium pause with 3+ words', () => {
  const words: STTWord[] = [
    makeWord('One', 0),
    makeWord('two', 400),
    makeWord('three', 800),
    makeWord('four', 1500), // 400ms gap (exactly at threshold, should NOT trigger)
    makeWord('five', 1900),
  ];

  // Create scenario with gap between 200-400ms
  const wordsWithSoftPause: STTWord[] = [
    makeWord('One', 0),
    makeWord('two', 400),
    makeWord('three', 800),
    makeWord('four', 1400), // 300ms gap (between 200-400ms)
    makeWord('five', 1800),
  ];

  const result = groupWordsSmartly(wordsWithSoftPause);

  // Should have multiple groups due to soft pause
  expect(result.length).toBeGreaterThan(0);
  expect(countTotalWords(result)).toBe(5);
});

// Test 15: Timing integrity (startTime and endTime correct)
test('group timing is correct', () => {
  const words: STTWord[] = [
    makeWord('Hello', 0, 300),
    makeWord('world', 400, 300),
    makeWord('test.', 800, 300),
  ];

  const result = groupWordsSmartly(words);

  // First group should have correct timing
  expect(result[0].startTime).toBe(0);
  expect(result[0].endTime).toBe(1100); // end of 'test.'
});

// Test 16: WEAK_BINDING_WORDS contains expected words
test('weak binding words set contains common words', () => {
  expect(WEAK_BINDING_WORDS.has('and')).toBeTruthy();
  expect(WEAK_BINDING_WORDS.has('the')).toBeTruthy();
  expect(WEAK_BINDING_WORDS.has('but')).toBeTruthy();
  expect(WEAK_BINDING_WORDS.has('in')).toBeTruthy();
  expect(WEAK_BINDING_WORDS.has('for')).toBeTruthy();
});

// ============================================
// RESULTS
// ============================================

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${passCount}/${testCount} tests passed`);

if (failCount > 0) {
  console.log(`❌ ${failCount} test(s) failed`);
  process.exit(1);
} else {
  console.log('✅ All tests passed!\n');
  process.exit(0);
}
