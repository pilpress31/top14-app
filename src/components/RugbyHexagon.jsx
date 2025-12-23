import React from 'react';
import './RugbyHexagon.css';

const RugbyHexagon = ({ initials, c1, c2, styleType = 'vertical' }) => {
  // Détermine la classe CSS en fonction du style choisi
  const styleClass = `hex-${styleType}`;

  return (
    <div className="hex-container">
      <div 
        className={`hex ${styleClass}`} 
        style={{ '--c1': c1, '--c2': c2 }}
      >
        <span className="initials">{initials}</span>
      </div>
    </div>
  );
};

export default RugbyHexagon;