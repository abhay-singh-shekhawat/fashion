import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileAPI, UserProgress, Achievement } from '../../services/api/profileAPI';

export interface ProgressState {
  points: number;
  level: number;
  totalScans: number;
  totalOutfitsRated: number;
  achievements: Achievement[];
  currentStreak: number;
  nextLevelPoints: number;
  loading: boolean;
  error: string | null;
}

const initialState: ProgressState = {
  points: 0,
  level: 1,
  totalScans: 0,
  totalOutfitsRated: 0,
  achievements: [],
  currentStreak: 0,
  nextLevelPoints: 100,
  loading: false,
  error: null,
};

// Thunks
export const fetchUserProgress = createAsyncThunk(
  'progress/fetchUserProgress',
  async (_, { rejectWithValue }) => {
    try {
      const progress = await profileAPI.getUserProgress();
      return progress;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAchievements = createAsyncThunk(
  'progress/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const achievements = await profileAPI.getAchievements();
      return achievements;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    addPoints: (state, action) => {
      state.points += action.payload;
      // Check for level up
      if (state.points >= state.nextLevelPoints) {
        state.level += 1;
        state.nextLevelPoints = state.level * 100;
      }
    },
    incrementScan: (state) => {
      state.totalScans += 1;
    },
    incrementOutfitRated: (state) => {
      state.totalOutfitsRated += 1;
    },
    updateStreak: (state, action) => {
      state.currentStreak = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Progress
    builder
      .addCase(fetchUserProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.points = action.payload.points;
        state.level = action.payload.level;
        state.totalScans = action.payload.totalScans;
        state.totalOutfitsRated = action.payload.totalOutfitsRated;
        state.currentStreak = action.payload.currentStreak;
        state.nextLevelPoints = action.payload.level * 100;
      })
      .addCase(fetchUserProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Achievements
    builder
      .addCase(fetchAchievements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.loading = false;
        state.achievements = action.payload;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addPoints,
  incrementScan,
  incrementOutfitRated,
  updateStreak,
} = progressSlice.actions;
export default progressSlice.reducer;