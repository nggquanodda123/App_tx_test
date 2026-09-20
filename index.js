const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let gameState = {
  timeRemaining: 30,
  status: 'BETTING',
  totalTai: 0,
  totalXiu: 0,
  dice: [1, 1, 1],
  history: []
};

setInterval(() => {
  if (gameState.status === 'BETTING') {
    gameState.timeRemaining--;

    if (gameState.timeRemaining > 2) {
      gameState.totalTai += Math.floor(Math.random() * 5 + 1) * 100000;
      gameState.totalXiu += Math.floor(Math.random() * 5 + 1) * 100000;
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
      if (gameState.history.length > 15) gameState.history.pop();
    }
  } else if (gameState.status === 'RESULT') {
    gameState.timeRemaining--;
    if (gameState.timeRemaining <= 0) {
      gameState.status = 'BETTING';
      gameState.timeRemaining = 30;
      gameState.totalTai = 0;
      gameState.totalXiu = 0;
    }
  }

  io.emit('game_update', gameState);
}, 1000);

io.on('connection', (socket) => {
  socket.emit('game_update', gameState);

  socket.on('place_bet', (data) => {
    if (gameState.status !== 'BETTING') return;
    if (data.choice === 'TAI') gameState.totalTai += data.amount;
    if (data.choice === 'XIU') gameState.totalXiu += data.amount;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
