import { describe, it, expect } from 'vitest';
import { blankWord, shuffleChoices } from './generateQuestions';
import { WordQuestion } from './types';

describe('generateQuestions', () => {
  describe('blankWord', () => {
    it('should replace word using pre-computed indices', () => {
      const q: WordQuestion = {
        original: "The drink would quench the local population's thirst.",
        blank_word: 'thirst',
        start: 46,
        end: 52,
        suitability: 'High',
      };
      expect(blankWord(q)).toBe("The drink would quench the local population's _____.");
    });

    it('should handle inflected forms via exact indices', () => {
      const q: WordQuestion = {
        original: 'The cultural diversity that enriches our community.',
        blank_word: 'enriches',
        start: 28,
        end: 36,
        suitability: 'High',
      };
      expect(blankWord(q)).toBe('The cultural diversity that _____ our community.');
    });

    it('should work for word at start of sentence', () => {
      const q: WordQuestion = {
        original: 'Designers emphasize experimentation.',
        blank_word: 'emphasize',
        start: 10,
        end: 19,
        suitability: 'High',
      };
      expect(blankWord(q)).toBe('Designers _____ experimentation.');
    });
  });

  describe('shuffleChoices', () => {
    it('should return 5 choices with correct answer', () => {
      const wrongWords = [
        { id: '1', word: 'word1', meaning: null, questions: [], day: 'DAY 01' },
        { id: '2', word: 'word2', meaning: null, questions: [], day: 'DAY 01' },
        { id: '3', word: 'word3', meaning: null, questions: [], day: 'DAY 01' },
        { id: '4', word: 'word4', meaning: null, questions: [], day: 'DAY 01' }
      ];
      const result = shuffleChoices('thirst', wrongWords);

      expect(result.choices.length).toBe(5);
      expect(result.choices).toContain('thirst');
      expect(result.answer >= 0 && result.answer < 5).toBe(true);
      expect(result.choices[result.answer]).toBe('thirst');
    });
  });
});
