import { Routes, Route, BrowserRouter } from 'react-router-dom';
import AuthProvider from './context/AuthContext';

// pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GenreSelection from './pages/GenreSelection';

// components
import Navbar from './components/Navbar';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/select-genres" element={<GenreSelection />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;