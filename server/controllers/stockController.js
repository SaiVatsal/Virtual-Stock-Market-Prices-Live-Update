const asyncHandler = require('express-async-handler');
const Stock = require('../models/Stock');

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Public
const getStocks = asyncHandler(async (req, res) => {
  const stocks = await Stock.find({}).sort('symbol');
  res.json(stocks);
});

// @desc    Get stock by symbol
// @route   GET /api/stocks/:symbol
// @access  Public
const getStockBySymbol = asyncHandler(async (req, res) => {
  const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });

  if (stock) {
    res.json(stock);
  } else {
    res.status(404);
    throw new Error('Stock not found');
  }
});

// @desc    Update stock price (called by market simulation)
// @route   PUT /api/stocks/:symbol
// @access  Private/Admin
const updateStockPrice = asyncHandler(async (req, res) => {
  const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });

  if (stock) {
    stock.previousClose = stock.currentPrice;
    stock.currentPrice = req.body.price || stock.currentPrice;
    stock.change = stock.currentPrice - stock.previousClose;
    stock.changePercent = (stock.change / stock.previousClose) * 100;
    stock.volume = req.body.volume || stock.volume;
    stock.high = Math.max(stock.high || stock.currentPrice, stock.currentPrice);
    stock.low = Math.min(stock.low || stock.currentPrice, stock.currentPrice);
    stock.lastUpdated = new Date();

    const updatedStock = await stock.save();
    res.json(updatedStock);
  } else {
    res.status(404);
    throw new Error('Stock not found');
  }
});

module.exports = {
  getStocks,
  getStockBySymbol,
  updateStockPrice
};