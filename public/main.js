// main.js

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const multiplayerButton = document.getElementById('multiplayer-button');
  
    startButton.addEventListener('click', () => {
      document.getElementById('home-screen').style.display = 'none';
      gameLoop();
      scheduleBallSpeedPowerUp();
      schedulePaddleSizePowerUp();
      scheduleSecondBallPowerUp();
    });
  
    multiplayerButton.addEventListener('click', () => {
      alert("Multiplayer is being developed");
    });
  });
  