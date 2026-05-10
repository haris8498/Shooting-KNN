const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

// Initialize files if they don't exist
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
if (!fs.existsSync(STATS_FILE)) fs.writeFileSync(STATS_FILE, JSON.stringify({
    totalScore: 0,
    correctEnemyKills: 0,
    friendlyFireMistakes: 0,
    missedEnemies: 0,
    totalMatches: 0
}));

app.post('/api/game/save', (req, res) => {
    try {
        const matchData = req.body;
        
        // Save to history
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE));
        history.unshift({ ...matchData, id: Date.now(), date: new Date().toISOString() });
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        
        // Update stats
        const stats = JSON.parse(fs.readFileSync(STATS_FILE));
        stats.totalScore += matchData.score || 0;
        stats.correctEnemyKills += matchData.correctEnemyKills || 0;
        stats.friendlyFireMistakes += matchData.friendlyFireMistakes || 0;
        stats.missedEnemies += matchData.missedEnemies || 0;
        stats.totalMatches += 1;
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
        
        res.status(200).json({ message: 'Match saved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save match data' });
    }
});

app.get('/api/game/history', (req, res) => {
    try {
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE));
        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read history' });
    }
});

app.get('/api/game/stats', (req, res) => {
    try {
        const stats = JSON.parse(fs.readFileSync(STATS_FILE));
        res.status(200).json(stats);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read stats' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
