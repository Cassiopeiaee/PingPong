// server.js

const express = require('express');
const path = require('path');

const app = express();
const PORT = 8000;

// Middleware, um statische Dateien bereitzustellen
app.use(express.static(path.join(__dirname, '.')));

// Route für die Startseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start des Servers
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
