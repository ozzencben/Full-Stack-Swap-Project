import { Toaster } from "sonner";
import AuthProvider from "../context/auth/AuthProvider";
import AppRoute from "../routes/AppRoute";

function App() {
  return (
    <AuthProvider>
      <AppRoute />
      <Toaster
        position="top-right"
        richColors
        expand
        toastOptions={{
          style: {
            fontFamily: "Montserrat, sans-serif",
            borderRadius: "10px",
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #333",
          },
          className: "swapify-toast",
        }}
      />
    </AuthProvider>
  );
}

export default App;
