import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import themeReducer from "../features/ui/themeSlice";
import uiReducer from "../features/ui/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
