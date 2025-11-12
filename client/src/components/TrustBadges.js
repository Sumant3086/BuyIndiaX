import React from 'react';
import './TrustBadges.css';

const TrustBadges = () => {
  const badges = [
    { icon: '✓', text: '100% Secure', color: '#10b981' },
    { icon: '⚡', text: 'Fast Delivery', color: '#f59e0b' },
    { icon: '🏆', text: 'Top Quality', color: '#2D71F7' },
    { icon: '💯', text: 'Best Prices', color: '#FF7F3F' }
  ];

  return (
    <div className="trust-badges">
      <div className="container">
        <div className="badges-grid">
          {badges.map((badge, index) => (
            <div key={index} className="trust-badge" style={{ '--badge-color': badge.color }}>
              <span className="badge-icon">{badge.icon}</span>
              <span className="badge-text">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;
