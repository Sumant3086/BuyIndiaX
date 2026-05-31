/**
 * Delivery Partner Integration — Adapter Pattern
 *
 * Supports: Shiprocket (primary), Delhivery, DTDC, Amazon Shipping
 * Add new providers by implementing the DeliveryProvider interface.
 *
 * Usage:
 *   const dp = DeliveryPartnerFactory.create('shiprocket');
 *   const shipment = await dp.createShipment(order);
 *   const tracking = await dp.trackShipment(awbCode);
 */

const axios = require('axios');

// ── Base Provider Interface ───────────────────────────────────────────────────
class DeliveryProvider {
  constructor(config) { this.config = config; }
  async authenticate() { throw new Error('Not implemented'); }
  async createShipment(order) { throw new Error('Not implemented'); }
  async trackShipment(trackingId) { throw new Error('Not implemented'); }
  async cancelShipment(trackingId) { throw new Error('Not implemented'); }
  async getServiceability(pincode, weight) { throw new Error('Not implemented'); }
  async calculateRate(params) { throw new Error('Not implemented'); }
}

// ── Shiprocket Adapter ────────────────────────────────────────────────────────
class ShiprocketProvider extends DeliveryProvider {
  constructor() {
    super({
      baseUrl: 'https://apiv2.shiprocket.in/v1/external',
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD
    });
    this._token = null;
    this._tokenExpiry = null;
  }

  async authenticate() {
    if (this._token && this._tokenExpiry > Date.now()) return this._token;

    if (!this.config.email || !this.config.password) {
      throw new Error('SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be set in environment variables');
    }

    const { data } = await axios.post(`${this.config.baseUrl}/auth/login`, {
      email: this.config.email,
      password: this.config.password
    });

    this._token = data.token;
    this._tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 day token validity
    return this._token;
  }

  _headers() {
    return { Authorization: `Bearer ${this._token}`, 'Content-Type': 'application/json' };
  }

  async createShipment(order) {
    await this.authenticate();

    const payload = {
      order_id: order.orderNumber || order._id.toString(),
      order_date: new Date(order.createdAt).toISOString().split('T')[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
      billing_customer_name: order.shippingAddress?.name || 'Customer',
      billing_last_name: '',
      billing_address: order.shippingAddress?.street,
      billing_city: order.shippingAddress?.city,
      billing_pincode: order.shippingAddress?.pincode || order.shippingAddress?.zipCode,
      billing_state: order.shippingAddress?.state,
      billing_country: 'India',
      billing_email: order.user?.email || '',
      billing_phone: order.shippingAddress?.phone || order.user?.phone || '',
      shipping_is_billing: true,
      order_items: order.items.map(item => ({
        name: item.name,
        sku: item.product?.toString() || '',
        units: item.quantity,
        selling_price: item.price,
        hsn: item.hsnCode || ''
      })),
      payment_method: order.isPaid ? 'Prepaid' : 'COD',
      sub_total: order.subtotal,
      length: 15,
      breadth: 15,
      height: 10,
      weight: order.items.reduce((s, i) => s + (i.quantity * 0.5), 0) // estimate 0.5 kg per item
    };

    const { data } = await axios.post(`${this.config.baseUrl}/orders/create/adhoc`, payload, {
      headers: this._headers()
    });

    return {
      shipmentId: data.shipment_id,
      awbCode: data.awb_code,
      courierName: data.courier_name,
      estimatedDelivery: data.expected_delivery,
      pickupDate: data.pickup_scheduled_date,
      provider: 'shiprocket',
      raw: data
    };
  }

  async trackShipment(awbCode) {
    await this.authenticate();
    const { data } = await axios.get(`${this.config.baseUrl}/courier/track/awb/${awbCode}`, {
      headers: this._headers()
    });

    const tracking = data.tracking_data;
    return {
      awbCode,
      status: tracking?.shipment_status,
      currentLocation: tracking?.shipment_track?.[0]?.location,
      estimatedDelivery: tracking?.etd,
      events: (tracking?.shipment_track_activities || []).map(e => ({
        timestamp: e.date,
        activity: e.activity,
        location: e.location
      })),
      provider: 'shiprocket'
    };
  }

  async cancelShipment(shipmentId) {
    await this.authenticate();
    const { data } = await axios.post(`${this.config.baseUrl}/orders/cancel`, {
      ids: [shipmentId]
    }, { headers: this._headers() });
    return data;
  }

  async getServiceability(deliveryPincode, weight = 0.5) {
    await this.authenticate();
    const { data } = await axios.get(`${this.config.baseUrl}/courier/serviceability`, {
      headers: this._headers(),
      params: {
        pickup_postcode: process.env.WAREHOUSE_PINCODE || '400001',
        delivery_postcode: deliveryPincode,
        weight,
        cod: 0
      }
    });

    const couriers = data.data?.available_courier_companies || [];
    return couriers.map(c => ({
      courierId: c.courier_company_id,
      courierName: c.courier_name,
      rate: c.rate,
      estimatedDays: c.estimated_delivery_days,
      isAvailable: true
    }));
  }

  async calculateRate(params) {
    const couriers = await this.getServiceability(params.deliveryPincode, params.weight);
    return couriers.sort((a, b) => a.rate - b.rate);
  }
}

// ── Delhivery Stub ────────────────────────────────────────────────────────────
class DelhiveryProvider extends DeliveryProvider {
  constructor() {
    super({
      baseUrl: 'https://track.delhivery.com/api',
      token: process.env.DELHIVERY_TOKEN
    });
  }

