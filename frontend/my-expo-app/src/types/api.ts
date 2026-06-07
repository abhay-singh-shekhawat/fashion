export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  data?: unknown;
}
