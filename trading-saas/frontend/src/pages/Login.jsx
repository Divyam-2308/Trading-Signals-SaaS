import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // backend uses oauth2 so we need formdata not json
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(
        'https://trading-signals-saas.onrender.com/auth/login',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // save token for later api calls
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login Failed! Check credentials.';
      alert(errorMessage);
      console.error('Login error:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to access your signals</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;