const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Stock = require('../models/Stock');

// @desc    Buy stocks
// @route   POST /api/transactions/buy
// @access  Private
const buyStocks = asyncHandler(async (req, res) => {
  const { symbol, quantity } = req.body;

  const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
  if (!stock) {
    res.status(404);
    throw new Error('Stock not found');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const totalCost = stock.currentPrice * quantity;

  if (user.balance < totalCost) {
    res.status(400);
    throw new Error('Insufficient funds');
  }

  // Create transaction
  const transaction = await Transaction.create({
    userId: user._id,
    stockSymbol: stock.symbol,
    transactionType: 'BUY',
    quantity,
    price: stock.currentPrice,
    totalAmount: totalCost
  });

  // Update user balance
  user.balance -= totalCost;

  // Update or add to portfolio
  const existingPosition = user.portfolio.find(
    pos => pos.stockSymbol === stock.symbol
  );

  if (existingPosition) {
    // Calculate new average price
    const totalQuantity = existingPosition.quantity + quantity;
    const totalCost = (existingPosition.averagePrice * existingPosition.quantity) +
                     (stock.currentPrice * quantity);
    existingPosition.averagePrice = totalCost / totalQuantity;
    existingPosition.quantity = totalQuantity;
  } else {
    user.portfolio.push({
      stockSymbol: stock.symbol,
      quantity,
      averagePrice: stock.currentPrice
    });
  }

  await user.save();

  res.status(201).json({
    message: 'Stock purchased successfully',
    transaction,
    balance: user.balance,
    portfolio: user.portfolio
  });
});

// @desc    Sell stocks
// @route   POST /api/transactions/sell
// @access  Private
const sellStocks = asyncHandler(async (req, res) => {
  const { symbol, quantity } = req.body;

  const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
  if (!stock) {
    res.status(404);
    throw new Error('Stock not found');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if user has enough shares
  const position = user.portfolio.find(
    pos => pos.stockSymbol === stock.symbol
  );

  if (!position || position.quantity < quantity) {
    res.status(400);
    throw new Error('Insufficient shares to sell');
  }

  const totalSale = stock.currentPrice * quantity;

  // Create transaction
  const transaction = await Transaction.create({
    userId: user._id,
    stockSymbol: stock.symbol,
    transactionType: 'SELL',
    quantity,
    price: stock.currentPrice,
    totalAmount: totalSale
  });

  // Update user balance
  user.balance += totalSale;

  // Update portfolio
  position.quantity -= quantity;

  // Remove position if quantity becomes 0
  if (position.quantity === 0) {
    user.portfolio = user.portfolio.filter(
      pos => pos.stockSymbol !== stock.symbol
    );
  }

  await user.save();

  res.status(201).json({
    message: 'Stock sold successfully',
    transaction,
    balance: user.balance,
    portfolio: user.portfolio
  });
});

// @desc    Get user transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user._id })
    .sort({ timestamp: -1 })
    .limit(50);

  res.json(transactions);
});

module.exports = {
  buyStocks,
  sellStocks,
  getTransactions
};