import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ activeWorkspace }) {
  const [meetings, setMeetings] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newAgenda, setNewAgenda] = useState('');
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState(null); 
  
  const navigate = useNavigate();

  // Grab the logged-in user so we can check if they are the Owner!
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!activeWorkspace) return;

    const token = localStorage.getItem('token');
    
    fetch(`http://localhost:5000/api/meetings?workspaceId=${activeWorkspace._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setMeetings(data);
      });
  }, [activeWorkspace]); 

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:5000/api/meetings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle, agenda: newAgenda, workspaceId: activeWorkspace._id }),
    });

    if (response.ok) {
      const newMeeting = await response.json();
      setMeetings([newMeeting, ...meetings]);
      setNewTitle('');
      setNewAgenda('');
    }
  };

  const handleInviteTeammate = async (e) => {
    e.preventDefault();
    setInviteMessage(null); 

    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/workspaces/invite', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ workspaceId: activeWorkspace._id, email: inviteEmail })
    });

    const data = await response.json();
    if (response.ok) {
      setInviteMessage({ type: 'success', text: "✅ " + data.message });
      setInviteEmail(''); 
      setTimeout(() => {
          setShowInviteModal(false);
          setInviteMessage(null);
      }, 2000);
    } else {
      setInviteMessage({ type: 'error', text: "❌ " + data.error });
    }
  };

  return (
    <div className="app-container">
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>{activeWorkspace ? activeWorkspace.name : 'Loading...'}</h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>Active Meetings</p>
        </div>
        
        {/* ROLE-BASED ACCESS CONTROL: Only the Owner can see the Invite Button! */}
        {activeWorkspace && user.id === activeWorkspace.ownerId && (
          <button 
            onClick={() => setShowInviteModal(true)} 
            className="btn-primary" 
            style={{ backgroundColor: '#10b981' }} 
          >
            + Invite Teammate
          </button>
        )}
      </header>
      
      {/* ROLE-BASED ACCESS CONTROL: Only the Owner can Create new Meetings! */}
      {activeWorkspace && user.id === activeWorkspace.ownerId && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#c084fc' }}>Start a New Silent Meeting</h3>
          <form onSubmit={handleCreateMeeting} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" placeholder="Meeting Title" className="glass-input" 
              value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required style={{ flex: 1 }}
            />
            <input 
              type="text" placeholder="Agenda / Topic" className="glass-input" 
              value={newAgenda} onChange={(e) => setNewAgenda(e.target.value)} required style={{ flex: 2 }}
            />
            <button type="submit" className="btn-primary">Create</button>
          </form>
        </div>
      )}

      <div className="meeting-grid">
        {meetings.map((meeting) => (
          <div key={meeting._id} className="meeting-card" onClick={() => navigate(`/meeting/${meeting._id}`)}>
            <h3>{meeting.title}</h3>
            <p>{meeting.agenda}</p>
            <div className="meeting-meta">
              <span className="status-badge">{meeting.status}</span>
              <span className="date-text">{new Date(meeting.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {meetings.length === 0 && <p>No meetings found in this workspace.</p>}
      </div>

      {showInviteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem', position: 'relative' }}>
            
            <button 
              onClick={() => { setShowInviteModal(false); setInviteMessage(null); }}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✖
            </button>
            
            <h3 style={{ marginBottom: '1.5rem', color: '#10b981', textAlign: 'center' }}>Invite a Teammate</h3>
            
            {inviteMessage && (
              <div style={{
                padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center',
                backgroundColor: inviteMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${inviteMessage.type === 'error' ? '#ef4444' : '#10b981'}`,
                color: inviteMessage.type === 'error' ? '#ef4444' : '#10b981'
              }}>
                {inviteMessage.text}
              </div>
            )}

            <form onSubmit={handleInviteTeammate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="email" 
                placeholder="Teammate's Email Address" 
                className="glass-input" 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-primary" style={{ backgroundColor: '#10b981' }}>
                Send Invite
              </button>
            </form>

          </div>
        </div>
      )}
      
    </div>
  );
}

export default Dashboard;