import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().min(6, 'Too Short!').required('Required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In real app, this would be an actual API call
        const mockUser = {
          _id: '1',
          username: 'testuser',
          email: values.email,
          balance: 100000,
          portfolio: []
        };

        const mockToken = 'mock-jwt-token';

        login(mockUser, mockToken);
        navigate('/dashboard');
      } catch (err) {
        setError('Invalid email or password');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box component="main" sx={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: 400, bgcolor: 'background.paper', p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography component="h1" variant="h5" align="center" mb={4}>
          Virtual Stock Market
        </Typography>

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

      <form onSubmit={formik.handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            type="email"
            autoComplete="email"
            value={formik.values.email}
            onChange={formik.handleFieldChange}
            error={Boolean(formik.touched.email && formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={formik.values.password}
            onChange={formik.handleFieldChange}
            error={Boolean(formik.touched.password && formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>

          <Button
            type="button"
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/register')}
          >
            Don't have an account? Register
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default LoginPage;