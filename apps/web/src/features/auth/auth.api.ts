import { apiClient } from "../../lib/api/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
};

type LoginResponse = {
  user: AuthUser;
  token: string;
};

export async function login(input: { email: string; password: string }) {
  const { data } = await apiClient.post<LoginResponse>(
    "/api/auth/login",
    input,
  );

  return data;
}
