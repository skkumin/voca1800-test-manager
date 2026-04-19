import { describe, it, expect } from 'vitest';
import { blankWord, shuffleChoices } from './generateQuestions';

describe('generateQuestions', () => {
  describe('blankWord', () => {
    it('should replace word with blank (case-insensitive)', () => {
      const sentence = "The drink would quench the local population's thirst.";
      const result = blankWord(sentence, 'thirst');
      expect(result).toBe("The drink would quench the local population's _____.");
    });

    it('should not replace partial matches', () => {
      const sentence = "We thirst for retribution.";
      const result = blankWord(sentence, 'thirst');
      expect(result).toBe("We _____ for retribution.");
    });

    it('should ignore case', () => {
      const sentence = "We THIRST for retribution.";
      const result = blankWord(sentence, 'thirst');
      expect(result).toBe("We _____ for retribution.");
    });
  });

  describe('shuffleChoices', () => {
    it('should return 5 choices with correct answer', () => {
      const wrongWords = [
        { id: '1', word: 'word1', meaning: 'meaning1', sentences: [], day: 'DAY1' },
        { id: '2', word: 'word2', meaning: 'meaning2', sentences: [], day: 'DAY1' },
        { id: '3', word: 'word3', meaning: 'meaning3', sentences: [], day: 'DAY1' },
        { id: '4', word: 'word4', meaning: 'meaning4', sentences: [], day: 'DAY1' }
      ];
      const result = shuffleChoices('thirst', wrongWords);

      expect(result.choices.length).toBe(5);
      expect(result.choices).toContain('thirst');
      expect(result.answer >= 0 && result.answer < 5).toBe(true);
      expect(result.choices[result.answer]).toBe('thirst');
    });
  });
});
