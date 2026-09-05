export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Target {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nameZh: string;
  nameEn: string;
  scientificName: string;
}

export interface Question {
  id: string;
  filename: string;
  image: string;
  difficulty: Difficulty;
  sourceWidth: number;
  sourceHeight: number;
  targets: Target[];
}

export interface RoundResult {
  question: Question;
  found: number;
  totalTargets: number;
  foundTargetIds: string[];
  remainingSeconds: number;
  wrongClicks: number;
  score: number;
  completed: boolean;
}
