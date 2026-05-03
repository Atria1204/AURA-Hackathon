import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClaimPortal from './pages/ClaimPortal';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClaimPortal />} />
        <Route path="/claim" element={<ClaimPortal />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
