const Stock = require('../models/Stock');

class MarketSimulation {
  constructor() {
    this.isRunning = false;
    this.simulationInterval = null;
    this.stocks = [];
  }

  async initializeStocks() {
    // Initialize with some popular stocks if none exist
    const stockCount = await Stock.countDocuments();
    if (stockCount === 0) {
      const initialStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 150.00 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', currentPrice: 2800.00 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', currentPrice: 300.00 },
        { symbol: 'TSLA', name: 'Tesla Inc.', currentPrice: 250.00 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', currentPrice: 3200.00 },
        { symbol: 'META', name: 'Meta Platforms Inc.', currentPrice: 300.00 },
        { symbol: 'NFLX', name: 'Netflix Inc.', currentPrice: 400.00 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', currentPrice: 400.00 }
      ];

      for (const stockData of initialStocks) {
        const stock = new Stock({
          ...stockData,
          previousClose: stockData.currentPrice,
          change: 0,
          changePercent: 0,
          marketCap: stockData.currentPrice * 1000000, // Simplified
          volume: Math.floor(Math.random() * 1000000) + 500000,
          high: stockData.currentPrice * 1.05,
          low: stockData.currentPrice * 0.95,
          open: stockData.currentPrice
        });
        await stock.save();
      }
    }

    this.stocks = await Stock.find({});
  }

  generatePriceChange(currentPrice) {
    // Random walk with slight upward bias (like real markets)
    const changePercent = (Math.random() - 0.45) * 0.02; // -4.5% to +5.5% range
    const change = currentPrice * changePercent;
    let newPrice = currentPrice + change;

    // Prevent negative prices
    newPrice = Math.max(newPrice, 0.01);

    return {
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(((change / currentPrice) * 100).toFixed(2))
    };
  }

  async updateStockPrices() {
    for (const stock of this.stocks) {
      const { price, change, changePercent } = this.generatePriceChange(stock.currentPrice);

      stock.previousClose = stock.currentPrice;
      stock.currentPrice = price;
      stock.change = change;
      stock.changePercent = changePercent;
      stock.lastUpdated = new Date();

      // Update volume randomly
      stock.volume = Math.floor(Math.random() * 500000) + stock.volume * 0.8;

      // Update high/low
      if (price > (stock.high || price)) {
        stock.high = price;
      }
      if (price < (stock.low || price)) {
        stock.low = price;
      }

      await stock.save();
    }
  }

  startSimulation(io) {
    if (this.isRunning) return;

    this.isRunning = true;

    // Update prices every 3 seconds
    this.simulationInterval = setInterval(async () => {
      try {
        await this.updateStockPrices();

        // Emit updated prices to all connected clients
        const updatedStocks = await Stock.find({});
        io.emit('stockUpdate', updatedStocks);
      } catch (error) {
        console.error('Error in market simulation:', error);
      }
    }, 3000);

    console.log('Market simulation started');
  }

  stopSimulation() {
    if (!this.isRunning) return;

    clearInterval(this.simulationInterval);
    this.simulationInterval = null;
    this.isRunning = false;

    console.log('Market simulation stopped');
  }
}

module.exports = new MarketSimulation();