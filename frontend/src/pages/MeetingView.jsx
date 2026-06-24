import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VideoRecorder from '../components/VideoRecorder';
import { io } from 'socket.io-client';

// Connect to our new Backend WebSocket server!
const socket = io('http://localhost:5000');

function MeetingView() {
  const { id } = useParams(); 
  const [meeting, setMeeting] = useState(null);
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    // Grab the VIP Wristband from the browser's vault
    const token = localStorage.getItem('token');

    // 1. Fetch the specific meeting details
    fetch(`http://localhost:5000/api/meetings/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((response) => response.json())
      .then((data) => setMeeting(data));

    // 2. Fetch all the video replies for this meeting
    fetch(`http://localhost:5000/api/replies/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((response) => response.json())
      .then((data) => {
          if (Array.isArray(data)) {
              setReplies(data);
          }
      });
      
    // --- WEBSOCKET REAL-TIME MAGIC ---
    // Tell the backend Waiter to put us in the specific room for this Meeting ID
    socket.emit('joinMeeting', id);

    // Keep an ear open for any 'newReply' blasts from the server
    socket.on('newReply', (newVideoReply) => {
      setReplies((previousReplies) => [newVideoReply, ...previousReplies]);
    });

    // Cleanup: Stop listening when we navigate away from the page
    return () => {
      socket.off('newReply');
    };
  }, [id]);

  if (!meeting) return <div className="app-container"><p>Loading...</p></div>;

  return (
    <div className="meeting-view">
      <div className="meeting-header">
        <h2>{meeting.title}</h2>
        <p className="agenda-text">{meeting.agenda}</p>
        <span className="status-badge">{meeting.status}</span>
      </div>

      <div className="meeting-content">
        <div className="video-thread-section">
          
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <VideoRecorder meetingId={id} />
          </div>

          <h3>Video Thread ({replies.length} Replies)</h3>
          
          <div className="replies-list">
            {replies.map((reply) => (
              <div key={reply._id} className="glass-panel" style={{ marginBottom: '1rem' }}>
                <video 
                  src={reply.videoUrl} 
                  controls 
                  style={{ width: '100%', borderRadius: '8px' }}
                />
                
                {/* Paint the Groq AI Summary if it exists! */}
                {reply.transcript && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(192, 132, 252, 0.1)', borderRadius: '8px', borderLeft: '3px solid #c084fc' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#c084fc' }}>✨ AI Summary</h4>
                    <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                      {reply.transcript}
                    </p>
                  </div>
                )}

                <p className="date-text" style={{ marginTop: '0.5rem' }}>
                  Posted on {new Date(reply.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            
            {replies.length === 0 && <p>No replies yet. Be the first to record one!</p>}
          </div>

        </div>

        <div className="ai-summary-sidebar">
          <h3>✨ Meeting Overview</h3>
          <div className="glass-panel">
            <p><strong>Status:</strong> Tracking asynchronously...</p>
            <p><strong>Note:</strong> Video-specific AI summaries now appear directly beneath each video in the thread!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingView;