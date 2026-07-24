import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  accessToken: string | null;
};

const storageKey = "mailflow_access_token";

const initialState: AuthState = {
  accessToken: sessionStorage.getItem(storageKey),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      sessionStorage.setItem(storageKey, action.payload);
    },
    logout: (state) => {
      state.accessToken = null;
      sessionStorage.removeItem(storageKey);
    },
  },
});

export const { setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
