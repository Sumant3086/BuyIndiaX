import React from 'react';
import './UrgencyBadge.css';

const UrgencyBadge = ({ messages }) => {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="urgency-badges">
      {messages.map((msg, index) => (
        <div 
          key={index} 
          className={`urgency-badge urgency-${msg.type}`}
          style={{ borderColor: msg.color }}
        >
          <span className="urgency-icon">{msg.icon}</span>
          <span className="urgency-message">{msg.message}</span>
          {msg.progress && (
            <div className="urgency-progress">
              <div 
                className="urgency-progress-bar" 
                style={{ width: `${msg.progress}%`, backgroundColor: msg.color }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default UrgencyBadge;
