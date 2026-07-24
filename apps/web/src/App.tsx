import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { ThemeToggle } from "./components/ThemeToggle";

function App() {
  return (
    <>
      <div className="fixed right-6 top-6 z-50">
        <ThemeToggle />
      </div>

      <RouterProvider router={router} />
    </>
  );
}

export default App;
