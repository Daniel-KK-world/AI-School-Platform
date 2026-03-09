// Change the first line to include "-dom"
import { RouterProvider } from "react-router-dom"; 
import { router } from "./routes.tsx";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}