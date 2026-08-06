import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WardrobePage from './pages/WardrobePage';
import OutfitCreatorPage from './pages/OutfitCreatorPage';
import OutfitsPage from './pages/OutfitsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/wardrobe"
        element={
          <ProtectedRoute>
            <WardrobePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/outfits/create"
        element={
          <ProtectedRoute>
            <OutfitCreatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/outfits"
        element={
          <ProtectedRoute>
            <OutfitsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/wardrobe" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
