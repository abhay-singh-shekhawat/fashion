import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  suggestionAPI,
  DailyRecommendation,
  OccasionSuggestion,
  ShoppingAdvice,
} from '../../services/api/suggestionAPI';

export interface SuggestionState {
  dailyRecommendation: DailyRecommendation | null;
  occasionSuggestions: OccasionSuggestion | null;
  shoppingAdvice: ShoppingAdvice | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: SuggestionState = {
  dailyRecommendation: null,
  occasionSuggestions: null,
  shoppingAdvice: null,
  loading: false,
  error: null,
  lastFetched: null,
};

// Thunks
export const fetchDailyRecommendation = createAsyncThunk(
  'suggestion/fetchDailyRecommendation',
  async (_, { rejectWithValue }) => {
    try {
      const recommendation = await suggestionAPI.getDailyRecommendations();
      return recommendation;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOccasionSuggestions = createAsyncThunk(
  'suggestion/fetchOccasionSuggestions',
  async (occasion: string, { rejectWithValue }) => {
    try {
      const suggestions = await suggestionAPI.getOccasionSuggestions(occasion);
      return suggestions;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchShoppingAdvice = createAsyncThunk(
  'suggestion/fetchShoppingAdvice',
  async (_, { rejectWithValue }) => {
    try {
      const advice = await suggestionAPI.getShoppingSuggestions();
      return advice;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const suggestionSlice = createSlice({
  name: 'suggestion',
  initialState,
  reducers: {
    clearSuggestions: (state) => {
      state.dailyRecommendation = null;
      state.occasionSuggestions = null;
    },
  },
  extraReducers: (builder) => {
    // Daily Recommendation
    builder
      .addCase(fetchDailyRecommendation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyRecommendation.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyRecommendation = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchDailyRecommendation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Occasion Suggestions
    builder
      .addCase(fetchOccasionSuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOccasionSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.occasionSuggestions = action.payload;
      })
      .addCase(fetchOccasionSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Shopping Advice
    builder
      .addCase(fetchShoppingAdvice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShoppingAdvice.fulfilled, (state, action) => {
        state.loading = false;
        state.shoppingAdvice = action.payload;
      })
      .addCase(fetchShoppingAdvice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSuggestions } = suggestionSlice.actions;
export default suggestionSlice.reducer;