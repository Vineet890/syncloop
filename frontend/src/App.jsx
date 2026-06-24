import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MeetingView from './pages/MeetingView';
import LoginView from './pages/LoginView';
import Sidebar from './components/Sidebar';
import './index.css';

function ProtectedLayout({ children, activeWorkspace, setActiveWorkspace }) {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* We hand the Sidebar the ability to change the active workspace */}
      <Sidebar activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  
  // This is the Global State that connects the Sidebar and the Dashboard!
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginView />} />
        
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <ProtectedLayout activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace}>
              {/* The Dashboard needs to know what Workspace to fetch meetings for! */}
              <Dashboard activeWorkspace={activeWorkspace} />
            </ProtectedLayout> 
            : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/meeting/:id" 
          element={
            isAuthenticated ? 
            <ProtectedLayout activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace}>
              <MeetingView />
            </ProtectedLayout> 
            : <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;