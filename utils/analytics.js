const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

class AnalyticsEngine {
  // RFM Analysis (Recency, Frequency, Monetary)
  static async calculateRFM() {
    const now = new Date();
    const users = await User.find({ role: 'user' });
    const rfmData = [];

    for (const user of users) {
      const orders = await Order.find({ user: user._id, isPaid: true }).sort({ createdAt: -1 });
      
      if (orders.length === 0) continue;

      const recency = Math.floor((now - orders[0].createdAt) / (1000 * 60 * 60 * 24));
      const frequency = orders.length;
      const monetary = orders.reduce((sum, order) => sum + order.totalAmount, 0);

      rfmData.push({ userId: user._id, name: user.name, email: user.email, recency, frequency, monetary });
    }

    // Score RFM (1-5 scale)
    const scored = rfmData.map(data => {
      const rScore = data.recency <= 30 ? 5 : data.recency <= 60 ? 4 : data.recency <= 90 ? 3 : data.recency <= 180 ? 2 : 1;
      const fScore = data.frequency >= 10 ? 5 : data.frequency >= 7 ? 4 : data.frequency >= 4 ? 3 : data.frequency >= 2 ? 2 : 1;
      const mScore = data.monetary >= 50000 ? 5 : data.monetary >= 25000 ? 4 : data.monetary >= 10000 ? 3 : data.monetary >= 5000 ? 2 : 1;
      
      return { ...data, rScore, fScore, mScore, rfmScore: rScore + fScore + mScore };
    });

    return scored.sort((a, b) => b.rfmScore - a.rfmScore);
  }

  // Customer Lifetime Value
  static async calculateCLV(userId) {
    const orders = await Order.find({ user: userId, isPaid: true });
    if (orders.length === 0) return 0;

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgOrderValue = totalRevenue / orders.length;
    const firstOrder = orders.sort((a, b) => a.createdAt - b.createdAt)[0];
    const daysSinceFirst = (Date.now() - firstOrder.createdAt) / (1000 * 60 * 60 * 24);
    const purchaseFrequency = orders.length / (daysSinceFirst / 365);
    
    const customerLifespan = 3; // years
    return avgOrderValue * purchaseFrequency * customerLifespan;
  }

  // ABC Analysis (Product Classification)
  static async abcAnalysis() {
    const products = await Product.find().select('name salesCount price');
    const productRevenue = products.map(p => ({
      productId: p._id,
      name: p.name,
      revenue: p.salesCount * p.price
    })).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = productRevenue.reduce((sum, p) => sum + p.revenue, 0);
    let cumulative = 0;

    return productRevenue.map(p => {
      cumulative += p.revenue;
      const percentage = (cumulative / totalRevenue) * 100;
      const category = percentage <= 80 ? 'A' : percentage <= 95 ? 'B' : 'C';
      return { ...p, category, cumulativePercentage: percentage.toFixed(2) };
    });
  }

  // Inventory Turnover Ratio
  static async inventoryTurnover(productId = null) {
    const query = productId ? { _id: productId } : {};
    const products = await Product.find(query);
    
    return products.map(p => {
      const cogs = p.salesCount * (p.price * 0.6); // Assuming 40% margin
      const avgInventory = p.stock;
      const turnover = avgInventory > 0 ? (cogs / avgInventory).toFixed(2) : 0;
      return { productId: p._id, name: p.name, turnover, salesCount: p.salesCount, stock: p.stock };
    });
  }

  // Churn Prediction (Simple rule-based)
  static async predictChurn() {
    const users = await User.find({ role: 'user' });
    const churnRisk = [];

    for (const user of users) {
      const orders = await Order.find({ user: user._id, isPaid: true }).sort({ createdAt: -1 });
      
      if (orders.length === 0) continue;

      const daysSinceLastOrder = (Date.now() - orders[0].createdAt) / (1000 * 60 * 60 * 24);
      const avgOrderInterval = orders.length > 1 ? 
        (orders[0].createdAt - orders[orders.length - 1].createdAt) / (1000 * 60 * 60 * 24) / (orders.length - 1) : 90;

      const churnScore = daysSinceLastOrder > (avgOrderInterval * 2) ? 'high' : 
                         daysSinceLastOrder > avgOrderInterval ? 'medium' : 'low';

      churnRisk.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        daysSinceLastOrder: Math.floor(daysSinceLastOrder),
        churnScore
      });
    }

    return churnRisk.filter(u => u.churnScore !== 'low').sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder);
  }

  // Seasonal Trend Analysis
  static async seasonalTrends() {
    const orders = await Order.find({ isPaid: true });
    const monthlyData = {};

    orders.forEach(order => {
      const month = order.createdAt.getMonth();
      if (!monthlyData[month]) monthlyData[month] = { orders: 0, revenue: 0 };
      monthlyData[month].orders++;
      monthlyData[month].revenue += order.totalAmount;
    });

    return Object.keys(monthlyData).map(month => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month],
      orders: monthlyData[month].orders,
      revenue: monthlyData[month].revenue
    }));
  }

  // Profit Margin Analysis
  static async profitMarginAnalysis() {
    const products = await Product.find();
    
    return products.map(p => {
      const costPrice = p.inventoryBatches?.[0]?.costPrice || p.price * 0.6;
      const sellingPrice = p.price;
      const margin = ((sellingPrice - costPrice) / sellingPrice * 100).toFixed(2);
      const profit = (sellingPrice - costPrice) * p.salesCount;
      
      return {
        productId: p._id,
        name: p.name,
        costPrice,
        sellingPrice,
        margin: parseFloat(margin),
        totalProfit: profit.toFixed(2),
        salesCount: p.salesCount
      };
    }).sort((a, b) => b.totalProfit - a.totalProfit);
  }
}

module.exports = AnalyticsEngine;
