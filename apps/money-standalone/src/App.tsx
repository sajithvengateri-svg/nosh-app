import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import MoneyLayout from "@/components/layout/MoneyLayout";
import Login from "@/pages/Login";
import ReactorDashboard from "@/pages/ReactorDashboard";
import MoneyPnL from "@/pages/MoneyPnL";
import MoneyTrends from "@/pages/MoneyTrends";
import MoneySettings from "@/pages/MoneySettings";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<MoneyLayout />}>
              <Route path="/" element={<Navigate to="/reactor" replace />} />
              <Route path="/reactor" element={<ReactorDashboard />} />
              <Route path="/pnl" element={<MoneyPnL />} />
              <Route path="/trends" element={<MoneyTrends />} />
              <Route path="/settings" element={<MoneySettings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
