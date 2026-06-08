import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatAPI, ChatMessage } from '../../services/api/chatAPI';

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  loading: boolean;
  error: string | null;
  currentMessage: string;
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  loading: false,
  error: null,
  currentMessage: '',
};

// Thunks
export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    payload: { userId: string; message: string; image?: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await chatAPI.sendMessage(
        payload.userId,
        payload.message,
        payload.image
      );
      return response.reply.message;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    appendToCurrentMessage: (state, action) => {
      state.currentMessage += action.payload;
    },
    clearCurrentMessage: (state) => {
      state.currentMessage = '';
    },
    clearChat: (state) => {
      state.messages = [];
      state.currentMessage = '';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loading = true;
        state.isTyping = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.isTyping = false;
        state.currentMessage = '';
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.isTyping = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addMessage,
  setTyping,
  appendToCurrentMessage,
  clearCurrentMessage,
  clearChat,
} = chatSlice.actions;
export default chatSlice.reducer;