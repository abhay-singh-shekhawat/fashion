import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wardrobeAPI, ClothingItem, AddItemRequest } from '../../services/api/wardrobeAPI';

export interface WardrobeState {
  items: ClothingItem[];
  selectedItem: ClothingItem | null;
  loading: boolean;
  error: string | null;
  itemCount: number;
}

const initialState: WardrobeState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
  itemCount: 0,
};

// Thunks
export const fetchWardrobe = createAsyncThunk(
  'wardrobe/fetchWardrobe',
  async (_, { rejectWithValue }) => {
    try {
      const items = await wardrobeAPI.getWardrobe();
      return items;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addClothingItem = createAsyncThunk(
  'wardrobe/addClothingItem',
  async (data: AddItemRequest, { rejectWithValue }) => {
    try {
      const item = await wardrobeAPI.addItem(data);
      return item;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteClothingItem = createAsyncThunk(
  'wardrobe/deleteClothingItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      await wardrobeAPI.deleteItem(itemId);
      return itemId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const wardrobeSlice = createSlice({
  name: 'wardrobe',
  initialState,
  reducers: {
    selectItem: (state, action) => {
      state.selectedItem = action.payload;
    },
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Wardrobe
    builder
      .addCase(fetchWardrobe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWardrobe.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.itemCount = action.payload.length;
      })
      .addCase(fetchWardrobe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add Item
    builder
      .addCase(addClothingItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addClothingItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        state.itemCount = state.items.length;
      })
      .addCase(addClothingItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Item
    builder
      .addCase(deleteClothingItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClothingItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item._id !== action.payload);
        state.itemCount = state.items.length;
      })
      .addCase(deleteClothingItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectItem, clearSelectedItem } = wardrobeSlice.actions;
export default wardrobeSlice.reducer;