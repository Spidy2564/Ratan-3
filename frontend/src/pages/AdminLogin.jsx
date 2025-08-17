import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ username: 'admin', password: 'admin123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
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
    setDebugInfo('');

    try {
      console.log('🔐 Attempting login with:', credentials);
      setDebugInfo('Sending login request...');
      
      const response = await adminAPI.login(credentials);
      console.log('✅ Login successful:', response.data);
      
      localStorage.setItem('adminToken', response.data.token);
      setDebugInfo('Login successful! Redirecting...');
      
      // Small delay to show success message
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed';
      let debugMessage = '';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = `Server error: ${error.response.data?.message || error.response.statusText}`;
        debugMessage = `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your internet connection and try again.';
        debugMessage = 'Request sent but no response received. Check if backend is running.';
      } else {
        // Something else happened
        errorMessage = `Login failed: ${error.message || 'Unknown error occurred'}`;
        debugMessage = `Error type: ${error.name}, Message: ${error.message}`;
      }
      
      setError(errorMessage);
      setDebugInfo(debugMessage);
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
    setDebugInfo('');
    
    // Set admin credentials
    const adminCredentials = { username: 'admin', password: 'admin123' };
    setCredentials(adminCredentials);
    
    try {
      console.log('⚡ Quick login with:', adminCredentials);
      setDebugInfo('Quick login in progress...');
      
      const response = await adminAPI.login(adminCredentials);
      console.log('✅ Quick login successful:', response.data);
      
      localStorage.setItem('adminToken', response.data.token);
      setDebugInfo('Quick login successful! Redirecting...');
      
      // Small delay to show success message
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Quick login error:', error);
      
      let errorMessage = 'Quick login failed';
      let debugMessage = '';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = `Server error: ${error.response.data?.message || error.response.statusText}`;
        debugMessage = `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your internet connection and try again.';
        debugMessage = 'Request sent but no response received. Check if backend is running.';
      } else {
        // Something else happened
        errorMessage = `Quick login failed: ${error.message || 'Unknown error occurred'}`;
        debugMessage = `Error type: ${error.name}, Message: ${error.message}`;
      }
      
      setError(errorMessage);
      setDebugInfo(debugMessage);
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    try {
      setDebugInfo('Testing backend connection...');
      const response = await fetch('http://localhost:5000/');
      const data = await response.json();
      setDebugInfo(`Backend is reachable: ${data.message}`);
    } catch (error) {
      setDebugInfo(`Backend connection failed: ${error.message}`);
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
      <div className="card" style={{ width: '450px', margin: '0' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: '#3b82f6', marginBottom: '8px' }}>Trust Wallet Admin</h1>
          <p style={{ color: '#6b7280' }}>Access your dashboard</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {debugInfo && (
          <div className="alert alert-info" style={{ marginBottom: '16px', fontSize: '14px' }}>
            <strong>Debug:</strong> {debugInfo}
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
            {loading ? '🔐 Logging in...' : '🔐 Login'}
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
            marginBottom: '12px',
            background: '#10b981',
            borderColor: '#10b981'
          }}
        >
          {loading ? '⚡ Quick Logging in...' : '⚡ Quick Login as Admin'}
        </button>

        {/* Test Backend Connection */}
        <button 
          type="button" 
          className="btn btn-outline" 
          onClick={testBackendConnection}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          🔍 Test Backend Connection
        </button>

        {/* Current Credentials Display */}
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          textAlign: 'center',
          padding: '8px',
          background: '#f3f4f6',
          borderRadius: '6px'
        }}>
          <strong>Current credentials:</strong> {credentials.username} / {credentials.password}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
