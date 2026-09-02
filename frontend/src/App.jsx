import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rewards from "./pages/Rewards";
import AppLayout from "./components/layout/AppLayout";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import ComingSoon from "./pages/ComingSoon";
import Sales from "./pages/Sales";
import Points from "./pages/Points";
import Reports from "./pages/Reports";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/recompensas"
          element={
            <Protected>
              <Rewards />
            </Protected>
          }
        />
        <Route
          path="/clientes"
          element={
            <Protected>
              <Customers />
            </Protected>
          }
        />
        <Route
          path="/clientes/:id"
          element={
            <Protected>
              <CustomerDetail />
            </Protected>
          }
        />
        <Route
          path="/vendas"
          element={
            <Protected>
              <Sales />
            </Protected>
          }
        />
        <Route
          path="/pontos"
          element={
            <Protected>
              <Points />
            </Protected>
          }
        />
        <Route
          path="/relatorios"
          element={
            <Protected>
              <Reports />
            </Protected>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
