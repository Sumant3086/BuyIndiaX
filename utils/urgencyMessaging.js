/**
 * Urgency Messaging System
 * Creates FOMO (Fear of Missing Out) to drive conversions
 */

class UrgencyMessaging {
  /**
   * Get urgency message for a product
   */
  static getUrgencyMessage(product) {
    const messages = [];

    // Low stock urgency
    if (product.stock > 0 && product.stock <= 5) {
      messages.push({
        type: 'critical',
        icon: '🔴',
        message: `Only ${product.stock} left in stock!`,
        color: '#ef4444'
      });
    } else if (product.stock > 5 && product.stock <= 20) {
      messages.push({
        type: 'warning',
        icon: '⚠️',
        message: `Hurry! Only ${product.stock} items remaining`,
        color: '#f59e0b'
      });
    }

    // High demand urgency
    if (product.views > 100 && product.stock < 50) {
      messages.push({
        type: 'trending',
        icon: '🔥',
        message: `Trending! ${product.views} people viewing this`,
        color: '#ef4444'
      });
    }

    // Fast selling urgency
    if (product.salesCount > 50) {
      messages.push({
        type: 'popular',
        icon: '⭐',
        message: `${product.salesCount}+ sold this week`,
        color: '#10b981'
      });
    }

    // Expiry urgency (for perishables)
    if (product.isPerishable && product.inventoryBatches && product.inventoryBatches.length > 0) {
      const nearestExpiry = product.inventoryBatches
        .filter(batch => batch.expiryDate)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0];

      if (nearestExpiry) {
        const daysUntilExpiry = Math.ceil(
          (new Date(nearestExpiry.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 2 && daysUntilExpiry > 0) {
          messages.push({
            type: 'expiring',
            icon: '⏰',
            message: `Fresh! Best before ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
            color: '#f59e0b'
          });
        }
      }
    }

    // Featured product
    if (product.isFeatured) {
      messages.push({
        type: 'featured',
        icon: '✨',
        message: 'Featured Product',
        color: '#8b5cf6'
      });
    }

    // Flash sale
    if (product.isFlashSale && product.flashSaleEndTime) {
      const hoursLeft = Math.ceil(
        (new Date(product.flashSaleEndTime) - new Date()) / (1000 * 60 * 60)
      );

      if (hoursLeft > 0) {
        messages.push({
          type: 'flash-sale',
          icon: '⚡',
          message: `Flash Sale! Ends in ${hoursLeft}h`,
          color: '#ef4444'
        });
      }
    }

    // Discount urgency
    if (product.discount > 0) {
      messages.push({
        type: 'discount',
        icon: '💰',
        message: `Save ${product.discount}% today!`,
        color: '#10b981'
      });
    }

    return messages;
  }

  /**
   * Get cart urgency message
   */
  static getCartUrgencyMessage(cart) {
    const messages = [];

    // Free shipping threshold
    const freeShippingThreshold = 499;
    if (cart.totalAmount < freeShippingThreshold) {
      const remaining = freeShippingThreshold - cart.totalAmount;
      messages.push({
        type: 'shipping',
        icon: '🚚',
        message: `Add ₹${remaining} more for FREE delivery!`,
        color: '#3b82f6',
        progress: (cart.totalAmount / freeShippingThreshold) * 100
      });
    } else {
      messages.push({
        type: 'shipping',
        icon: '✅',
        message: 'You qualify for FREE delivery!',
        color: '#10b981'
      });
    }

    // Bulk discount
    if (cart.items.length >= 5 && cart.items.length < 10) {
      messages.push({
        type: 'bulk',
        icon: '🎁',
        message: 'Add 5 more items for 10% bulk discount!',
        color: '#8b5cf6'
      });
    } else if (cart.items.length >= 10) {
      messages.push({
        type: 'bulk',
        icon: '🎉',
        message: 'Bulk discount applied! You saved extra 10%',
        color: '#10b981'
      });
    }

    // Cart expiry (items reserved for 30 minutes)
    const cartAge = Date.now() - new Date(cart.updatedAt).getTime();
    const minutesLeft = 30 - Math.floor(cartAge / (1000 * 60));

    if (minutesLeft > 0 && minutesLeft <= 10) {
      messages.push({
        type: 'expiry',
        icon: '⏰',
        message: `Items reserved for ${minutesLeft} minutes`,
        color: '#f59e0b'
      });
    }

    return messages;
  }

  /**
   * Get social proof message
   */
  static getSocialProofMessage(product, recentOrders = []) {
    const messages = [];

    // Recent purchases
    if (recentOrders.length > 0) {
      const recentOrder = recentOrders[0];
      const timeAgo = this.getTimeAgo(recentOrder.createdAt);
      
      messages.push({
        type: 'social-proof',
        icon: '👥',
        message: `Someone from ${recentOrder.city || 'India'} bought this ${timeAgo}`,
        color: '#3b82f6'
      });
    }

    // Total purchases
    if (product.salesCount > 100) {
      messages.push({
        type: 'social-proof',
        icon: '🛒',
        message: `${product.salesCount}+ customers bought this`,
        color: '#10b981'
      });
    }

    // High rating
    if (product.rating >= 4.5 && product.numReviews >= 10) {
      messages.push({
        type: 'rating',
        icon: '⭐',
        message: `${product.rating} rating from ${product.numReviews} reviews`,
        color: '#f59e0b'
      });
    }

    return messages;
  }

  /**
   * Get checkout urgency message
   */
  static getCheckoutUrgencyMessage(order) {
    const messages = [];

    // Payment timeout
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    const minutesLeft = 15 - Math.floor(orderAge / (1000 * 60));

    if (minutesLeft > 0 && minutesLeft <= 10) {
      messages.push({
        type: 'payment-timeout',
        icon: '⏰',
        message: `Complete payment in ${minutesLeft} minutes to secure your order`,
        color: '#ef4444'
      });
    }

    // Stock warning
    messages.push({
      type: 'stock-warning',
      icon: '⚠️',
      message: 'Items are reserved but stock is limited',
      color: '#f59e0b'
    });

    return messages;
  }

  /**
   * Helper: Get time ago string
   */
  static getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  /**
   * Get personalized message based on user behavior
   */
  static getPersonalizedMessage(user, product) {
    const messages = [];

    // First-time buyer
    if (!user.totalSpent || user.totalSpent === 0) {
      messages.push({
        type: 'welcome',
        icon: '🎉',
        message: 'Welcome! Get 10% off your first order',
        color: '#8b5cf6'
      });
    }

    // Loyal customer
    if (user.membershipTier === 'Platinum') {
      messages.push({
        type: 'vip',
        icon: '👑',
        message: 'Platinum Member: Extra 5% off',
        color: '#f59e0b'
      });
    }

    // Wishlist item on sale
    if (product.discount > 0) {
      messages.push({
        type: 'wishlist-sale',
        icon: '💝',
        message: 'Your wishlist item is on sale!',
        color: '#ef4444'
      });
    }

    return messages;
  }
}

module.exports = UrgencyMessaging;
