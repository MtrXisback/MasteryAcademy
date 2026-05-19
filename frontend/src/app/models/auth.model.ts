export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
  xp: number;
  level: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  xp: number;
  level: number;
}
