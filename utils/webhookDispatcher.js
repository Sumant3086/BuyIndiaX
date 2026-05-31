/**
 * Outbound Webhook Dispatcher
 *
 * Delivers signed event payloads to registered endpoints.
 * - HMAC-SHA256 signature (X-BuyIndiaX-Signature header)
 * - Exponential back-off retry (3 attempts)
 * - Delivery log in WebhookEndpoint.stats
 * - Fire-and-forget (non-blocking)
 */

const crypto = require('crypto');
const axios = require('axios');
const WebhookEndpoint = require('../models/WebhookEndpoint');

const TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;

class WebhookDispatcher {
  /**
   * Dispatch an event to all registered endpoints that subscribe to it.
   * Non-blocking — returns immediately, delivers in background.
   */
  static dispatch(eventType, payload) {
    setImmediate(() => WebhookDispatcher._deliverAll(eventType, payload));
  }

  static async _deliverAll(eventType, payload) {
    let endpoints;
    try {
      endpoints = await WebhookEndpoint.find({ isActive: true, events: eventType });
    } catch (err) {
      console.error('[Webhook] Failed to load endpoints:', err.message);
      return;
    }

    for (const endpoint of endpoints) {
      WebhookDispatcher._deliverWithRetry(endpoint, eventType, payload, 0);
    }
  }

  static async _deliverWithRetry(endpoint, eventType, payload, attempt) {
    const body = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload
    });

    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(body)
      .digest('hex');

    try {
      const response = await axios.post(endpoint.url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-BuyIndiaX-Event': eventType,
          'X-BuyIndiaX-Signature': `sha256=${signature}`,
          'X-BuyIndiaX-Delivery': crypto.randomBytes(8).toString('hex')
        },
        timeout: TIMEOUT_MS
      });

      await WebhookEndpoint.findByIdAndUpdate(endpoint._id, {
        $inc: { 'stats.totalDeliveries': 1, 'stats.successfulDeliveries': 1 },
        'stats.lastDeliveryAt': new Date(),
        'stats.lastStatus': response.status
      });
    } catch (err) {
      const status = err.response?.status || 0;
      await WebhookEndpoint.findByIdAndUpdate(endpoint._id, {
        $inc: { 'stats.totalDeliveries': 1, 'stats.failedDeliveries': 1 },
        'stats.lastDeliveryAt': new Date(),
        'stats.lastStatus': status
      });

      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
        setTimeout(() => {
          WebhookDispatcher._deliverWithRetry(endpoint, eventType, payload, attempt + 1);
        }, delay);
      }
    }
  }
}

module.exports = WebhookDispatcher;
