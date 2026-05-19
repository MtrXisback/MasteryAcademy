export interface Lesson {
  id?: number;
  title: string;
  description: string;
  contentUrl: string;
  orderIndex: number;
  isExercise?: boolean;
  exerciseQuestion?: string;
  exerciseOptions?: string;
  correctOptionIndex?: number;
}

export interface Module {
  id?: number;
  name: string;
  orderIndex: number;
  lessons: Lesson[];
}
