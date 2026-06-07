import { useCallback, useState } from 'react';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (apiFunction: () => Promise<any>, options?: UseApiOptions) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFunction();
        options?.onSuccess?.(response);
        return response;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
        setError(errorMessage);
        options?.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    request,
  };
};
