if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const mongoUri = process.env.MONGODB_URI;

mongoose.connect(mongoUri)
    .then(() => console.log('Connexion à MongoDB Atlas établie !'))
    .catch(err => console.error('Erreur de connexion à MongoDB Atlas :', err));

// ==== SCHEMA SIMPLE ====

const PlayerSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    classroom: String,
    validatedQuestions: [String],
    validatedLevels: [String],
    created_at: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', PlayerSchema, 'players');


// ==== NORMALISATION DOUCE ====

function normalize(s) {
    return (s || '')
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function normalizeClassroom(c) {
    return normalize(c)
        .replace(/(?<=\d)(e|de|d)/, "") // 2de -> 2, 2d -> 2
        .toUpperCase();                // 2a -> 2A
}


// ==== ROUTE LOGIN ====

app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, classroom } = req.body;

        if (!firstName || !lastName || !classroom) {
            return res.status(400).json({ ok: false, error: "Champs manquants." });
        }

        const normFirst = normalize(firstName);
        const normLast = normalize(lastName);
        const normClass = normalizeClassroom(classroom);

        // Gestion spécifique 2CD
        const classesToCheck =
            normClass === '2C' || normClass === '2D'
                ? ['2CD']
                : [normClass];

        const found = await Player.findOne({
            classroom: { $in: classesToCheck },
            firstName: new RegExp(`^${normFirst}$`, "i"),
            lastName: new RegExp(`^${normLast}$`, "i")
        });

        if (!found) {
            return res.status(404).json({ ok: false, error: "Élève introuvable." });
        }

        return res.status(200).json({
            ok: true,
            message: "Connexion réussie",
            id: found._id,
            firstName: found.firstName,
            lastName: found.lastName,
            classroom: found.classroom
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: "Erreur serveur." });
    }
});


// ==== SAVE PROGRESS ====

app.post('/api/save-progress', async (req, res) => {
    try {
        const { playerId, progressType, value } = req.body;

        const player = await Player.findById(playerId);
        if (!player) {
            return res.status(404).json({ message: "Joueur non trouvé." });
        }

        if (progressType === "level" && !player.validatedLevels.includes(value)) {
            player.validatedLevels.push(value);
        }

        if (progressType === "question" && !player.validatedQuestions.includes(value)) {
            player.validatedQuestions.push(value);
        }

        await player.save();
        return res.status(200).json({ message: "Progression sauvegardée !" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});


// ==== LISTE PROF ====

app.get('/api/players', async (req, res) => {
    try {
        const players = await Player.find().sort({ created_at: -1 });
        res.status(200).json(players);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});


// ==== SERVE INDEX ====

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});


app.listen(port, () => {
    console.log(`Serveur Express en cours d'exécution sur le port ${port}`);
});
