import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard() {
    const [signals, setSignals] = useState([]);
    const [plan, setPlan] = useState('Free');
    const [loading, setLoading] = useState(true);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        if (query.get('success')) {
            alert('Payment successful! Plan upgraded to PRO.');
            window.history.replaceState({}, '', '/dashboard');
        }
        fetchSignals();
    }, []);

    const fetchSignals = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        try {
            const res = await axios.get('https://trading-signals-saas.onrender.com/signals/', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSignals(res.data.data);
            setPlan(res.data.plan);
            setSubscriptionEndDate(res.data.subscription_end_date);
            setLoading(false);
        } catch (err) {
            console.log('signals fetch failed');
            window.location.href = '/login';
        }
    };

    const handleUpgrade = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post(
                'https://trading-signals-saas.onrender.com/billing/create-checkout-session',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            window.location.href = res.data.checkout_url;
        } catch (err) {
            alert('Checkout failed. Please try again.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    if (loading) {
        return <div className="loading">Loading signals...</div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>📈 Market Signals</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {plan === 'Pro' ? (
                        <span className="badge badge-pro">🏆 PRO</span>
                    ) : (
                        <button className="btn-upgrade" onClick={handleUpgrade}>
                            Upgrade to PRO
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#888',
                            padding: '10px 16px',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="status-bar">
                <div className="plan">
                    Plan: <span className={plan === 'Pro' ? 'pro' : 'free'}>{plan}</span>
                </div>
                {plan === 'Pro' && subscriptionEndDate && (
                    <div className="expires">
                        Expires: {new Date(subscriptionEndDate).toLocaleDateString()}
                    </div>
                )}
            </div>

            <table className="signals-table">
                <thead>
                    <tr>
                        <th>Stock</th>
                        <th>Action</th>
                        <th>Price</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {signals.map((s) => (
                        <tr key={s.id}>
                            <td className="signal-stock">{s.id}</td>
                            <td className={s.action === 'BUY' ? 'signal-buy' : 'signal-sell'}>
                                {s.action}
                            </td>
                            <td className="signal-price">₹{s.price}</td>
                            <td className="signal-time">{s.timestamp}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {plan === 'Free' && (
                <div className="upgrade-notice">
                    <p>🔒 Upgrade to PRO to unlock all trading signals</p>
                </div>
            )}
        </div>
    );
}

export default Dashboard;