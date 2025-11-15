// ====== CONFIG .env ======
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ====== SERVIR LES FICHIERS STATIQUES =======
// CORRIGÉ : On remonte d'un niveau pour trouver le dossier 'img'
app.use('/img', express.static(path.join(__dirname, '..', 'img')));

const mongoUri = process.env.MONGODB_URI;

// ====== Connexion MongoDB =======
mongoose
  .connect(mongoUri)
  .then(() => console.log('✅ Connexion à MongoDB Atlas établie !'))
  .catch((err) => console.error('❌ Erreur de connexion à MongoDB Atlas :', err));

// ====== Schema =======
const PlayerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  classroom: String,
  validatedQuestions: [String],
  validatedLevels: [String],
  created_at: { type: Date, default: Date.now },
});

const Player = mongoose.model('Player', PlayerSchema, 'players');

// ====== NORMALISATION =======
function normalizeBase(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[-'’._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function nameTokens(str) {
  return normalizeBase(str)
    .split(' ')
    .filter((tok) => tok.length >= 2);
}

function normalizeClassroom(c) {
  return normalizeBase(c)
    .replace(/(?<=\d)(e|de|d)/, '')
    .toUpperCase();
}

// ====== ROUTE LOGIN =======
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, classroom } = req.body;
    if (!firstName || !lastName || !classroom) return res.status(400).json({ ok: false, error: 'Champs manquants.' });
    
    const inputFirstTokens = nameTokens(firstName);
    const inputLastTokens = nameTokens(lastName);
    const normClass = normalizeClassroom(classroom);

    let classesToCheck = [normClass];
    if (normClass === '2C' || normClass === '2D') classesToCheck = ['2C', '2D', '2CD'];
    if (normClass === '6' || normClass === '6D') classesToCheck = ['6', '6D'];
    
    const all = await Player.find({ classroom: { $in: classesToCheck } });
    const found = all.find((p) => {
      const dbFirstTokens = nameTokens(p.firstName);
      const dbLastTokens = nameTokens(p.lastName);
      return inputFirstTokens.some(tok => dbFirstTokens.includes(tok)) && inputLastTokens.some(tok => dbLastTokens.includes(tok));
    });

    if (!found) return res.status(404).json({ ok: false, error: 'Élève introuvable.' });
    
    return res.status(200).json({ ok: true, id: found._id, firstName: found.firstName, lastName: found.lastName, classroom: found.classroom });
  } catch (err) {
    console.error('Erreur register:', err);
    res.status(500).json({ ok: false, error: 'Erreur serveur.' });
  }
});

// ====== SAVE PROGRESS =======
app.post('/api/save-progress', async (req, res) => {
  try {
    const { playerId, progressType, value } = req.body;
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ message: 'Joueur non trouvé.' });
    if (progressType === 'level' && !player.validatedLevels.includes(value)) player.validatedLevels.push(value);
    if (progressType === 'question' && !player.validatedQuestions.includes(value)) player.validatedQuestions.push(value);
    await player.save();
    return res.status(200).json({ message: 'Progression sauvegardée !' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ====== LISTE PROF =======
app.get('/api/players', async (req, res) => {
  try {
    const players = await Player.find().sort({ created_at: -1 });
    res.status(200).json(players);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ====== ROUTES DE RESET =======
app.post('/api/reset-player', async (req, res) => {
  try {
    const { playerId } = req.body;
    const player = await Player.findByIdAndUpdate(playerId, { $set: { validatedQuestions: [], validatedLevels: [] } }, { new: true });
    if (!player) return res.status(404).json({ message: 'Joueur non trouvé.' });
    res.status(200).json({ message: `Progression de ${player.firstName} réinitialisée.` });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur.' }); }
});
app.post('/api/reset-all-players', async (req, res) => {
  try {
    await Player.updateMany({}, { $set: { validatedQuestions: [], validatedLevels: [] } });
    res.status(200).json({ message: 'Progression de tous les élèves réinitialisée.' });
  } catch (err) { res.status(500).json({ message: 'Erreur serveur.' }); }
});

// ====== ROUTE DYNAMIQUE POUR LES QUESTIONS =======
app.get('/questions/:classKey', (req, res) => {
  const { classKey } = req.params;
  const allowedKeys = ['6e', '5e', '2de'];
  if (allowedKeys.includes(classKey)) {
    // CORRIGÉ : On remonte d'un niveau pour trouver les fichiers JSON
    const filePath = path.join(__dirname, '..', `questions-${classKey}.json`);
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).json({ message: `Fichier de questions non trouvé.` });
    });
  } else {
    res.status(400).json({ message: 'Clé de classe non valide.' });
  }
});


// ====== SERVE INDEX =======
app.get('/', (req, res) => {
  // CORRIGÉ : On remonte d'un niveau pour trouver index.html
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ====== START SERVER =======
app.listen(port, () => {
  console.log(`✅ Serveur Express lancé sur http://localhost:${port}`);
});