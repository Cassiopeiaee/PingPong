// Canvas und Kontext initialisieren
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// Spielfeldgröße
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Spieler-Paddles
const paddleWidth = 10;
const originalPaddleHeight = 100; // Originalhöhe der Paddles
const paddleSpeed = 6;

// Punktestand
let leftScore = 0;
let rightScore = 0;

// Spielstatus
let gameOver = false;
let winner = null;

// Linkes Paddle
let leftPaddle = {
    x: 10,
    y: HEIGHT / 2 - originalPaddleHeight / 2,
    dy: 0,
    height: originalPaddleHeight
};

// Rechtes Paddle
let rightPaddle = {
    x: WIDTH - paddleWidth - 10,
    y: HEIGHT / 2 - originalPaddleHeight / 2,
    dy: 0,
    height: originalPaddleHeight
};

// Ball
const ballRadius = 10;
let ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    dx: 4,
    dy: 4,
    normalSpeed: { dx: 4, dy: 4 }, // Speichert die normale Geschwindigkeit
    speedMultiplier: 1 // Aktueller Geschwindigkeitsfaktor
};

// Zweiter Ball (initial nicht vorhanden)
let secondBall = null;

// Steuerung
const keys = {};

// Letzter Paddel-Treffer
let lastPaddleHit = null;

// Power-Up Typen
const POWERUP_TYPES = {
    BALL_SPEED: 'ballSpeed',
    PADDLE_SIZE: 'paddleSize',
    SECOND_BALL: 'secondBall' // Neuer Power-Up Typ
};

// Aktive Power-Ups Array
let activePowerUps = [];

// Timer für Power-Up-Spawns
let powerUpTimers = {
    [POWERUP_TYPES.BALL_SPEED]: null,
    [POWERUP_TYPES.PADDLE_SIZE]: null,
    [POWERUP_TYPES.SECOND_BALL]: null // Timer für zweiten Ball
};

// Flag, um zu verfolgen, ob das Paddle-Size Power-Up bereits gespawnt wurde
let paddleSizePowerUpSpawned = false;

// Event Listener für Tastendrücke
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // Neustart des Spiels mit 'R'
    if (gameOver && e.key.toLowerCase() === 'r') {
        restartGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Globale Event Listener für 'pointScored' um Ball Speed zurückzusetzen
document.addEventListener('pointScored', () => {
    ball.speedMultiplier = 1;
    // Entferne den zweiten Ball, wenn vorhanden
    if (secondBall) {
        secondBall = null;
    }
});

// Funktion zum Aktualisieren des Spiels
function update() {
    if (gameOver) return; // Spiel nicht aktualisieren, wenn es vorbei ist

    // Bewegung der linken Paddle (W und S)
    if (keys['w']) {
        leftPaddle.dy = -paddleSpeed;
    } else if (keys['s']) {
        leftPaddle.dy = paddleSpeed;
    } else {
        leftPaddle.dy = 0;
    }

    // Bewegung der rechten Paddle (Pfeiltasten)
    if (keys['arrowup']) {
        rightPaddle.dy = -paddleSpeed;
    } else if (keys['arrowdown']) {
        rightPaddle.dy = paddleSpeed;
    } else {
        rightPaddle.dy = 0;
    }

    // Update Paddles
    leftPaddle.y += leftPaddle.dy;
    rightPaddle.y += rightPaddle.dy;

    // Begrenzung der Paddles innerhalb des Spielfelds
    leftPaddle.y = Math.max(Math.min(leftPaddle.y, HEIGHT - leftPaddle.height), 0);
    rightPaddle.y = Math.max(Math.min(rightPaddle.y, HEIGHT - rightPaddle.height), 0);

    // Array aller Bälle
    const balls = [ball];
    if (secondBall) {
        balls.push(secondBall);
    }

    // Update alle Bälle
    balls.forEach((currentBall) => {
        currentBall.x += currentBall.dx * currentBall.speedMultiplier;
        currentBall.y += currentBall.dy * currentBall.speedMultiplier;

        // Kollision mit Ober- und Unterkante
        if (currentBall.y + ballRadius > HEIGHT || currentBall.y - ballRadius < 0) {
            currentBall.dy *= -1;
        }

        // Kollision mit Paddles
        if (
            (currentBall.x - ballRadius < leftPaddle.x + paddleWidth &&
                currentBall.y > leftPaddle.y &&
                currentBall.y < leftPaddle.y + leftPaddle.height) ||
            (currentBall.x + ballRadius > rightPaddle.x &&
                currentBall.y > rightPaddle.y &&
                currentBall.y < rightPaddle.y + rightPaddle.height)
        ) {
            currentBall.dx *= -1;

            // Bestimmen, welches Paddel getroffen wurde
            if (currentBall.x - ballRadius < leftPaddle.x + paddleWidth) {
                lastPaddleHit = 'left';
            } else {
                lastPaddleHit = 'right';
            }

            // Optional: Erhöhe die Ballgeschwindigkeit bei jedem Treffer
            // currentBall.dx *= 1.1;
            // currentBall.dy *= 1.1;
        }
    });

    // Punktestand aktualisieren
    if (ball.x - ballRadius < 0) {
        rightScore++;
        dispatchPointScored();
        checkGameOver();
        resetBall();
    } else if (ball.x + ballRadius > WIDTH) {
        leftScore++;
        dispatchPointScored();
        checkGameOver();
        resetBall();
    }

    // Punktestand für den zweiten Ball prüfen
    if (secondBall) {
        if (secondBall.x - ballRadius < 0) {
            rightScore++;
            dispatchPointScored();
            checkGameOver();
            resetBall();
        } else if (secondBall.x + ballRadius > WIDTH) {
            leftScore++;
            dispatchPointScored();
            checkGameOver();
            resetBall();
        }
    }

    // Überprüfen, ob Power-Ups aktiv sind und ob sie getroffen wurden
    activePowerUps.forEach((powerUp, index) => {
        const dx = ball.x - powerUp.x;
        const dy = ball.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= ballRadius + powerUp.radius) {
            // Power-Up wurde getroffen
            applyPowerUp(powerUp.type);
            // Power-Up aus der aktiven Liste entfernen
            activePowerUps.splice(index, 1);
        }

        // Prüfen für den zweiten Ball
        if (secondBall) {
            const dx2 = secondBall.x - powerUp.x;
            const dy2 = secondBall.y - powerUp.y;
            const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            if (distance2 <= ballRadius + powerUp.radius) {
                // Power-Up wurde getroffen
                applyPowerUp(powerUp.type);
                // Power-Up aus der aktiven Liste entfernen
                activePowerUps.splice(index, 1);
            }
        }
    });
}

// Funktion zum Anwenden des Power-Ups
function applyPowerUp(type) {
    if (type === POWERUP_TYPES.BALL_SPEED) {
        // Ballgeschwindigkeit verdoppeln
        ball.speedMultiplier *= 2;

        // Wenn ein zweiter Ball existiert, erhöhe auch seine Geschwindigkeit
        if (secondBall) {
            secondBall.speedMultiplier *= 2;
        }

        // Hinweis: Die Geschwindigkeit wird automatisch zurückgesetzt, wenn ein Punkt erzielt wird
    } else if (type === POWERUP_TYPES.PADDLE_SIZE) {
        if (lastPaddleHit === 'left') {
            // Paddle des linken Spielers verdoppeln
            leftPaddle.height = originalPaddleHeight * 2;
            // Sicherstellen, dass das Paddle nicht aus dem Spielfeld ragt
            leftPaddle.y = Math.max(Math.min(leftPaddle.y, HEIGHT - leftPaddle.height), 0);
            // Nach 1 Minute die ursprüngliche Größe wiederherstellen
            setTimeout(() => {
                leftPaddle.height = originalPaddleHeight;
            }, 60000); // 60.000 Millisekunden = 1 Minute
        } else if (lastPaddleHit === 'right') {
            // Paddle des rechten Spielers verdoppeln
            rightPaddle.height = originalPaddleHeight * 2;
            // Sicherstellen, dass das Paddle nicht aus dem Spielfeld ragt
            rightPaddle.y = Math.max(Math.min(rightPaddle.y, HEIGHT - rightPaddle.height), 0);
            // Nach 1 Minute die ursprüngliche Größe wiederherstellen
            setTimeout(() => {
                rightPaddle.height = originalPaddleHeight;
            }, 60000); // 60.000 Millisekunden = 1 Minute
        }
    } else if (type === POWERUP_TYPES.SECOND_BALL) {
        // Überprüfen, ob bereits ein zweiter Ball existiert
        if (!secondBall) {
            // Zweiten Ball erstellen
            secondBall = {
                x: WIDTH / 2,
                y: HEIGHT / 2,
                dx: 4,
                dy: 4,
                normalSpeed: { dx: 4, dy: 4 },
                speedMultiplier: 1
            };
        }
    }
}

// Funktion zum Zurücksetzen des Balls
function resetBall() {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    // Speichert die normale Geschwindigkeit
    ball.dx = ball.normalSpeed.dx;
    ball.dy = ball.normalSpeed.dy;
    ball.speedMultiplier = 1;

    // Entferne den zweiten Ball, wenn vorhanden
    secondBall = null;

    // Trigger Punkt-Erzielung für 'pointScored' Event
    dispatchPointScored();
}

// Funktion zum Zeichnen des Spiels
function draw() {
    // Hintergrund
    context.fillStyle = '#222';
    context.fillRect(0, 0, WIDTH, HEIGHT);

    // Paddles
    context.fillStyle = '#fff';
    context.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, leftPaddle.height);
    context.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, rightPaddle.height);

    // Array aller Bälle
    const balls = [ball];
    if (secondBall) {
        balls.push(secondBall);
    }

    // Bälle zeichnen
    balls.forEach((currentBall) => {
        context.beginPath();
        context.arc(currentBall.x, currentBall.y, ballRadius, 0, Math.PI * 2);
        context.fillStyle = '#fff';
        context.fill();
        context.closePath();
    });

    // Power-Ups anzeigen, wenn aktiv
    activePowerUps.forEach((powerUp) => {
        context.beginPath();
        context.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
        context.fillStyle = powerUp.color;
        context.fill();
        context.closePath();
    });

    // Spielstand anzeigen
    context.font = 'bold 30px Arial'; // Größere Schriftgröße
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Links in Blau
    context.fillStyle = 'blue';
    context.fillText(leftScore, WIDTH / 2 - 50, HEIGHT / 2 - 30);

    // Rechts in Rot
    context.fillStyle = 'red';
    context.fillText(rightScore, WIDTH / 2 + 50, HEIGHT / 2 - 30);

    // Gewinner anzeigen, wenn Spiel vorbei ist
    if (gameOver && winner) {
        context.font = 'bold 50px Arial';
        context.fillStyle = 'yellow';
        context.fillText(`${winner} hat gewonnen!`, WIDTH / 2, HEIGHT / 2);
        context.font = 'bold 30px Arial';
        context.fillText(`Drücke 'R' zum Neustarten`, WIDTH / 2, HEIGHT / 2 + 50);
    }
}

// Funktion zum Erstellen eines Power-Ups
function spawnPowerUp(type) {
    // Eigenschaften basierend auf dem Typ festlegen
    let color;
    if (type === POWERUP_TYPES.BALL_SPEED) {
        color = 'red';
    } else if (type === POWERUP_TYPES.PADDLE_SIZE) {
        color = 'blue';
    } else if (type === POWERUP_TYPES.SECOND_BALL) {
        color = 'green'; // Farbe für den zweiten Ball Power-Up
    }

    // Power-Up Objekt erstellen
    const newPowerUp = {
        type: type,
        x: Math.random() * (WIDTH - 30) + 15, // Vermeide Randbereiche
        y: Math.random() * (HEIGHT - 30) + 15,
        radius: 15,
        color: color
    };

    // Power-Up zur aktiven Liste hinzufügen
    activePowerUps.push(newPowerUp);
}

