export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const headers = {
    ...options.headers,
  };
  
  // Only set Content-Type to application/json if it's not FormData (for video uploads)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
  }

  // Inject token if it exists
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle token expiration globally — but not on auth endpoints (login/register)
      const isAuthEndpoint = endpoint.startsWith('/api/auth');
      if (!isAuthEndpoint && (response.status === 401 || response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return response; // Stop execution
      }

      return response;
  } catch (err) {
      console.error("API Fetch Error:", err);
      throw err;
  }
};