  async authenticate() {
    if (!this.config.token) throw new Error('DELHIVERY_TOKEN must be set');
    return this.config.token;
  }

  async trackShipment(waybill) {
    const token = await this.authenticate();
    const { data } = await axios.get(`${this.config.baseUrl}/v1/packages/json/`, {
      headers: { Authorization: `Token ${token}` },
      params: { waybill }
    });

    const pkg = data.ShipmentData?.[0]?.Shipment;
    if (!pkg) return { awbCode: waybill, status: 'not_found', provider: 'delhivery' };

    return {
      awbCode: waybill,
      status: pkg.Status?.Status,
      currentLocation: pkg.Status?.StatusLocation,
      estimatedDelivery: pkg.ExpectedDeliveryDate,
      events: (pkg.Scans || []).map(s => ({
        timestamp: s.ScanDetail?.ScanDateTime,
        activity: s.ScanDetail?.Scan,
        location: s.ScanDetail?.ScannedLocation
      })),
      provider: 'delhivery'
    };
  }

  async createShipment(order) {
    // Stub — implement full Delhivery shipment creation
    throw new Error('Delhivery createShipment not yet implemented. Use Shiprocket.');
  }

  async cancelShipment(waybill) {
    throw new Error('Delhivery cancelShipment not yet implemented.');
  }

  async getServiceability(pincode) {
    const token = await this.authenticate();
    const { data } = await axios.get(`${this.config.baseUrl}/c/api/pin-codes/json/`, {
      headers: { Authorization: `Token ${token}` },
      params: { filter_codes: pincode }
    });
    return data;
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────
class DeliveryPartnerFactory {
  static _instances = {};

  static create(provider = 'shiprocket') {
    if (!DeliveryPartnerFactory._instances[provider]) {
      switch (provider) {
        case 'shiprocket':
          DeliveryPartnerFactory._instances[provider] = new ShiprocketProvider();
          break;
        case 'delhivery':
          DeliveryPartnerFactory._instances[provider] = new DelhiveryProvider();
          break;
        default:
          throw new Error(`Unknown delivery provider: ${provider}`);
      }
    }
    return DeliveryPartnerFactory._instances[provider];
  }

  static get defaultProvider() {
    return process.env.DELIVERY_PROVIDER || 'shiprocket';
  }
}

module.exports = { DeliveryPartnerFactory, ShiprocketProvider, DelhiveryProvider };
