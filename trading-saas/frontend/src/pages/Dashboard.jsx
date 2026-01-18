import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard() {
    const [signals, setSignals] = useState([]);
    const [plan, setPlan] = useState('Free');
    const [loading, setLoading] = useState(true);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);

    useEffect(() => {
        // stripe redirect check
        const query = new URLSearchParams(window.location.search);
        if (query.get('success')){
            alert('Payment done! Plan upgraded.');
            window.history.replaceState({}, '', '/dashboard');
        }
        
        fetchSignals();
    }, []); 

    const fetchSignals = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        try {
            const res = await axios.get('http://127.0.0.1:8000/signals', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSignals(res.data.data);
            setPlan(res.data.plan);
            setSubscriptionEndDate(res.data.subscription_end_date);
            setLoading(false);
        } catch (err) {
            console.log('signals fetch failed');
            window.location.href = '/';
        }
    };

    const handleUpgrade = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post('http://127.0.0.1:8000/billing/create-checkout-session', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.href = res.data.checkout_url;
        } catch (err) {
            alert('checkout failed');
        }
    };

    if (loading) return <h2>Loading...</h2>;

    return (
        <div style={{ padding: '50px', fontFamily: 'Arial' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>📈 Market Signals</h1>
                
                {plan === 'Pro' ? (
                    <span style={{ background: 'gold', padding: '10px', borderRadius: '5px', fontWeight: 'bold' }}>
                        🏆 PRO MEMBER
                    </span>
                ) : (
                    <button onClick={handleUpgrade} style={{ background: '#635bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        ⭐ Upgrade to PRO (₹499)
                    </button>
                )}
            </div>

            <h3>Status: <span style={{ color: plan === 'Pro' ? 'green' : 'orange' }}>{plan}</span></h3>

            {plan === 'Pro' && subscriptionEndDate && (
                <p style={{ fontSize: '14px', color: '#666' }}>
                    expires: {new Date(subscriptionEndDate).toLocaleDateString()}
                </p>
            )}

            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ background: '#f4f4f4' }}>
                        <th>Stock</th>
                        <th>Action</th>
                        <th>Price</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {signals.map((s) => (
                        <tr key={s.id}>
                            <td><b>{s.id}</b></td>
                            <td style={{ color: s.action === 'BUY' ? 'green' : 'red', fontWeight: 'bold' }}>{s.action}</td>
                            <td>₹{s.price}</td>
                            <td>{s.timestamp}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {plan === 'Free' && <p style={{ marginTop: '20px', color: 'gray' }}>🔒 upgrade to see all signals</p>}
        </div>
    );
}

export default Dashboard;