import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PDFEditor from './pages/PDFEditor';
import SignPage from './pages/SignPage';

function App() {
  const token = localStorage.getItem('token');
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/login" />} />
          {/* ---> NEW ROUTES ADDED HERE <--- */}
        <Route path="/editor/:docId" element={<PDFEditor />} />
        <Route path="/sign/:token" element={<SignPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
