
import React, { useState } from 'react';
import Login from './components/Login';
import QuizGame from './components/QuizGame';
import GameOverlay from './components/GameOverlay';
import ProfessorDashboard from './components/ProfessorDashboard';
import './index.css';

const API_URL = 'http://localhost:3001';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (loginData) => {
    setLoading(true);
    try {
      console.log('🔄 Tentative de connexion:', loginData);
      
      const response = await fetch(`${API_URL}/api/students/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prenom: loginData.prenom,
          nom: loginData.nom, 
          classe: loginData.classe
        }),
      });
      
      const result = await response.json();
      console.log('📩 Réponse serveur:', result);
      
      if (result.success) {
        setUser(result.user);
        // Si c'est un professeur, aller au dashboard
        if (loginData.classe === 'Professeur') {
          setCurrentScreen('dashboard');
        } else {
          setCurrentScreen('quiz');
        }
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      alert('Erreur de connexion au serveur. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGameResult = async (score) => {
    if (!user) return;
    
    try {
      await fetch(`${API_URL}/api/game/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: user.id,
          prenom: user.prenom,
          nom: user.nom,
          classe: user.classe,
          score: score
        }),
      });
      console.log('✅ Score sauvegardé:', score);
    } catch (error) {
      console.error('❌ Erreur sauvegarde score:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '100px', 
        textAlign: 'center',
        fontSize: '24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        minHeight: '100vh'
      }}>
        Chargement...
      </div>
    );
  }

  return (
    <div className="App">
      {currentScreen === 'login' && <Login onLogin={handleLogin} />}
      
      {currentScreen === 'quiz' && user && (
        <QuizGame 
          user={user}
          onSaveResult={handleSaveGameResult}
          onGameOver={() => setCurrentScreen('gameOver')}
          onLogout={() => {
            setUser(null);
            setCurrentScreen('login');
          }}
        />
      )}
      
      {currentScreen === 'gameOver' && (
        <GameOverlay
          user={user}
          onRestart={() => setCurrentScreen('quiz')}
          onExit={() => {
            setUser(null);
            setCurrentScreen('login');
          }}
        />
      )}
      
      {currentScreen === 'dashboard' && user && (
        <ProfessorDashboard
          user={user}
          onBack={() => {
            setUser(null);
            setCurrentScreen('login');
          }}
        />
      )}
    </div>
  );
}

export default App;