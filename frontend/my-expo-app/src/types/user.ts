export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
