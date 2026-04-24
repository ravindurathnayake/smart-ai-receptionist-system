import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import './AdminLogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await apiService.login(username, password);
      if (response.user) {
        // Store token in localStorage
        localStorage.setItem('admin_token', response.user.token);
        localStorage.setItem('admin_user', JSON.stringify(response.user));
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header flex flex-col items-center">
          <Logo size="lg" className="mb-6" />
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
