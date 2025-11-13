import React from 'react';
import './Quiz.css';

function GameOverlay({ score, onRestart, onExit }) {
  return (
    <div className="game-overlay">
      <div className="game-over-content">
        <div className="zombie-hero">
          <h1>💀 Game Over</h1>
        </div>
        
        <div className="game-over-message">
          <p>Tu n'as plus de cœurs.</p>
          <p className="final-score">Score final : <strong>{score}</strong></p>
          <p className="restart-question">Recommencer le niveau ?</p>
        </div>

        <div className="game-over-actions">
          <button onClick={onRestart} className="restart-button">
            Recommencer
          </button>
          <button onClick={onExit} className="exit-button">
            Retour au login
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverlay;