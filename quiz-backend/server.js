if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ====== SERVIR LES FICHIERS STATIQUES =======
app.use('/img', express.static(path.join(__dirname, '..', 'img')));

const mongoUri = process.env.MONGODB_URI;

// ====== Connexion MongoDB =======
mongoose.connect(mongoUri)
    .then(() => console.log('✅ Connexion à MongoDB Atlas établie !'))
    .catch(err => console.error('❌ Erreur de connexion à MongoDB Atlas :', err));

// ====== Schemas =======
const PlayerSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    classroom: String,
    validatedQuestions: [String],
    validatedLevels: [String],
    score: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    lastConnection: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
});

const GameResultSchema = new mongoose.Schema({
    playerId: mongoose.Schema.Types.ObjectId,
    firstName: String,
    lastName: String,
    classroom: String,
    score: Number,
    date: { type: Date, default: Date.now }
});

const QuestionSchema = new mongoose.Schema({
    question: String,
    answer: String,
    level: String,
    difficulty: String
});

const Player = mongoose.model('Player', PlayerSchema, 'players');
const GameResult = mongoose.model('GameResult', GameResultSchema);
const Question = mongoose.model('Question', QuestionSchema);

// ====== NORMALISATION =======
function normalize(str) {
    return (str || '')
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function normalizeClassroom(c) {
    return normalize(c)
        .replace(/(?<=\d)(e|de|d)/, "")
        .toUpperCase();
}

// ====== ROUTES PRINCIPALES =======

// ROUTE LOGIN - Vérification dans la BDD existante
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, classroom } = req.body;

        if (!firstName || !lastName || !classroom) {
            return res.status(400).json({ ok: false, error: "Champs manquants." });
        }

        const normFirst = normalize(firstName);
        const normLast = normalize(lastName);
        const normClass = normalizeClassroom(classroom);

        // Fusion 2C et 2D
        const classesToCheck =
            normClass === '2C' || normClass === '2D'
                ? ['2CD']
                : [normClass];

        // Récupérer tous les élèves de cette classe depuis la BDD
        const all = await Player.find({
            classroom: { $in: classesToCheck }
        });

        // Comparer les noms normalisés
        const found = all.find(p =>
            normalize(p.firstName) === normFirst &&
            normalize(p.lastName) === normLast
        );

        if (!found) {
            return res.status(404).json({ 
                ok: false, 
                error: "Élève non trouvé dans la base de données. Vérifiez votre nom, prénom et classe." 
            });
        }

        // Mettre à jour la dernière connexion
        found.lastConnection = new Date();
        await found.save();

        console.log(`✅ Connexion réussie: ${firstName} ${lastName} (${classroom})`);

        return res.status(200).json({
            ok: true,
            message: "Connexion réussie",
            id: found._id,
            firstName: found.firstName,
            lastName: found.lastName,
            classroom: found.classroom,
            score: found.score || 0,
            bestScore: found.bestScore || 0
        });

    } catch (err) {
        console.error("Erreur register:", err);
        res.status(500).json({ ok: false, error: "Erreur serveur." });
    }
});

// ROUTE POUR REACT - Adaptation des noms de champs
app.post('/api/students/register', async (req, res) => {
    try {
        const { prenom, nom, classe } = req.body;

        console.log('📝 Tentative de connexion:', { prenom, nom, classe });

        if (!prenom || !nom || !classe) {
            return res.status(400).json({ 
                success: false, 
                error: "Tous les champs sont obligatoires." 
            });
        }

        // Utiliser la logique d'authentification existante
        const normFirst = normalize(prenom);
        const normLast = normalize(nom);
        const normClass = normalizeClassroom(classe);

        const classesToCheck =
            normClass === '2C' || normClass === '2D'
                ? ['2CD']
                : [normClass];

        const all = await Player.find({
            classroom: { $in: classesToCheck }
        });

        const found = all.find(p =>
            normalize(p.firstName) === normFirst &&
            normalize(p.lastName) === normLast
        );

        if (!found) {
            console.log(`❌ Élève non trouvé: ${prenom} ${nom} (${classe})`);
            return res.status(404).json({ 
                success: false, 
                error: "Élève non trouvé. Vérifiez vos informations." 
            });
        }

        // Mettre à jour la dernière connexion
        found.lastConnection = new Date();
        await found.save();

        console.log(`✅ Connexion React réussie: ${prenom} ${nom} (${classe})`);

        res.json({ 
            success: true, 
            message: "Connexion réussie",
            user: {
                id: found._id,
                prenom: found.firstName,
                nom: found.lastName,
                classe: found.classroom,
                score: found.score || 0,
                bestScore: found.bestScore || 0
            }
        });

    } catch (err) {
        console.error("Erreur inscription React:", err);
        res.status(500).json({ success: false, error: "Erreur serveur." });
    }
});

// ROUTE: Sauvegarder la progression
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
        console.error("Erreur save-progress:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// ROUTE: Sauvegarder les résultats du jeu
app.post('/api/game/results', async (req, res) => {
    try {
        const { playerId, prenom, nom, classe, score } = req.body;

        console.log(`🎮 Sauvegarde résultat: ${prenom} ${nom} - Score: ${score}`);

        // Mettre à jour le score du joueur
        const player = await Player.findById(playerId);
        if (player) {
            player.score = score;
            if (score > player.bestScore) {
                player.bestScore = score;
            }
            await player.save();
        }

        // Sauvegarder le résultat détaillé
        const gameResult = new GameResult({
            playerId,
            firstName: prenom,
            lastName: nom,
            classroom: classe,
            score,
            date: new Date()
        });
        await gameResult.save();

        res.json({ success: true, message: "Résultat sauvegardé" });

    } catch (err) {
        console.error("Erreur sauvegarde résultat:", err);
        res.status(500).json({ success: false, error: "Erreur sauvegarde" });
    }
});

// ROUTE: Récupérer les élèves (pour tableau de bord professeur)
app.get('/api/students/:classe', async (req, res) => {
    try {
        const { classe } = req.params;
        
        let filter = {};
        if (classe !== 'all') {
            const normClass = normalizeClassroom(classe);
            const classesToCheck =
                normClass === '2C' || normClass === '2D'
                    ? ['2CD']
                    : [normClass];
            filter = { classroom: { $in: classesToCheck } };
        }

        const students = await Player.find(filter)
            .sort({ lastConnection: -1 });

        console.log(`📊 Envoi de ${students.length} élèves (${classe})`);
        res.json(students);

    } catch (err) {
        console.error("Erreur récupération élèves:", err);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

// ROUTE: Questions du quiz
app.get('/api/questions', async (req, res) => {
    try {
        // Essayer de récupérer depuis la BDD
        let questions = await Question.find().limit(10);
        
        // Si pas de questions en BDD, utiliser des questions par défaut
        if (questions.length === 0) {
            questions = [
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
        }

        res.json(questions);

    } catch (err) {
        console.error("Erreur récupération questions:", err);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

// ROUTE: Liste complète des joueurs (pour professeur)
app.get('/api/players', async (req, res) => {
    try {
        const players = await Player.find().sort({ lastConnection: -1 });
        res.status(200).json(players);
    } catch (err) {
        console.error("Erreur players:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// ROUTE: Statistiques des classes
app.get('/api/stats/class/:classe', async (req, res) => {
    try {
        const { classe } = req.params;
        
        const filter = classe === 'all' ? {} : { classroom: classe };
        const students = await Player.find(filter);
        
        const stats = {
            totalStudents: students.length,
            averageScore: students.reduce((sum, s) => sum + (s.bestScore || 0), 0) / students.length || 0,
            bestScore: Math.max(...students.map(s => s.bestScore || 0), 0),
            activeToday: students.filter(s => 
                new Date(s.lastConnection).toDateString() === new Date().toDateString()
            ).length
        };
        
        res.json(stats);
    } catch (err) {
        console.error("Erreur stats:", err);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

// ====== DÉMARRAGE SERVEUR =======
app.listen(port, () => {
    console.log(`🚀 Serveur 5e Entraîneur sur http://localhost:${port}`);
    console.log(`📚 Authentification via base de données MongoDB`);
    console.log(`🎮 Seuls les élèves de la BDD peuvent accéder au jeu`);
});
