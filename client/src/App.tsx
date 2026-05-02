import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Workout } from "./pages/Workout";
import { History } from "./pages/History";
import { SessionDetail } from "./pages/SessionDetail";
import { ExerciseDetail } from "./pages/ExerciseDetail";
import { Settings } from "./pages/Settings";
import { BadDay } from "./pages/BadDay";
import { AdjustWorkout } from "./pages/AdjustWorkout";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-text-mute">…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout/:id"
          element={
            <ProtectedRoute>
              <Workout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions/:id"
          element={
            <ProtectedRoute>
              <SessionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercise/:idOrSlug"
          element={
            <ProtectedRoute>
              <ExerciseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bad-day"
          element={
            <ProtectedRoute>
              <BadDay />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adjust"
          element={
            <ProtectedRoute>
              <AdjustWorkout />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
