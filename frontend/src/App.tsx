import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WardrobePage from './pages/WardrobePage';
import OutfitCreatorPage from './pages/OutfitCreatorPage';
import OutfitsPage from './pages/OutfitsPage';
import PrivacyPage from './pages/PrivacyPage';
import ImprintPage from './pages/ImprintPage';

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
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/imprint" element={<ImprintPage />} />
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
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
