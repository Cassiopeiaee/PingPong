// game.js

// Canvas und Kontext initialisieren
const canvas = document.getElementById('game-canvas'); // passt zur HTML-ID
const context = canvas.getContext('2d');

// Canvas-Größe an das Fenster anpassen (alternativ kannst du feste Werte verwenden)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
  [POWERUP_TYPES.SECOND_BALL]: null
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

// Globaler Event Listener für 'pointScored' um Ball Speed zurückzusetzen
document.addEventListener('pointScored', () => {
  ball.speedMultiplier = 1;
  // Entferne den zweiten Ball, wenn vorhanden
  if (secondBall) {
    secondBall = null;
  }
});

// Funktion zum Aktualisieren des Spiels
function update() {
  if (gameOver) return;

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

  // Update der Paddles
  leftPaddle.y += leftPaddle.dy;
  rightPaddle.y += rightPaddle.dy;

  // Begrenzung der Paddles im Spielfeld
  leftPaddle.y = Math.max(Math.min(leftPaddle.y, HEIGHT - leftPaddle.height), 0);
  rightPaddle.y = Math.max(Math.min(rightPaddle.y, HEIGHT - rightPaddle.height), 0);

  // Array aller Bälle
  const balls = [ball];
  if (secondBall) {
    balls.push(secondBall);
  }

  // Update aller Bälle
  balls.forEach((currentBall) => {
    currentBall.x += currentBall.dx * currentBall.speedMultiplier;
    currentBall.y += currentBall.dy * currentBall.speedMultiplier;

    // Kollision mit Ober- und Unterkante
    if (currentBall.y + ballRadius > HEIGHT || currentBall.y - ballRadius < 0) {
      currentBall.dy *= -1;
    }

    // Kollision mit den Paddles
    if (
      (currentBall.x - ballRadius < leftPaddle.x + paddleWidth &&
       currentBall.y > leftPaddle.y &&
       currentBall.y < leftPaddle.y + leftPaddle.height) ||
      (currentBall.x + ballRadius > rightPaddle.x &&
       currentBall.y > rightPaddle.y &&
       currentBall.y < rightPaddle.y + rightPaddle.height)
    ) {
      currentBall.dx *= -1;

      // Bestimme, welches Paddle getroffen wurde
      if (currentBall.x - ballRadius < leftPaddle.x + paddleWidth) {
        lastPaddleHit = 'left';
      } else {
        lastPaddleHit = 'right';
      }
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

  // Überprüfe, ob Power-Ups getroffen wurden
  activePowerUps.forEach((powerUp, index) => {
    const dx = ball.x - powerUp.x;
    const dy = ball.y - powerUp.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= ballRadius + powerUp.radius) {
      applyPowerUp(powerUp.type);
      activePowerUps.splice(index, 1);
    }

    // Prüfung für den zweiten Ball
    if (secondBall) {
      const dx2 = secondBall.x - powerUp.x;
      const dy2 = secondBall.y - powerUp.y;
      const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (distance2 <= ballRadius + powerUp.radius) {
        applyPowerUp(powerUp.type);
        activePowerUps.splice(index, 1);
      }
    }
  });
}

// Funktion zum Anwenden des Power-Ups
function applyPowerUp(type) {
  if (type === POWERUP_TYPES.BALL_SPEED) {
    ball.speedMultiplier *= 2;
    if (secondBall) {
      secondBall.speedMultiplier *= 2;
    }
  } else if (type === POWERUP_TYPES.PADDLE_SIZE) {
    if (lastPaddleHit === 'left') {
      leftPaddle.height = originalPaddleHeight * 2;
      leftPaddle.y = Math.max(Math.min(leftPaddle.y, HEIGHT - leftPaddle.height), 0);
      setTimeout(() => {
        leftPaddle.height = originalPaddleHeight;
      }, 60000);
    } else if (lastPaddleHit === 'right') {
      rightPaddle.height = originalPaddleHeight * 2;
      rightPaddle.y = Math.max(Math.min(rightPaddle.y, HEIGHT - rightPaddle.height), 0);
      setTimeout(() => {
        rightPaddle.height = originalPaddleHeight;
      }, 60000);
    }
  } else if (type === POWERUP_TYPES.SECOND_BALL) {
    if (!secondBall) {
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
  ball.dx = ball.normalSpeed.dx;
  ball.dy = ball.normalSpeed.dy;
  ball.speedMultiplier = 1;
  secondBall = null;
  dispatchPointScored();
}

// Funktion zum Zeichnen des Spiels
function draw() {
  // Hintergrund zeichnen
  context.fillStyle = '#fff';
  context.fillRect(0, 0, WIDTH, HEIGHT);

  // Paddles zeichnen
  context.fillStyle = '#000';
  context.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, leftPaddle.height);
  context.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, rightPaddle.height);

  // Alle Bälle zeichnen
  const balls = [ball];
  if (secondBall) {
    balls.push(secondBall);
  }
  balls.forEach((currentBall) => {
    context.beginPath();
    context.arc(currentBall.x, currentBall.y, ballRadius, 0, Math.PI * 2);
    context.fillStyle = '#000';
    context.fill();
    context.closePath();
  });

  // Aktive Power-Ups zeichnen
  activePowerUps.forEach((powerUp) => {
    context.beginPath();
    context.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
    context.fillStyle = powerUp.color;
    context.fill();
    context.closePath();
  });

  // Spielstand anzeigen
  context.font = 'bold 30px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  context.fillStyle = 'blue';
  context.fillText(leftScore, WIDTH / 2 - 50, HEIGHT / 2 - 30);

  context.fillStyle = 'red';
  context.fillText(rightScore, WIDTH / 2 + 50, HEIGHT / 2 - 30);

  // Gewinner anzeigen, wenn das Spiel vorbei ist
  if (gameOver && winner) {
    context.font = 'bold 50px Arial';
    context.fillStyle = 'yellow';
    context.fillText(`${winner} hat gewonnen!`, WIDTH / 2, HEIGHT / 2);
    context.font = 'bold 30px Arial';
    context.fillText(`Drücke 'R' zum Neustarten`, WIDTH / 2, HEIGHT / 2 + 50);
  }
}

// Power-Up Spawning Funktionen
function spawnPowerUp(type) {
  let color;
  if (type === POWERUP_TYPES.BALL_SPEED) {
    color = 'red';
  } else if (type === POWERUP_TYPES.PADDLE_SIZE) {
    color = 'blue';
  } else if (type === POWERUP_TYPES.SECOND_BALL) {
    color = 'green';
  }

  const newPowerUp = {
    type: type,
    x: Math.random() * (WIDTH - 30) + 15,
    y: Math.random() * (HEIGHT - 30) + 15,
    radius: 15,
    color: color
  };

  activePowerUps.push(newPowerUp);
}

function scheduleBallSpeedPowerUp() {
  const minDelay = 5000;
  const maxDelay = 30000;
  const delay = Math.random() * (maxDelay - minDelay) + minDelay;

  powerUpTimers.BALL_SPEED = setTimeout(() => {
    spawnPowerUp(POWERUP_TYPES.BALL_SPEED);
    scheduleBallSpeedPowerUp();
  }, delay);
}

function schedulePaddleSizePowerUp() {
  if (paddleSizePowerUpSpawned) return;

  const minDelay = 10000;
  const maxDelay = 60000;
  const delay = Math.random() * (maxDelay - minDelay) + minDelay;

  powerUpTimers.PADDLE_SIZE = setTimeout(() => {
    spawnPowerUp(POWERUP_TYPES.PADDLE_SIZE);
    paddleSizePowerUpSpawned = true;
  }, delay);
}

function scheduleSecondBallPowerUp() {
  const minDelay = 1000;
  const maxDelay = 20000;
  const delay = Math.random() * (maxDelay - minDelay) + minDelay;

  powerUpTimers.SECOND_BALL = setTimeout(() => {
    spawnPowerUp(POWERUP_TYPES.SECOND_BALL);
    scheduleSecondBallPowerUp();
  }, delay);
}

// Spielende überprüfen
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

// Spiel beenden
function endGame() {
  clearTimeout(powerUpTimers.BALL_SPEED);
  clearTimeout(powerUpTimers.PADDLE_SIZE);
  clearTimeout(powerUpTimers.SECOND_BALL);
  activePowerUps = [];
  secondBall = null;
}

// Spiel neustarten
function restartGame() {
  leftScore = 0;
  rightScore = 0;
  gameOver = false;
  winner = null;

  leftPaddle.y = HEIGHT / 2 - originalPaddleHeight / 2;
  rightPaddle.y = HEIGHT / 2 - originalPaddleHeight / 2;
  leftPaddle.height = originalPaddleHeight;
  rightPaddle.height = originalPaddleHeight;

  resetBall();
  paddleSizePowerUpSpawned = false;

  scheduleBallSpeedPowerUp();
  schedulePaddleSizePowerUp();
  scheduleSecondBallPowerUp();
}

// Dispatch des 'pointScored'-Events
function dispatchPointScored() {
  document.dispatchEvent(new Event('pointScored'));
}

// Spiel-Loop Funktion
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

