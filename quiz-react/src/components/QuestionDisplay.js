import React, { useState } from 'react';

function QuestionDisplay({ question, onSubmit }) {
  const [userAnswer, setUserAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userAnswer.trim()) {
      onSubmit(userAnswer);
      setUserAnswer('');
    }
  };

  return (
    <div className="question-display">
      <div className="question-card">
        <h3 className="question-text">{question.question}</h3>
        
        <form onSubmit={handleSubmit} className="answer-form">
          <input
            type="text"
            placeholder="Écris ta réponse ici"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="answer-input"
          />
          <button type="submit" className="validate-button">
            Valider
          </button>
        </form>
      </div>
    </div>
  );
}

export default QuestionDisplay;