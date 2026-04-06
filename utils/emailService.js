const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.warn('Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send order confirmation email
const sendOrderConfirmation = async (user, order) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: `"BuyIndiaX" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Order Confirmation - #${order._id.toString().slice(-6)}`,
    html: `
      <h1>Thank you for your order!</h1>
      <p>Hi ${user.name},</p>
      <p>Your order has been confirmed and will be processed soon.</p>
      <h3>Order Details:</h3>
      <p><strong>Order ID:</strong> #${order._id.toString().slice(-6)}</p>
      <p><strong>Total Amount:</strong> ₹${order.totalAmount.toLocaleString()}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p>You can track your order status in your account dashboard.</p>
      <p>Thank you for shopping with BuyIndiaX!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent to:', user.email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Send shipping update email
const sendShippingUpdate = async (user, order) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: `"BuyIndiaX" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Your Order Has Been Shipped - #${order._id.toString().slice(-6)}`,
    html: `
      <h1>Your order is on its way!</h1>
      <p>Hi ${user.name},</p>
      <p>Great news! Your order has been shipped.</p>
      <h3>Shipping Details:</h3>
      <p><strong>Order ID:</strong> #${order._id.toString().slice(-6)}</p>
      ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
      ${order.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>` : ''}
      <p>Thank you for shopping with BuyIndiaX!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Shipping update email sent to:', user.email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: `"BuyIndiaX" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Welcome to BuyIndiaX!',
    html: `
      <h1>Welcome to BuyIndiaX!</h1>
      <p>Hi ${user.name},</p>
      <p>Thank you for joining BuyIndiaX. We're excited to have you!</p>
      <p>Start exploring our amazing products and enjoy exclusive deals.</p>
      <p><strong>Your Membership Tier:</strong> ${user.membershipTier}</p>
      <p><strong>Loyalty Points:</strong> ${user.loyaltyPoints}</p>
      <p>Happy shopping!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Send abandoned cart email
const sendAbandonedCartEmail = async (user, cart) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: `"BuyIndiaX" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'You left items in your cart!',
    html: `
      <h1>Don't forget your items!</h1>
      <p>Hi ${user.name},</p>
      <p>You have ${cart.items.length} item(s) waiting in your cart.</p>
      <p>Complete your purchase now before they're gone!</p>
      <p><strong>Cart Total:</strong> ₹${cart.totalAmount.toLocaleString()}</p>
      <p><a href="${process.env.CLIENT_URL}/cart">View Your Cart</a></p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Abandoned cart email sent to:', user.email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Send price drop alert
const sendPriceDropAlert = async (user, product, oldPrice, newPrice) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: `"BuyIndiaX" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Price Drop Alert: ${product.name}`,
    html: `
      <h1>Price Drop Alert!</h1>
      <p>Hi ${user.name},</p>
      <p>Good news! A product in your wishlist has dropped in price.</p>
      <h3>${product.name}</h3>
      <p><strong>Old Price:</strong> <s>₹${oldPrice.toLocaleString()}</s></p>
      <p><strong>New Price:</strong> ₹${newPrice.toLocaleString()}</p>
      <p><strong>You Save:</strong> ₹${(oldPrice - newPrice).toLocaleString()}</p>
      <p><a href="${process.env.CLIENT_URL}/products/${product._id}">Buy Now</a></p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Price drop alert sent to:', user.email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendOrderConfirmation,
  sendShippingUpdate,
  sendWelcomeEmail,
  sendAbandonedCartEmail,
  sendPriceDropAlert
};
