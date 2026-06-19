import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PDFEditor from './pages/PDFEditor';
import SignPage from './pages/SignPage';

// A cleaner, dynamic wrapper to handle route guarding
const ProtectedElement = ({ element: Element }) => {
  const token = localStorage.getItem('token');
  return token ? <Element /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedElement element={Dashboard} />} />
        <Route path="/editor/:docId" element={<ProtectedElement element={PDFEditor} />} />
        <Route path="/sign/:token" element={<ProtectedElement element={SignPage} />} />
        
        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
