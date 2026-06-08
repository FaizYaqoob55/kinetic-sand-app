// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import tableReducer from './tableSlice';
import patternReducer from './patternSlice';

export const store = configureStore({
  reducer: {
    table: tableReducer,
    pattern: patternReducer,
  },
});

export default store;
