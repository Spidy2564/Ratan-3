import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.login(credentials);
      localStorage.setItem('adminToken', response.data.token);
      navigate('/admin/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleQuickLogin = async () => {
    setLoading(true);
    setError('');
    
    // Set admin credentials
    const adminCredentials = { username: 'admin', password: 'admin123' };
    setCredentials(adminCredentials);
    
    try {
      const response = await adminAPI.login(adminCredentials);
      localStorage.setItem('adminToken', response.data.token);
      navigate('/admin/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="card" style={{ width: '400px', margin: '0' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: '#3b82f6', marginBottom: '8px' }}>Trust Wallet Admin</h1>
          <p style={{ color: '#6b7280' }}>Access your dashboard</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginBottom: '12px' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Quick Login Button */}
        <button 
          type="button" 
          className="btn btn-success" 
          onClick={handleQuickLogin}
          disabled={loading}
          style={{ 
            width: '100%', 
            marginBottom: '16px',
            background: '#10b981',
            borderColor: '#10b981'
          }}
        >
          {loading ? '⚡ Quick Logging in...' : '⚡ Quick Login as Admin'}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
