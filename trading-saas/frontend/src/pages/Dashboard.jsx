import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard() {
    const [signals, setSignals] = useState([]);
    const [plan, setPlan] = useState('Free');
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const query = new URLSearchParams(window.location.search);
        if (query.get('success')){
            alert('Payment Successful! Your plan has been upgraded.');
        }
        
        fetchSignals();
    }, []); 

    const fetchSignals = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get('http://127.0.0.1:8000/signals', {
                headers: {Authorization: `Bearer ${token}`}
        });

        setSignals(response.data.data);
        setPlan(response.data.plan);
        setLoading(false);
    } catch (error) {
        alert('Session expired. Please login again.');
        window.location.href = '/';
    }
};

    const handleUpgrade = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post('http://127.0.0.1:8000/billing/create-checkout-session', {}, {
        headers: { Authorization: `Bearer ${token}` }
        });

        window.location.href = response.data.checkout_url;
        } catch (error) {
        alert('Error creating checkout session.');
        }
    };

    if (loading) return <h2>Loading Market Data...</h2>;

    return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>📈 Market Signals</h1>
        
        {/* SHOW BADGE BASED ON PLAN */}
        {plan === 'PRO' ? (
          <span style={{ background: 'gold', padding: '10px', borderRadius: '5px', fontWeight: 'bold' }}>
            🏆 PRO MEMBER
          </span>
        ) : (
          <button 
            onClick={handleUpgrade}
            style={{ background: '#635bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            ⭐ Upgrade to PRO (₹499)
          </button>
        )}
      </div>

      <h3>Current Status: <span style={{ color: plan === 'PRO' ? 'green' : 'orange' }}>{plan} PLAN</span></h3>

      {/* SIGNALS TABLE */}
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
          {signals.map((signal) => (
            <tr key={signal.id}>
              <td><b>{signal.id}</b></td>
              <td style={{ color: signal.action === 'BUY' ? 'green' : 'red', fontWeight: 'bold' }}>
                {signal.action}
              </td>
              <td>₹{signal.price}</td>
              <td>{signal.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {plan === 'FREE' && (
        <p style={{ marginTop: '20px', color: 'gray', fontStyle: 'italic' }}>
          🔒 You are viewing limited data. Upgrade to see all 10 signals.
        </p>
      )}
    </div>
  );
}

export default Dashboard;