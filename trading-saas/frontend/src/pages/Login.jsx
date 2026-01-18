import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // backend expects form data for oauth2
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(
        'https://trading-signals-saas.onrender.com/auth/login',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // store the token so we can use it later for authenticated requests
      localStorage.setItem('token', response.data.access_token);

      // all good, redirect to dashboard
      alert('Login Successful!');
      navigate('/dashboard');

    } catch (error) {
      // show backend error message if available
      const errorMessage = error.response?.data?.detail || 'Login Failed! Check credentials.';
      alert(errorMessage);
      console.error('Login error:', error.response || error);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>Trading SaaS Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'left' }}>
        <div>
          <label>Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '8px', margin: '5px 0' }}
          />
        </div>
        <div>
          <label>Password:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '8px', margin: '5px 0' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', marginTop: '10px' }}>
          Login
        </button>
      </form>
      <p style={{ marginTop: '20px' }}>
        Don't have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </div>
  );
}

export default Login;