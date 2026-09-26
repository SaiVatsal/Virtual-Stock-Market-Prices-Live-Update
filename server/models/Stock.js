const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  previousClose: {
    type: Number,
    min: 0
  },
  change: {
    type: Number
  },
  changePercent: {
    type: Number
  },
  marketCap: {
    type: Number,
    min: 0
  },
  volume: {
    type: Number,
    min: 0,
    default: 0
  },
  high: {
    type: Number,
    min: 0
  },
  low: {
    type: Number,
    min: 0
  },
  open: {
    type: Number,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Stock', stockSchema);