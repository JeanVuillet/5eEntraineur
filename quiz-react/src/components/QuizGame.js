import React, { useState } from 'react';
import QuestionDisplay from './QuestionDisplay';
import ZombieArena from './ZombieArena';
import './Quiz.css';

function QuizGame({ 
  user, 
  onSaveResult, 
  onGameOver, 
  onLogout 
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [zombiePosition, setZombiePosition] = useState(0);
  const [showError, setShowError] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');

  // Questions par défaut - CORRIGÉ avec vérification
  const questions = [
    {
      id: 1,
      question: "Quelle est la capitale de la France?",
      answer: "Paris",
      level: "Niveau 1 : repères"
    },
    {
      id: 2,
      question: "Quel océan borde l'ouest de la France?",
      answer: "L'océan Atlantique",
      level: "Niveau 1 : repères"
    },
    {
      id: 3,
      question: "Quelle mer borde le sud de la France?",
      answer: "La mer Méditerranée", 
      level: "Niveau 1 : repères"
    }
  ];

  // VÉRIFICATION pour éviter l'erreur .length
  const currentQ = questions[currentQuestion % questions.length];

  const handleAnswerSubmit = (userAnswer) => {
    if (!userAnswer.trim() || !currentQ) return;

    if (userAnswer.toLowerCase() === currentQ.answer.toLowerCase()) {
      // Bonne réponse
      const newScore = score + 1;
      const newZombiePosition = zombiePosition + 1;
      
      setScore(newScore);
      setZombiePosition(newZombiePosition);
      setCurrentQuestion(prev => prev + 1);
      
      // Sauvegarder le score
      if (onSaveResult) {
        onSaveResult(newScore);
      }
    } else {
      // Mauvaise réponse
      setCorrectAnswer(currentQ.answer);
      setShowError(true);
      
      const newHearts = hearts - 1;
      setHearts(newHearts);
      
      if (newHearts <= 0) {
        // Game Over
        setTimeout(() => {
          if (onGameOver) onGameOver();
        }, 2000);
      } else {
        // Continuer avec prochaine question
        setTimeout(() => {
          setShowError(false);
          setCurrentQuestion(prev => prev + 1);
        }, 2000);
      }
    }
  };

  const handleContinue = () => {
    setShowError(false);
    setCurrentQuestion(prev => prev + 1);
  };

  // ÉCRAN D'ERREUR
  if (showError) {
    return (
      <div className="error-overlay">
        <div className="error-content">
          <h2>❌ Erreur !</h2>
          <p>La bonne réponse était : <strong>{correctAnswer}</strong></p>
          <button onClick={handleContinue} className="continue-button">
            Continuer
          </button>
        </div>
      </div>
    );
  }

  // VÉRIFICATION que currentQ existe
  if (!currentQ) {
    return (
      <div className="quiz-game">
        <div className="loading-message">
          <p>Chargement des questions...</p>
        </div>
      </div>
    );
  }

  // ÉCRAN PRINCIPAL DU QUIZ
  return (
    <div className="quiz-game">
      <header className="quiz-header">
        <div className="user-info">
          <span>{user.prenom} {user.nom} - {user.classe}</span>
          <span className="hearts">❤️ {hearts}</span>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Déconnexion
        </button>
      </header>

      <div className="quiz-content">
        <h1>🎮 Quiz – Les deux empires 🏰</h1>
        <h2>{currentQ.level}</h2>
        <p className="score-counter">Compteur général : {score}/{currentQuestion}</p>

        <ZombieArena position={zombiePosition} />

        <QuestionDisplay
          question={currentQ}
          onSubmit={handleAnswerSubmit}
        />
      </div>
    </div>
  );
}

export default QuizGame;