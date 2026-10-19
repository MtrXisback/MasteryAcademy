import { Category } from './category.model';
import { Module } from './course-content.model';

export interface Course {
  id?: number;
  title: string;
  description: string;
  instructor: any;
  price: number;
  category?: Category;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  duration?: number;
  imageUrl?: string;
  modules?: Module[];
  createdAt?: string;
  updatedAt?: string;
  version?: number; // bloqueo optimista: se reenvía en cada actualización
}
