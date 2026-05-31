const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { auth, requirePermission } = require('../middleware/auth');
const { DeliveryPartnerFactory } = require('../utils/deliveryPartner');
const OrderWorkflow = require('../utils/orderWorkflow');

// Check delivery serviceability for a pincode
router.get('/serviceability/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    const { weight = 0.5 } = req.query;

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ message: 'Invalid pincode — must be 6 digits' });
    }

    const provider = DeliveryPartnerFactory.create();
    const rates = await provider.getServiceability(pincode, parseFloat(weight));

    res.json({ pincode, serviceable: rates.length > 0, couriers: rates });
  } catch (error) {
    // Gracefully handle missing credentials
    if (error.message.includes('must be set')) {
      return res.status(503).json({
        message: 'Delivery service not configured',
        detail: error.message,
        serviceable: null
      });
    }
    res.status(500).json({ message: 'Serviceability check failed', error: error.message });
  }
});

// Create shipment for an order
router.post('/shipment/:orderId', auth, requirePermission('manage_orders'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!['Processing', 'Shipped'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot create shipment for order with status: ${order.status}` });
    }

    const provider = DeliveryPartnerFactory.create();
    const shipment = await provider.createShipment(order);

    // Update order with tracking info
    await OrderWorkflow.processShippingUpdate(order, shipment);

    res.json({
      message: 'Shipment created successfully',
      shipment,
      order: { _id: order._id, status: order.status, trackingNumber: order.trackingNumber }
    });
  } catch (error) {
    if (error.message.includes('must be set')) {
      return res.status(503).json({ message: 'Delivery service credentials not configured', detail: error.message });
    }
    res.status(500).json({ message: 'Shipment creation failed', error: error.message });
  }
});

// Track shipment
router.get('/track/:trackingNumber', auth, async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { provider: providerName } = req.query;

    const provider = DeliveryPartnerFactory.create(providerName);
    const tracking = await provider.trackShipment(trackingNumber);

    res.json(tracking);
  } catch (error) {
    if (error.message.includes('must be set')) {
      return res.status(503).json({ message: 'Delivery service not configured', detail: error.message });
    }
    res.status(500).json({ message: 'Tracking failed', error: error.message });
  }
});

// Track by order ID (customer-facing)
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const order = await Order.findById(req.params.orderId).select('user trackingNumber status statusHistory estimatedDelivery shippedAt');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const response = {
      orderId: order._id,
      status: order.status,
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt,
      estimatedDelivery: order.estimatedDelivery,
      statusHistory: order.statusHistory
    };

    // Try to get live tracking if tracking number exists
    if (order.trackingNumber) {
      try {
        const provider = DeliveryPartnerFactory.create();
        const tracking = await provider.trackShipment(order.trackingNumber);
        response.liveTracking = tracking;
      } catch { /* live tracking optional */ }
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel shipment
router.delete('/shipment/:shipmentId', auth, requirePermission('manage_orders'), async (req, res) => {
  try {
    const provider = DeliveryPartnerFactory.create();
    const result = await provider.cancelShipment(req.params.shipmentId);
    res.json({ message: 'Shipment cancelled', result });
  } catch (error) {
    res.status(500).json({ message: 'Cancel failed', error: error.message });
  }
});

module.exports = router;
