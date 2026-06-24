import { useState } from 'react';

function LoginView() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isLogin ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        window.location.href = '/'; 
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network error. Is the backend running?");
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#c084fc' }}>
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#ff6b6b', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Your Name" 
              className="glass-input" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              required 
            />
          )}
          
          <input 
            type="email" 
            placeholder="Email Address" 
            className="glass-input" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            required 
          />
          
          <input 
            type="password" 
            placeholder="Password" 
            className="glass-input" 
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            required 
          />

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{ color: '#c084fc', cursor: 'pointer', textDecoration: 'underline' }} 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Register here' : 'Login here'}
          </span>
        </p>

      </div>
    </div>
  );
}

export default LoginView;