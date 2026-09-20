const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let sessionID = 100001;

let gameState = {
  sessionId: `#${sessionID}`,
  timeRemaining: 30,
  status: 'BETTING',
  totalTai: 0,
  totalXiu: 0,
  playersTai: 0,
  playersXiu: 0,
  dice: [3, 5, 5],
  history: [],
  isShaking: false
};

setInterval(() => {
  if (gameState.status === 'BETTING') {
    gameState.timeRemaining--;

    // Giả lập bot cược và số lượng người chơi tăng tự động
    if (gameState.timeRemaining > 2) {
      if (Math.random() > 0.3) {
        gameState.totalTai += Math.floor(Math.random() * 5 + 1) * 500000;
        gameState.playersTai += Math.floor(Math.random() * 3 + 1);
      }
      if (Math.random() > 0.3) {
        gameState.totalXiu += Math.floor(Math.random() * 5 + 1) * 500000;
        gameState.playersXiu += Math.floor(Math.random() * 3 + 1);
      }
    }

    if (gameState.timeRemaining <= 0) {
      gameState.status = 'RESULT';
      gameState.timeRemaining = 5;

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const d3 = Math.floor(Math.random() * 6) + 1;
      gameState.dice = [d1, d2, d3];

      const totalScore = d1 + d2 + d3;
      const result = totalScore >= 11 ? 'TAI' : 'XIU';
      
      gameState.history.unshift({ totalScore, result });
      if (gameState.history.length > 20) gameState.history.pop();
    }
  } else if (gameState.status === 'RESULT') {
    gameState.timeRemaining--;
    if (gameState.timeRemaining <= 0) {
      sessionID++;
      gameState.sessionId = `#${sessionID}`;
      gameState.status = 'BETTING';
      gameState.timeRemaining = 30;
      gameState.totalTai = 0;
      gameState.totalXiu = 0;
      gameState.playersTai = 0;
      gameState.playersXiu = 0;
      gameState.isShaking = true; // Kích hoạt hiệu ứng lắc đĩa ở phiên mới
    }
  }

  io.emit('game_update', gameState);
  gameState.isShaking = false;
}, 1000);

io.on('connection', (socket) => {
  socket.emit('game_update', gameState);

  socket.on('place_bet', (data) => {
    if (gameState.status !== 'BETTING') return;
    if (data.choice === 'TAI') {
      gameState.totalTai += data.amount;
      gameState.playersTai += 1;
    }
    if (data.choice === 'XIU') {
      gameState.totalXiu += data.amount;
      gameState.playersXiu += 1;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
