import React, { useState, useEffect } from 'react';

function ProfessorDashboard({ user, students, onRefresh, onBack }) {
  const [classStats, setClassStats] = useState({});

  // Calculer les statistiques par classe
  useEffect(() => {
    const stats = {};
    students.forEach(student => {
      if (!stats[student.classe]) {
        stats[student.classe] = {
          count: 0,
          totalScore: 0,
          average: 0
        };
      }
      stats[student.classe].count++;
      stats[student.classe].totalScore += student.score || 0;
    });

    // Calculer les moyennes
    Object.keys(stats).forEach(classe => {
      stats[classe].average = stats[classe].totalScore / stats[classe].count;
    });

    setClassStats(stats);
  }, [students]);

  return (
    <div className="professor-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Tableau de bord - Professeur</h1>
          <p>Bienvenue, {user.prenom} {user.nom}</p>
        </div>
        <div className="header-actions">
          <button onClick={onRefresh} className="refresh-btn">
            🔄 Actualiser
          </button>
          <button onClick={onBack} className="logout-btn">
            Déconnexion
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Statistiques par classe */}
        <div className="stats-section">
          <h2>📊 Statistiques par classe</h2>
          <div className="stats-grid">
            {Object.entries(classStats).map(([classe, stats]) => (
              <div key={classe} className="stat-card">
                <h3>Classe {classe}</h3>
                <p>Élèves: {stats.count}</p>
                <p>Moyenne: {stats.average.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Liste des élèves */}
        <div className="students-section">
          <h2>👥 Élèves connectés ({students.length})</h2>
          <div className="students-list">
            {students.length === 0 ? (
              <p className="no-students">Aucun élève connecté</p>
            ) : (
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Classe</th>
                    <th>Score</th>
                    <th>Dernière connexion</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={index}>
                      <td>{student.prenom}</td>
                      <td>{student.nom}</td>
                      <td>{student.classe}</td>
                      <td>{student.score || 0}</td>
                      <td>{new Date(student.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Actions professeur */}
        <div className="actions-section">
          <h2>⚙️ Actions</h2>
          <div className="action-buttons">
            <button className="action-btn">
              📝 Gérer les questions
            </button>
            <button className="action-btn">
              📊 Voir les résultats détaillés
            </button>
            <button className="action-btn">
              🎯 Créer un nouveau quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessorDashboard;