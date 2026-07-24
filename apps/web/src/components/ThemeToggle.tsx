import { Moon, Sun } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setTheme } from "../features/ui/themeSlice";

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.theme);

  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      onClick={() => dispatch(setTheme(nextTheme))}
      title={`Switch to ${nextTheme} mode`}
      type="button"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
