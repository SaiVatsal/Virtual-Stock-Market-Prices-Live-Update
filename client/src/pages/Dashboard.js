import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Box,
  Typography,
  Button,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Divider
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { stocks, isConnected, socket } = useSocket();
  const [chartData, setChartData] = useState({});
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (stocks.length > 0) {
      setSelectedStock(stocks[0].symbol);
      updateChartData(stocks[0]);
    }
  }, [stocks]);

  useEffect(() => {
    if (selectedStock && stocks.length > 0) {
      const stock = stocks.find(s => s.symbol === selectedStock);
      if (stock) {
        updateChartData(stock);
      }
    }
  }, [selectedStock, stocks]);

  const updateChartData = (stock) => {
    // Generate mock historical data for chart
    const labels = Array.from({ length: 30 }, (_, i) => `-${29 - i}`);
    const data = labels.map(() => {
      const variation = (Math.random() - 0.5) * 0.1; // ±5%
      return stock.currentPrice * (1 + variation);
    });

    setChartData({
      labels,
      datasets: [{
        label: 'Price History',
        data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    });
  };

  const formik = useFormik({
    initialValues: {
      symbol: selectedStock || '',
      quantity: 1,
    },
    validationSchema: Yup.object({
      symbol: Yup.string().required('Required'),
      quantity: Yup.number().positive().integer().required('Required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        // Simulate trade execution
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In real app, this would call the API
        const stock = stocks.find(s => s.symbol === values.symbol.toUpperCase());
        if (!stock) {
          throw new Error('Stock not found');
        }

        const totalCost = stock.currentPrice * values.quantity;
        if (user.balance < totalCost) {
          throw new Error('Insufficient funds');
        }

        // Mock successful trade
        alert(`Successfully bought ${values.quantity} shares of ${values.symbol} at $${stock.currentPrice.toFixed(2)}`);

        // Update user balance (in real app, this would come from server response)
        // For demo, we'll just show success message
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    },
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h4" align="center">
          Virtual Stock Market Dashboard
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Welcome back, {user.username}!</Typography>
            <Typography color="text.secondary">
              Balance: ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="secondary"
            onClick={logout}
          >
            Logout
          </Button>
        </Box>

        <Divider />

        {isConnected ? (
          <Typography color="success">● Connected to market data</Typography>
        ) : (
          <Typography color="error">● Disconnected from market data</Typography>
        )}

        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Stocks Table */}
          <Box sx={{ flex: 2 }}>
            <Typography variant="h6">Market Overview</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell align="right">Change %</TableCell>
                    <TableCell align="right">Volume</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stocks.map((stock) => (
                    <TableRow key={stock.symbol} onClick={() => setSelectedStock(stock.symbol)} sx={{ cursor: 'pointer' }}>
                      <TableCell>{stock.symbol}</TableCell>
                      <TableCell align="right">${stock.currentPrice.toFixed(2)}</TableCell>
                      <TableCell align="right"
                        sx={{ color: stock.change >= 0 ? 'success.main' : 'error.main' }}>
                        {stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
                      </TableCell>
                      <TableCell align="right"
                        sx={{ color: stock.change >= 0 ? 'success.main' : 'error.main' }}>
                        {stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
                      </TableCell>
                      <TableCell align="right">{stock.volume.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Chart and Trading */}
          <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{selectedStock ? `${selectedStock} Chart` : 'Select a Stock'}</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  // Refresh chart data
                  if (selectedStock && stocks.length > 0) {
                    const stock = stocks.find(s => s.symbol === selectedStock);
                    if (stock) updateChartData(stock);
                  }
                }}
              >
                Refresh
              </Button>
            </Box>

            <Box sx={{ flex: 1, minHeight: 300 }}>
              {Object.keys(chartData).length > 0 ? (
                <Line data={chartData} />
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
                  Select a stock to view chart
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6">Trade Stock</Typography>
              {error && <Alert severity="error">{error}</Alert>}
              <form onSubmit={formik.handleSubmit}>
                <TextField
                  label="Stock Symbol"
                  value={formik.values.symbol}
                  onChange={formik.handleFieldChange}
                  error={Boolean(formik.touched.symbol && formik.errors.symbol)}
                  helperText={formik.touched.symbol && formik.errors.symbol}
                  inputProps={{
                    value: formik.values.symbol.toUpperCase(),
                    onChange: (e) => formik.setFieldValue('symbol', e.target.value.toUpperCase())
                  }}
                />

                <TextField
                  label="Quantity"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={formik.values.quantity}
                  onChange={formik.handleFieldChange}
                  error={Boolean(formik.touched.quantity && formik.errors.quantity)}
                  helperText={formik.touched.quantity && formik.errors.quantity}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Execute Trade'}
                </Button>
              </form>
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default Dashboard;