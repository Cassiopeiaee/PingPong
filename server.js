// server.js

// Lade Umgebungsvariablen aus der .env Datei
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware, um statische Dateien bereitzustellen
app.use(express.static(path.join(__dirname, 'public')));

// Route für die Startseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start des Servers
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
