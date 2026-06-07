import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileAPI } from '../../services/api/profileAPI';
import { Gender, SkinTone, UpdateProfileRequest } from '../../types/profile';

export interface Profile {
  _id: string;
  userId: string;
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  skinTone: SkinTone;
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  profile: Profile | null;
  userId: string | null;
  loading: boolean;
  error: string | null;
  hasCompletedProfile: boolean;
}

const initialState: UserState = {
  profile: null,
  userId: null,
  loading: false,
  error: null,
  hasCompletedProfile: false,
};

// Thunks
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await profileAPI.getProfile();
      return profile;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch profile'
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (
    payload: UpdateProfileRequest,
    { rejectWithValue }
  ) => {
    try {
      const profile = await profileAPI.updateProfile(payload);
      return profile;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.userId = null;
      state.hasCompletedProfile = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.hasCompletedProfile = true;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.hasCompletedProfile = false;
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.hasCompletedProfile = true;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUserId, clearProfile } = userSlice.actions;
export default userSlice.reducer;