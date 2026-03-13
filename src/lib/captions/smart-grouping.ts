/**
 * Smart Semantic Word Grouping
 *
 * Groups words for caption display using semantic rules for natural reading.
 * This creates phrase-aware groups that respect sentence boundaries,
 * pauses, and punctuation for better readability.
 */

import {
  STTWord,
  WordGroup,
  GroupingConfig,
  DEFAULT_GROUPING_CONFIG,
} from '@/types/captions';

// ============================================
// WEAK BINDING WORDS
// ============================================

/**
 * Words where breaking BEFORE them produces natural caption groups.
 * Used when max group size forces a mid-sentence break.
 */
export const WEAK_BINDING_WORDS = new Set([
  // Conjunctions
  'and', 'but', 'or', 'so', 'yet', 'because', 'since', 'while',
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'of', 'about',
  // Articles / determiners
  'the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'our',
  // Relative / linking
  'which', 'who', 'where', 'when', 'then', 'than', 'like',
  // Adverbs that start new thoughts
  'just', 'even', 'also', 'really', 'actually', 'literally',
]);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if word ends with sentence-ending punctuation
 * Excludes numbers with periods (e.g., $29.99)
 */
function isSentenceEnd(word: string): boolean {
  // Match sentence-ending punctuation
  if (!/[.!?]$/.test(word)) {
    return false;
  }

  // Exclude numbers with periods (e.g., $29.99, 3.14)
  // Pattern: digit followed by period followed by digit
  if (/\d\.\d/.test(word)) {
    return false;
  }

  return true;
}

/**
 * Check if word ends with a comma or semicolon
 */
function isCommaBreak(word: string): boolean {
  return /[,;]$/.test(word);
}

/**
 * Get the gap (pause) between two consecutive words
 */
function getGap(current: STTWord, next: STTWord): number {
  return next.start - current.end;
}

/**
 * Extract the base word without punctuation for weak binding check
 */
function getBaseWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * Check if a word is a weak binding word
 */
function isWeakBindingWord(word: string): boolean {
  return WEAK_BINDING_WORDS.has(getBaseWord(word));
}

/**
 * Create a WordGroup from a list of STTWords
 */
function createGroup(words: STTWord[]): WordGroup {
  if (words.length === 0) {
    return {
      words: [],
      text: '',
      startTime: 0,
      endTime: 0,
    };
  }

  return {
    words,
    text: words.map((w) => w.text).join(' '),
    startTime: words[0].start,
    endTime: words[words.length - 1].end,
  };
}

// ============================================
// SMART SEMANTIC GROUPING
// ============================================

/**
 * Group words using smart semantic rules for natural reading.
 *
 * Rules (in priority order):
 * 1. HARD BREAK: Sentence-ending punctuation (. ! ?)
 * 2. HARD BREAK: Long pause > 400ms between words
 * 3. SOFT BREAK: Comma/semicolon with 2+ words in group
 * 4. SOFT BREAK: Medium pause 200-400ms with 3+ words
 * 5. FORCED BREAK: Max 6 words (break before weak binding word)
 * 6. ANTI-ORPHAN: Prevent 1-word final groups (unless sentence end)
 * 7. FORCED BREAK: Max 2.5s duration
 *
 * @param words - Array of STTWord timestamps
 * @param config - Grouping configuration
 * @returns Array of non-overlapping WordGroups
 */
