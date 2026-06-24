import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ activeWorkspace }) {
  const [meetings, setMeetings] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newAgenda, setNewAgenda] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="app-container">
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem' }}>{activeWorkspace ? activeWorkspace.name : 'Loading...'}</h2>
        <p style={{ color: '#94a3b8' }}>Active Meetings</p>
      </header>
      
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
        {meetings.length === 0 && <p>No meetings found in this workspace. Create one above!</p>}
      </div>
    </div>
  );
}

export default Dashboard;