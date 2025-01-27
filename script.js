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
    dy: 4
};

// Steuerung
const keys = {};

// Letzter Paddel-Treffer
let lastPaddleHit = null;

// Power-Up Typen
const POWERUP_TYPES = {
    PADDLE: 'paddle',
    BALL_SPEED: 'ballSpeed'
};

// Power-Ups Array
let powerUps = [
    {
        type: POWERUP_TYPES.PADDLE,
        x: 0,
        y: 0,
        radius: 15,
        active: false,
        color: 'blue'
    },
    {
        type: POWERUP_TYPES.BALL_SPEED,
        x: 0,
        y: 0,
        radius: 15,
        active: false,
        color: 'red'
    }
];

// Timer für Power-Ups
let powerUpTimers = {
    [POWERUP_TYPES.PADDLE]: null,
    [POWERUP_TYPES.BALL_SPEED]: null
};

// Event Listener für Tastendrücke
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Funktion zum Aktualisieren des Spiels
function update() {
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

    // Update Ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Kollision mit Ober- und Unterkante
    if (ball.y + ballRadius > HEIGHT || ball.y - ballRadius < 0) {
        ball.dy *= -1;
    }

    // Kollision mit Paddles
    if (
        (ball.x - ballRadius < leftPaddle.x + paddleWidth &&
         ball.y > leftPaddle.y &&
         ball.y < leftPaddle.y + leftPaddle.height) ||
        (ball.x + ballRadius > rightPaddle.x &&
         ball.y > rightPaddle.y &&
         ball.y < rightPaddle.y + rightPaddle.height)
    ) {
        ball.dx *= -1;

        // Bestimmen, welches Paddel getroffen wurde
        if (ball.x - ballRadius < leftPaddle.x + paddleWidth) {
            lastPaddleHit = 'left';
        } else {
            lastPaddleHit = 'right';
        }

        // Optional: Erhöhe die Ballgeschwindigkeit bei jedem Treffer
        // ball.dx *= 1.1;
        // ball.dy *= 1.1;
    }

    // Punktestand aktualisieren
    if (ball.x - ballRadius < 0) {
        rightScore++;
        resetBall();
    } else if (ball.x + ballRadius > WIDTH) {
        leftScore++;
        resetBall();
    }

    // Überprüfen, ob Power-Ups aktiv sind und ob sie getroffen wurden
    powerUps.forEach((powerUp) => {
        if (powerUp.active) {
            const dx = ball.x - powerUp.x;
            const dy = ball.y - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= ballRadius + powerUp.radius) {
                // Power-Up wurde getroffen
                applyPowerUp(powerUp.type);
                // Power-Up deaktivieren und nächsten Zeitpunkt planen
                powerUp.active = false;
                scheduleNextPowerUp(powerUp.type);
            }
        }
    });
}

// Funktion zum Anwenden des Power-Ups
function applyPowerUp(type) {
    if (type === POWERUP_TYPES.PADDLE) {
        if (lastPaddleHit === 'left') {
            // Paddle des linken Spielers verdoppeln
            leftPaddle.height = originalPaddleHeight * 2;
            // Sicherstellen, dass das Paddle nicht aus dem Spielfeld ragt
            leftPaddle.y = Math.max(Math.min(leftPaddle.y, HEIGHT - leftPaddle.height), 0);
            // Nach 10 Sekunden die ursprüngliche Größe wiederherstellen
            setTimeout(() => {
                leftPaddle.height = originalPaddleHeight;
            }, 10000);
        } else if (lastPaddleHit === 'right') {
            // Paddle des rechten Spielers verdoppeln
            rightPaddle.height = originalPaddleHeight * 2;
            // Sicherstellen, dass das Paddle nicht aus dem Spielfeld ragt
            rightPaddle.y = Math.max(Math.min(rightPaddle.y, HEIGHT - rightPaddle.height), 0);
            // Nach 10 Sekunden die ursprüngliche Größe wiederherstellen
            setTimeout(() => {
                rightPaddle.height = originalPaddleHeight;
            }, 10000);
        }
    } else if (type === POWERUP_TYPES.BALL_SPEED) {
        // Ballgeschwindigkeit verdoppeln
        ball.dx *= 2;
        ball.dy *= 2;

        // Nach 10 Sekunden die Ballgeschwindigkeit wiederherstellen
        setTimeout(() => {
            // Stelle sicher, dass die Geschwindigkeit nicht unter einen bestimmten Wert fällt
            ball.dx = ball.dx > 0 ? 4 : -4;
            ball.dy = ball.dy > 0 ? 4 : -4;
        }, 10000);
    }
}

// Funktion zum Zurücksetzen des Balls
function resetBall() {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    // Zufällige Richtung nach dem Reset
    ball.dx = Math.random() > 0.5 ? 4 : -4;
    ball.dy = 4;
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

    // Ball
    context.beginPath();
    context.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    context.fillStyle = '#fff';
    context.fill();
    context.closePath();

    // Power-Ups anzeigen, wenn aktiv
    powerUps.forEach((powerUp) => {
        if (powerUp.active) {
            context.beginPath();
            context.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
            context.fillStyle = powerUp.color;
            context.fill();
            context.closePath();
        }
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
}

// Funktion zum Erstellen eines Power-Ups
function spawnPowerUp(type) {
    const powerUp = powerUps.find(pu => pu.type === type);
    if (powerUp) {
        powerUp.x = Math.random() * (WIDTH - 30) + 15; // Vermeide Randbereiche
        powerUp.y = Math.random() * (HEIGHT - 30) + 15;
        powerUp.active = true;
    }
}

// Funktion zum Planen des nächsten Power-Ups
function scheduleNextPowerUp(type) {
    const maxDelay = 100000; // 5 Minuten in Millisekunden
    const delay = Math.random() * maxDelay;
    const timer = setTimeout(() => {
        spawnPowerUp(type);
    }, delay);
    powerUpTimers[type] = timer;
}

// Game Loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start des Spiels und Planen der ersten Power-Ups
gameLoop();
powerUps.forEach(powerUp => scheduleNextPowerUp(powerUp.type));
