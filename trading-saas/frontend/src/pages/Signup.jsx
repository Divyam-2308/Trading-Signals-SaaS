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

        // check passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                'https://trading-signals-saas.onrender.com/auth/signup',
                { email, password },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            alert('Signup Successful! Please login.');
            navigate('/');

        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Signup Failed! Try again.';
            alert(errorMessage);
            console.error('Signup error:', error.response || error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Trading SaaS Signup</h2>
            <form onSubmit={handleSignup} style={{ display: 'inline-block', textAlign: 'left' }}>
                <div>
                    <label>Email:</label><br />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '8px', margin: '5px 0', width: '250px' }}
                    />
                </div>
                <div>
                    <label>Password:</label><br />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '8px', margin: '5px 0', width: '250px' }}
                    />
                </div>
                <div>
                    <label>Confirm Password:</label><br />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{ padding: '8px', margin: '5px 0', width: '250px' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '10px 20px', marginTop: '10px', width: '100%' }}
                >
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
            </form>
            <p style={{ marginTop: '20px' }}>
                Already have an account? <Link to="/">Login here</Link>
            </p>
        </div>
    );
}

export default Signup;
