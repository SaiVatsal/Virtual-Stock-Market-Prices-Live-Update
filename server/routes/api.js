const express = require('express');
const router = express.Router();

const { authUser, registerUser, getUserProfile, updateUserProfile } = require('../controllers/authController');
const { getStocks, getStockBySymbol, updateStockPrice } = require('../controllers/stockController');
const { buyStocks, sellStocks, getTransactions } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// Auth routes
router.post('/users/login', authUser);
router.post('/users', registerUser);
router.get('/users/profile', protect, getUserProfile);
router.put('/users/profile', protect, updateUserProfile);

// Stock routes
router.get('/stocks', getStocks);
router.get('/stocks/:symbol', getStockBySymbol);
// In a real app, this would be admin-only
router.put('/stocks/:symbol', protect, updateStockPrice);

// Transaction routes
router.post('/transactions/buy', protect, buyStocks);
router.post('/transactions/sell', protect, sellStocks);
router.get('/transactions', protect, getTransactions);

module.exports = router;