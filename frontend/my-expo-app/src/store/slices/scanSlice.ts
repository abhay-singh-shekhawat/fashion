import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { scanAPI, ScanResult, DetectedItem } from '../../services/api/scanAPI';

export interface ScanState {
  isScanning: boolean;
  progress: number;
  progressMessage: string;
  detectedItems: DetectedItem[];
  scanResult: ScanResult | null;
  jobId: string | null;
  error: string | null;
  imageUrl: string | null;
}

const initialState: ScanState = {
  isScanning: false,
  progress: 0,
  progressMessage: '',
  detectedItems: [],
  scanResult: null,
  jobId: null,
  error: null,
  imageUrl: null,
};

// Thunks
export const performScan = createAsyncThunk(
  'scan/performScan',
  async (imageFile: any, { rejectWithValue }) => {
    try {
      const result = await scanAPI.scanOutfit(imageFile);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    startScan: (state) => {
      state.isScanning = true;
      state.progress = 0;
      state.progressMessage = 'Starting scan...';
      state.error = null;
    },
    updateProgress: (state, action) => {
      state.progress = action.payload.progress;
      state.progressMessage = action.payload.message;
    },
    setScanResults: (state, action) => {
      state.detectedItems = action.payload;
    },
    setScanError: (state, action) => {
      state.error = action.payload;
      state.isScanning = false;
    },
    resetScan: (state) => {
      state.isScanning = false;
      state.progress = 0;
      state.progressMessage = '';
      state.detectedItems = [];
      state.error = null;
      state.jobId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(performScan.pending, (state) => {
        state.isScanning = true;
        state.error = null;
        state.progress = 10;
        state.progressMessage = 'Uploading image...';
      })
      .addCase(performScan.fulfilled, (state, action) => {
        state.isScanning = true;
        state.scanResult = action.payload;
        state.jobId = action.payload.jobId;
        state.imageUrl = action.payload.uploadedImageUrl;
        state.progress = 50;
        state.progressMessage = 'Processing image...';
      })
      .addCase(performScan.rejected, (state, action) => {
        state.isScanning = false;
        state.error = action.payload as string;
        state.progress = 0;
      });
  },
});

export const {
  startScan,
  updateProgress,
  setScanResults,
  setScanError,
  resetScan,
} = scanSlice.actions;
export default scanSlice.reducer;