import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Sidebar({ activeWorkspace, setActiveWorkspace }) {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/workspaces', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWorkspaces(data);
          if (data.length > 0 && !activeWorkspace) {
            setActiveWorkspace(data[0]);
          }
        }
      });
  }, [activeWorkspace, setActiveWorkspace]);

  // Click-Outside Listener to gracefully close the Profile Modal
  useEffect(() => {
    if (!showProfile) return;
    const closeDropdown = () => setShowProfile(false);
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [showProfile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div style={{
      width: '80px', height: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', 
      borderRight: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0', position: 'relative'
    }}>
      
      {/* Home / Logo */}
      <div 
        onClick={() => navigate('/')}
        style={{
          width: '50px', height: '50px', backgroundColor: '#c084fc', borderRadius: '12px',
          display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white',
          fontSize: '1.5rem', cursor: 'pointer', marginBottom: '1.5rem',
          boxShadow: '0 4px 10px rgba(192, 132, 252, 0.4)'
        }}
      >🎙️</div>

      <div style={{ width: '40px', height: '2px', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}></div>

      {/* Workspace Servers */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', alignItems: 'center', overflowY: 'auto' }}>
        {workspaces.map((ws) => {
          const isActive = activeWorkspace && activeWorkspace._id === ws._id;
          return (
            <div 
              key={ws._id}
              onClick={() => setActiveWorkspace(ws)}
              title={ws.name}
              style={{
                width: '50px', height: '50px', 
                backgroundColor: isActive ? '#c084fc' : '#334155',
                borderRadius: isActive ? '16px' : '50%',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                color: 'white', fontWeight: 'bold', fontSize: '1.2rem',
                cursor: 'pointer', transition: 'all 0.2s ease',
                border: isActive ? '2px solid white' : 'none'
              }}
            >
              {ws.name.charAt(0).toUpperCase()}
            </div>
          );
        })}
      </div>

      {/* User Profile Avatar */}
      <div 
        onClick={(e) => {
          e.stopPropagation(); // Stop click from hitting the document listener!
          setShowProfile(!showProfile);
        }}
        style={{
          width: '50px', height: '50px', backgroundColor: '#1e293b', borderRadius: '50%',
          display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#cbd5e1',
          fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', border: '2px solid rgba(255, 255, 255, 0.2)',
          marginTop: 'auto'
        }}
        title="Profile Settings"
      >
        {initial}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div 
          onClick={(e) => e.stopPropagation()} // Stop clicks inside the modal from closing it
          style={{
            position: 'absolute', bottom: '20px', left: '90px', width: '250px',
            backgroundColor: '#1e293b', borderRadius: '12px', padding: '1.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 100
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>{user.name}</h3>
          <p style={{ margin: '0 0 1.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>{user.email}</p>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;