export function groupWordsSmartly(
  words: STTWord[],
  config: GroupingConfig = DEFAULT_GROUPING_CONFIG
): WordGroup[] {
  if (words.length === 0) {
    return [];
  }

  if (words.length === 1) {
    return [createGroup(words)];
  }

  const groups: WordGroup[] = [];
  let currentGroup: STTWord[] = [];
  let groupStartTime = words[0].start;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    const isLastWord = i === words.length - 1;

    // Add word to current group
    currentGroup.push(word);

    // Calculate current group duration
    const groupDuration = word.end - groupStartTime;
    const groupLength = currentGroup.length;

    // Determine if we should break after this word
    let shouldBreak = false;
    let breakReason = '';

    // Rule 1: HARD BREAK - Sentence-ending punctuation
    if (isSentenceEnd(word.text)) {
      shouldBreak = true;
      breakReason = 'sentence_end';
    }

    // Rule 2: HARD BREAK - Long pause > 400ms
    if (!shouldBreak && !isLastWord) {
      const gap = getGap(word, nextWord);
      if (gap > config.hardPauseThreshold) {
        shouldBreak = true;
        breakReason = 'hard_pause';
      }
    }

    // Rule 3: SOFT BREAK - Comma/semicolon with 2+ words
    if (!shouldBreak && !isLastWord && isCommaBreak(word.text) && groupLength >= 2) {
      shouldBreak = true;
      breakReason = 'comma_break';
    }

    // Rule 4: SOFT BREAK - Medium pause 200-400ms with 3+ words
    if (!shouldBreak && !isLastWord && groupLength >= 3) {
      const gap = getGap(word, nextWord);
      if (gap > config.softPauseThreshold && gap <= config.hardPauseThreshold) {
        shouldBreak = true;
        breakReason = 'soft_pause';
      }
    }

    // Rule 5: FORCED BREAK - Max words reached
    if (!shouldBreak && groupLength >= config.maxWords) {
      // Look for weak binding word to break before
      // Start from current position and look backward
      let breakIndex = groupLength - 1; // Default: break at max

      for (let j = groupLength - 1; j >= Math.max(0, groupLength - 3); j--) {
        if (isWeakBindingWord(currentGroup[j].text)) {
          breakIndex = j;
          break;
        }
      }

      // If we found a weak binding word that's not the first word
      if (breakIndex > 0 && breakIndex < groupLength) {
        // Split the group: keep words before breakIndex, push rest back
        const keepWords = currentGroup.slice(0, breakIndex);
        const pushBackWords = currentGroup.slice(breakIndex);

        // Create group with kept words
        groups.push(createGroup(keepWords));

        // Reset current group with pushed-back words
        currentGroup = pushBackWords;
        groupStartTime = currentGroup[0].start;
        shouldBreak = false; // Don't break again
      } else {
        // No good break point found, break at max
        shouldBreak = true;
        breakReason = 'max_words';
      }
    }

    // Rule 7: FORCED BREAK - Max duration
    if (!shouldBreak && groupDuration > config.maxDuration) {
      shouldBreak = true;
      breakReason = 'max_duration';
    }

    // Rule 6: ANTI-ORPHAN - Check if breaking would leave a single orphan
    if (shouldBreak && !isLastWord) {
      const remainingWords = words.length - i - 1;

      // If breaking would leave exactly 1 word at the end
      if (remainingWords === 1) {
        const lastWord = words[i + 1];

        // Only allow orphan if it's a sentence ender
        if (!isSentenceEnd(lastWord.text)) {
          // Don't break - absorb the orphan into this group
          // But only if we haven't hit absolute max
          if (groupLength < config.maxWords + 1) {
            shouldBreak = false;
          }
        }
      }
    }

    // Execute break
    if (shouldBreak || isLastWord) {
      groups.push(createGroup(currentGroup));
      currentGroup = [];
      if (!isLastWord) {
        groupStartTime = nextWord.start;
      }
    }
  }

  // Handle any remaining words (shouldn't happen with proper logic)
  if (currentGroup.length > 0) {
    groups.push(createGroup(currentGroup));
  }

  return groups;
}

// ============================================
// FIXED GROUPING (BACKWARD COMPATIBLE)
// ============================================

/**
 * Group words in fixed-size chunks (non-overlapping).
 * Used for specific styles or backward compatibility.
 *
 * IMPORTANT: Increments by groupSize, NOT by 1 (no sliding window).
 *
 * @param words - Array of STTWord timestamps
 * @param groupSize - Number of words per group
 * @returns Array of non-overlapping WordGroups
 */
export function groupWordsFixed(words: STTWord[], groupSize: number): WordGroup[] {
  if (words.length === 0) {
    return [];
  }

  if (groupSize < 1) {
    groupSize = 1;
  }

  const groups: WordGroup[] = [];

  for (let i = 0; i < words.length; i += groupSize) {
    const chunk = words.slice(i, i + groupSize);
    groups.push(createGroup(chunk));
  }

  return groups;
}

// ============================================
// EXPORTS
// ============================================

export const SmartGrouping = {
  groupWordsSmartly,
  groupWordsFixed,
  isSentenceEnd,
  isCommaBreak,
  isWeakBindingWord,
  WEAK_BINDING_WORDS,
};
