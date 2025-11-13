import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    classe: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.prenom && formData.nom && formData.classe) {
      onLogin(formData);
    } else {
      alert('Veuillez remplir tous les champs');
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>5e Entraîneur</h1>
        <p className="login-subtitle">Non connecté</p>
      </div>

      <div className="login-content">
        <div className="welcome-section">
          <span className="welcome-icon">👋</span>
          <p className="welcome-text">Avant de commencer</p>
        </div>
        
        <p className="instruction-text">
          Entre ton <strong>prénom</strong>, <strong>nom</strong> et sélectionne ta <strong>classe</strong>.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Prénom"
              value={formData.prenom}
              onChange={(e) => setFormData({...formData, prenom: e.target.value})}
              className="text-input"
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="Nom"
              value={formData.nom}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
              className="text-input"
            />
          </div>

          <div className="input-group">
            <select
              value={formData.classe}
              onChange={(e) => setFormData({...formData, classe: e.target.value})}
              className="class-select"
            >
              <option value="">Classe</option>
              <option value="6eD">6eD</option>
              <option value="5eB">5eB</option>
              <option value="5eC">5eC</option>
              <option value="2dA">2dA</option>
              <option value="2deCD">2deCD</option>
              <option value="Professeur">Professeur</option>
            </select>
          </div>

          <button type="submit" className="start-btn">
            Commencer
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;