// Funktion zum Planen des nächsten BALL_SPEED Power-Ups
function scheduleBallSpeedPowerUp() {
    const minDelay = 5000; // 5 Sekunden (erhöht)
    const maxDelay = 30000; // 30 Sekunden (erhöht)
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

    powerUpTimers.BALL_SPEED = setTimeout(() => {
        spawnPowerUp(POWERUP_TYPES.BALL_SPEED);
        scheduleBallSpeedPowerUp(); // Plane das nächste BALL_SPEED Power-Up
    }, delay);
}

// Funktion zum Planen des Paddle_Size Power-Ups
function schedulePaddleSizePowerUp() {
    if (paddleSizePowerUpSpawned) return; // Nur einmal pro Spiel

    const minDelay = 10000; // 10 Sekunden (erhöht)
    const maxDelay = 60000; // 60 Sekunden (erhöht)
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

    powerUpTimers.PADDLE_SIZE = setTimeout(() => {
        spawnPowerUp(POWERUP_TYPES.PADDLE_SIZE);
        paddleSizePowerUpSpawned = true; // Markiere, dass das Paddle_Size Power-Up gespawnt wurde
    }, delay);
}

// Funktion zum Planen des Second Ball Power-Ups
function scheduleSecondBallPowerUp() {
    const minDelay = 1000; // 1 Sekunde
    const maxDelay = 20000; // 20 Sekunden
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

    powerUpTimers.SECOND_BALL = setTimeout(() => {
        spawnPowerUp(POWERUP_TYPES.SECOND_BALL);
        scheduleSecondBallPowerUp(); // Plane das nächste Second Ball Power-Up
    }, delay);
}

// Funktion zum Überprüfen des Spielendes
function checkGameOver() {
    if (leftScore >= 5) {
        gameOver = true;
        winner = 'Linker Spieler';
        endGame();
    } else if (rightScore >= 5) {
        gameOver = true;
        winner = 'Rechter Spieler';
        endGame();
    }
}

// Funktion zum Beenden des Spiels
function endGame() {
    // Stoppe das Power-Up-Spawning
    clearTimeout(powerUpTimers.BALL_SPEED);
    clearTimeout(powerUpTimers.PADDLE_SIZE);
    clearTimeout(powerUpTimers.SECOND_BALL);

    // Entferne alle aktiven Power-Ups
    activePowerUps = [];

    // Entferne den zweiten Ball, wenn vorhanden
    secondBall = null;
}

// Funktion zum Neustarten des Spiels
function restartGame() {
    // Reset Spielzustand
    leftScore = 0;
    rightScore = 0;
    gameOver = false;
    winner = null;

    // Reset Paddles
    leftPaddle.y = HEIGHT / 2 - originalPaddleHeight / 2;
    rightPaddle.y = HEIGHT / 2 - originalPaddleHeight / 2;
    leftPaddle.height = originalPaddleHeight;
    rightPaddle.height = originalPaddleHeight;

    // Reset Ball
    resetBall();

    // Reset Paddle-Size Power-Up Spawn Flag
    paddleSizePowerUpSpawned = false;

    // Starte das Power-Up-Spawning neu
    scheduleBallSpeedPowerUp();
    schedulePaddleSizePowerUp();
    scheduleSecondBallPowerUp();
}

// Funktion zum Dispatchen des 'pointScored' Events
function dispatchPointScored() {
    document.dispatchEvent(new Event('pointScored'));
}

// Game Loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}




// Starte das Spiel und plane die Power-Ups
gameLoop();
scheduleBallSpeedPowerUp();
schedulePaddleSizePowerUp();
scheduleSecondBallPowerUp();
