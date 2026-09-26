import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import './styles/App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // In a real app, you'd decode the token to get user info
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <SocketProvider>
        <AuthProvider>
          <CssBaseline />
          <Router>
            <div className="App">
              {!isAuthenticated ? (
                <>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={<Navigate replace to="/login" />} />
                  <Route path="*" element={<Navigate replace to="/login" />} />
                </>
              ) : (
                <>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/" element={<Navigate replace to="/dashboard" />} />
                    <Route path="*" element={<Navigate replace to="/dashboard" />} />
                  </Routes>
                </>
              )}
            </div>
          </Router>
        </AuthProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;