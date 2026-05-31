const express = require('express');
const router = express.Router();
const StoreManager = require('../utils/storeManager');
const { auth, requirePermission } = require('../middleware/auth');

const storeManager = new StoreManager();

// ========== PUBLIC ROUTES ==========

// Get store status (open/closed)
router.get('/status', async (req, res) => {
  try {
    const status = storeManager.getStoreStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== MANAGER ROUTES ==========

// Sync inventory (online and offline)
router.post('/sync-inventory', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const syncReport = await storeManager.syncInventory();
    res.json({
      message: 'Inventory synced successfully',
      report: syncReport
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product availability
router.put('/product/:id/availability', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const product = await storeManager.updateProductAvailability(req.params.id, isAvailable);
    res.json({
      message: 'Product availability updated',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk update prices (for promotions)
router.post('/bulk-price-update', auth, requirePermission('manage_products'), async (req, res) => {
  try {
    const { updates } = req.body;
    // updates format: [{ productId, newPrice, discount }]
    const results = await storeManager.bulkUpdatePrices(updates);
    res.json({
      message: 'Prices updated successfully',
      updated: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove expiring products
router.post('/remove-expiring', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const removed = await storeManager.removeExpiringProducts();
    res.json({
      message: 'Expiring products removed',
      removed: removed.length,
      details: removed
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get online orders
router.get('/online-orders', auth, requirePermission('manage_orders'), async (req, res) => {
  try {
    const { status = 'Pending', limit = 50 } = req.query;
    const orders = await storeManager.getOnlineOrders(status, parseInt(limit));
    res.json({
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check for overselling issues
router.get('/check-overselling', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const issues = await storeManager.checkOverselling();
    res.json({
      hasIssues: issues.length > 0,
      issueCount: issues.length,
      issues
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== REPORTING ROUTES ==========

// Daily sales report
router.get('/reports/daily-sales', auth, requirePermission('view_reports'), async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    const report = await storeManager.getDailySalesReport(reportDate);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Category performance report
router.get('/reports/category-performance', auth, requirePermission('view_reports'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const report = await storeManager.getCategoryPerformance(parseInt(days));
    res.json({
      period: `${days} days`,
      categories: report
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Inventory valuation report
router.get('/reports/inventory-valuation', auth, requirePermission('view_reports'), async (req, res) => {
  try {
    const report = await storeManager.getInventoryValuation();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Stock turnover ratio
router.get('/reports/stock-turnover', auth, requirePermission('view_reports'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const report = await storeManager.getStockTurnoverRatio(parseInt(days));
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Comprehensive manager dashboard
router.get('/dashboard', auth, requirePermission('view_reports'), async (req, res) => {
  try {
    const [
      storeStatus,
      syncReport,
      oversellingIssues,
      dailySales,
      categoryPerformance,
      inventoryValuation,
      stockTurnover
    ] = await Promise.all([
      Promise.resolve(storeManager.getStoreStatus()),
      storeManager.syncInventory(),
      storeManager.checkOverselling(),
      storeManager.getDailySalesReport(),
      storeManager.getCategoryPerformance(7),
      storeManager.getInventoryValuation(),
      storeManager.getStockTurnoverRatio(30)
    ]);

    res.json({
      storeStatus,
      inventory: {
        sync: syncReport,
        valuation: inventoryValuation,
        turnover: stockTurnover
      },
      orders: {
        oversellingIssues: oversellingIssues.length,
        issues: oversellingIssues
      },
      sales: {
        today: dailySales,
        categoryPerformance
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
