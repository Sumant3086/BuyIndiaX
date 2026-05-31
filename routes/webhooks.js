const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const WebhookEndpoint = require('../models/WebhookEndpoint');
const { auth, requireRole } = require('../middleware/auth');

// List webhooks (admin only)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const endpoints = await WebhookEndpoint.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(endpoints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create webhook endpoint
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, url, events } = req.body;

    if (!name || !url || !events?.length) {
      return res.status(400).json({ message: 'name, url, and events are required' });
    }

    // Validate URL format
    try { new URL(url); } catch { return res.status(400).json({ message: 'Invalid webhook URL' }); }

    const secret = crypto.randomBytes(32).toString('hex');
    const endpoint = await WebhookEndpoint.create({
      name,
      url,
      events,
      secret,
      createdBy: req.user._id
    });

    res.status(201).json({
      message: 'Webhook endpoint created',
      endpoint: { ...endpoint.toObject() },
      signingSecret: secret,
      note: 'Save this signing secret — it will not be shown again.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update webhook
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, url, events, isActive } = req.body;
    const endpoint = await WebhookEndpoint.findByIdAndUpdate(
      req.params.id,
      { name, url, events, isActive },
      { new: true, runValidators: true }
    );
    if (!endpoint) return res.status(404).json({ message: 'Webhook not found' });
    res.json({ message: 'Webhook updated', endpoint });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete webhook
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await WebhookEndpoint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Webhook endpoint deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test webhook (sends a test ping)
router.post('/:id/test', auth, requireRole('admin'), async (req, res) => {
  try {
    const endpoint = await WebhookEndpoint.findById(req.params.id);
    if (!endpoint) return res.status(404).json({ message: 'Webhook not found' });

    const WebhookDispatcher = require('../utils/webhookDispatcher');
    WebhookDispatcher.dispatch('webhook.test', {
      message: 'This is a test webhook from BuyIndiaX',
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Test webhook dispatched to ' + endpoint.url });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rotate signing secret
router.post('/:id/rotate-secret', auth, requireRole('admin'), async (req, res) => {
  try {
    const secret = crypto.randomBytes(32).toString('hex');
    const endpoint = await WebhookEndpoint.findByIdAndUpdate(
      req.params.id,
      { secret },
      { new: true }
    );
    if (!endpoint) return res.status(404).json({ message: 'Webhook not found' });
    res.json({ message: 'Secret rotated', newSecret: secret, note: 'Update your endpoint to verify with the new secret.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
