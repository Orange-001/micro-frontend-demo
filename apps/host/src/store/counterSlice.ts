import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type CounterState = {
  value: number;
};

const initialState: CounterState = {
  value: 0
};

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment(state) {
      state.value += 1;
    },
    add(state, action: PayloadAction<number>) {
      state.value += action.payload;
    }
  }
});

export const { increment, add } = counterSlice.actions;
export const counterReducer = counterSlice.reducer;

