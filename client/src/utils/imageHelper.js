/**
 * Image Helper Utilities
 * Handles image loading, fallbacks, and optimization
 */

// Fallback images by category
export const FALLBACK_IMAGES = {
  'Fresh Produce': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&fit=crop',
  'Grocery': 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=800&q=80&fit=crop',
  'Beverages': 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=800&q=80&fit=crop',
  'Health & Beauty': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80&fit=crop',
  'Non-Food Items': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80&fit=crop',
  'default': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&fit=crop'
};

/**
 * Get fallback image for a product category
 */
export const getFallbackImage = (category) => {
  return FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default;
};

/**
 * Handle image error by setting fallback
 */
export const handleImageError = (e, category) => {
  if (e.target.src !== getFallbackImage(category)) {
    e.target.src = getFallbackImage(category);
  }
};

/**
 * Optimize image URL with parameters
 */
export const optimizeImageUrl = (url, width = 800, quality = 80) => {
  if (!url) return getFallbackImage('default');
  
  // If already has parameters, return as is
  if (url.includes('w=') && url.includes('q=')) {
    return url;
  }
  
  // Add parameters
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&q=${quality}&fit=crop`;
};

/**
 * Preload image
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Get responsive image URL based on screen size
 */
export const getResponsiveImageUrl = (url) => {
  const width = window.innerWidth;
  
  if (width < 768) {
    // Mobile
    return optimizeImageUrl(url, 400, 75);
  } else if (width < 1024) {
    // Tablet
    return optimizeImageUrl(url, 600, 80);
  } else {
    // Desktop
    return optimizeImageUrl(url, 800, 80);
  }
};

const imageHelper = {
  getFallbackImage,
  handleImageError,
  optimizeImageUrl,
  preloadImage,
  getResponsiveImageUrl
};

export default imageHelper;
