export interface Word {
  id: string;
  word: string;
  meaning: string;
  sentences: string[];
  day: string;
}

export interface Question {
  id: number;
  word: string;
  question: string;
  choices: string[];
  answer: number;
  sentenceIndex: number;
}

export interface Test {
  testId: string;
  days: string[];
  mode: 'day_select' | 'unasked';
  questions: Question[];
  createdAt: string;
}

export interface TestResult {
  studentId: string;
  testId: string;
  answers: number[];
  score: number;
  wrongWords: string[];
  createdAt: string;
}

export interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
}
