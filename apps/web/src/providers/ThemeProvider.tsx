import { useEffect, type PropsWithChildren } from "react";
import { useAppSelector } from "../app/hooks";

export function ThemeProvider({ children }: PropsWithChildren) {
  const theme = useAppSelector((state) => state.theme.theme);

  useEffect(() => {
    const html = document.documentElement;

    html.classList.toggle("dark", theme === "dark");
    html.style.colorScheme = theme;
  }, [theme]);

  return children;
}
