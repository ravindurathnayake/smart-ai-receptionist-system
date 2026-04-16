import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Mock Verification Logic
    if (username.trim() && password.trim()) {
      // For demonstration, any non-empty input is "verified"
      navigate('/admin');
    } else {
      setError('Please enter valid credentials.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img 
            src="https://lh3.googleusercontent.com/aida/ADBb0ujXwF6C1p4tSb8vEq_Vmwl_53J0InGaheovhXLH7KGxUAskWVzcmzRsAs4hNU6BDpnzzgqIddtDEE2uKDp7voQktbfUaXQqNCZbJy-zXfZepWAjM1L0U9AF10_W9r1H4ZajR8yZC60FtPSzwt4s6LU5DYKM4PuwSNmLqlHjnd1GpTrYwyE43IkdQkjzasfMPYu577RrcaQ7m44ZjDXHlFvqJh3bkIFwJbJEfn-rtsmpCtyZlecRtVcsOJwJGz1hb3L15Gl0yN9F_Q" 
            alt="MediAssist AI Logo" 
            className="login-logo"
          />
          <h1 className="login-title">Admin Console</h1>
          <p className="login-subtitle">Sign in to manage hospital operations.</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && (
            <div className="error-message">
              <span className="material-symbols-rounded">error</span>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Username</label>
            <div className="input-field-wrapper">
              <span className="material-symbols-rounded input-icon">person</span>
              <input 
                type="text" 
                className="login-input" 
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-field-wrapper">
              <span className="material-symbols-rounded input-icon">lock</span>
              <input 
                type="password" 
                className="login-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="login-button">
            Login to Console
            <span className="material-symbols-rounded">arrow_forward</span>
          </button>
        </form>

        <div className="back-link">
          <button onClick={() => navigate('/')} className="back-button">
            <span className="material-symbols-rounded">chevron_left</span>
            Back to Kiosk
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
