import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function MeetingView() {
  const { id } = useParams(); 
  const [meeting, setMeeting] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/meetings/${id}`)
      .then((response) => response.json())
      .then((data) => setMeeting(data))
      .catch((error) => console.error("Error:", error));
  }, [id]);

  if (!meeting) return <div className="app-container"><p>Loading meeting details...</p></div>;

  return (
    <div className="meeting-view">
      <div className="meeting-header">
        <h2>{meeting.title}</h2>
        <p className="agenda-text">{meeting.agenda}</p>
        <span className="status-badge">{meeting.status}</span>
      </div>

      <div className="meeting-content">
        
        <div className="video-thread-section">
          <h3>Video Replies</h3>
          <div className="glass-panel">
            <p>Video player and threads will go here...</p>
          </div>
        </div>

        <div className="ai-summary-sidebar">
          <h3>✨ AI Summary</h3>
          <div className="glass-panel">
            <p><strong>Decisions:</strong> Pending...</p>
            <p><strong>Action Items:</strong> Waiting for videos...</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default MeetingView;