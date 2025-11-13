import React from 'react';
import './Quiz.css';

function ZombieArena({ position }) {
  const maxPosition = 10;
  const progress = (position / maxPosition) * 100;

  return (
    <div className="zombie-arena">
      <div className="arena-track">
        <div 
          className="zombie-character"
          style={{ left: `${progress}%` }}
        >
          💀
        </div>
        <div className="track-line"></div>
      </div>
      <div className="progress-text">
        Progression: {position}/{maxPosition}
      </div>
    </div>
  );
}

export default ZombieArena;