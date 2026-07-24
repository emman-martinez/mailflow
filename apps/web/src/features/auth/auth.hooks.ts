import { useMutation } from "@tanstack/react-query";
import { useAppDispatch } from "../../app/hooks";
import { login } from "./auth.api";
import { setAccessToken } from "./authSlice";

export function useLogin() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      dispatch(setAccessToken(data.token));
    },
  });
}
