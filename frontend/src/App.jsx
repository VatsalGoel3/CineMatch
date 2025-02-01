import { Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthContext';

// pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GenreSelection from './pages/GenreSelection';
import SwipePage from './pages/SwipePage';
import CineTracker from './pages/CineTracker';
import Profile from './pages/Profile';

// components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route
          path="/select-genres"
          element={
            <PrivateRoute>
              <GenreSelection />
            </PrivateRoute>
          }
        />
        <Route
          path="/swipe"
          element={
            <PrivateRoute>
              <SwipePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tracker"
          element={
            <PrivateRoute>
              <CineTracker />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;