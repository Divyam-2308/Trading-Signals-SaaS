import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                'https://trading-signals-saas.onrender.com/auth/signup',
                { email, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            alert('Signup Successful! Please login.');
            navigate('/login');
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Signup Failed! Try again.';
            alert(errorMessage);
            console.error('Signup error:', error.response || error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Create Account</h2>
                <p className="subtitle">Start trading with real-time signals</p>

                <form onSubmit={handleSignup}>
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

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

export default Signup;
