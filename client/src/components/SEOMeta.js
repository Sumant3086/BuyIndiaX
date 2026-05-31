import { useEffect } from 'react';

/**
 * SEO meta tag manager — no external dependencies.
 * Sets <title>, <meta description>, Open Graph, and Twitter Card tags.
 * Cleans up on unmount to prevent stale tags on navigation.
 */
const SEOMeta = ({
  title,
  description = 'BuyIndiaX — your trusted Indian marketplace for quality products. Shop groceries, electronics, health & beauty and more.',
  image = '/og-image.jpg',
  url,
  type = 'website',
  price,
  currency = 'INR',
  availability
}) => {
  useEffect(() => {
    const site = 'BuyIndiaX';
    const fullTitle = title ? `${title} | ${site}` : `${site} — Your Trusted Indian Marketplace`;
    const canonicalUrl = url || window.location.href;

    const setMeta = (name, content, property = false) => {
      const sel = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(property ? 'property' : 'name', name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    document.title = fullTitle;

    // Basic SEO
    setMeta('description', description);
    setMeta('robots', 'index, follow');

    // Open Graph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image.startsWith('http') ? image : `${window.location.origin}${image}`, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', site, true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image.startsWith('http') ? image : `${window.location.origin}${image}`);

    // Product schema for product pages
    if (type === 'product' && price) {
      let schema = document.getElementById('product-schema');
      if (!schema) {
        schema = document.createElement('script');
        schema.id = 'product-schema';
        schema.type = 'application/ld+json';
        document.head.appendChild(schema);
      }
      schema.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        description,
        image,
        offers: {
          '@type': 'Offer',
          price,
          priceCurrency: currency,
          availability: availability === 'in_stock'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock'
        }
      });
    }

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [title, description, image, url, type, price, currency, availability]);

  return null;
};

export default SEOMeta;
