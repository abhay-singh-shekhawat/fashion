import { createSlice } from '@reduxjs/toolkit';

interface AppState {
  isDarkMode: boolean;
  isOnline: boolean;
  appLoading: boolean;
}

const initialState: AppState = {
  isDarkMode: false,
  isOnline: true,
  appLoading: true,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setDarkMode: (state, action) => {
      state.isDarkMode = action.payload;
    },
    setOnline: (state, action) => {
      state.isOnline = action.payload;
    },
    setAppLoading: (state, action) => {
      state.appLoading = action.payload;
    },
  },
});

export const { setDarkMode, setOnline, setAppLoading } = appSlice.actions;
export default appSlice.reducer;
