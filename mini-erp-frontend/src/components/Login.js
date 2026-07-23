import React, { useState } from 'react';
import API from '../api/axios';

const Login = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin'); // Default role
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isRegistering) {
      try {
        await API.post('/auth/register', { name, email, password, role });
        setMessage('Registration successful! Please log in.');
        setIsRegistering(false);
      } catch (err) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed');
      }
    } else {
      try {
        const response = await API.post('/auth/login', { email, password });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('name', response.data.name);
        onLoginSuccess();
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2>{isRegistering ? 'Create Mini ERP Account' : 'Mini ERP Login'}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}

        {isRegistering && (
          <>
            <div style={styles.inputGroup}>
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={styles.input}
              >
                <option value="Admin">Admin</option>
                <option value="Sales">Sales</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Accounts">Accounts</option>
              </select>
            </div>
          </>
        )}

        <div style={styles.inputGroup}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <button type="submit" style={styles.button}>
          {isRegistering ? 'Register' : 'Login'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <span
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setMessage('');
            }}
            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegistering ? 'Log In' : 'Sign Up'}
          </span>
        </p>
      </form>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f8' },
  card: { padding: '30px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '320px' },
  inputGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default Login;