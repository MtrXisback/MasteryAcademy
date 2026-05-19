import { User } from './auth.model';

export interface ChatMessage {
  id?: number;
  sender: User;
  recipient: User;
  content: string;
  timestamp: string;
  read: boolean;
  courseId?: number;
}

export interface MessageRequest {
  recipientId: number;
  content: string;
  courseId?: number;
}
