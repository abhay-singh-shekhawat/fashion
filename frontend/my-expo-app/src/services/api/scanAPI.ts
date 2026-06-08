import { apiClient } from './apiClient';

export interface DetectedItem {
  name: string;
  color: string;
  category: string;
  confidence: number;
  formality?: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  jobId: string;
  uploadedImageUrl: string;
  publicId: string;
  note?: string;
}

export interface ScanProgress {
  percent: number;
  message: string;
  items?: DetectedItem[];
  colors?: string[];
}

class ScanAPI {
  async scanOutfit(imageFile: any): Promise<ScanResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await apiClient.post<ScanResult>(
        '/scan/outfit',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to scan outfit';
      throw new Error(message);
    }
  }

  async getScanProgress(jobId: string): Promise<ScanProgress> {
    try {
      const response = await apiClient.get<ScanProgress>(
        `/scan/progress/${jobId}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to get scan progress';
      throw new Error(message);
    }
  }
}

export const scanAPI = new ScanAPI();