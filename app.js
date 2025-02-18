import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "your api key",
  authDomain: "yourFirebaseAuthDomain.firebaseapp.com",
  databaseURL: "your firebase base url",
  projectId: "ect id",
  storageBucket: "your storage bucket url",
  messagingSenderId: "messaging sender id ",
  appId: "yout app id",
  measurementId: "your measurement id"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let box = 20;
let snake = [];
snake[0] = { x: 9 * box, y: 10 * box };

let food = {
  x: Math.floor(Math.random() * 19 + 1) * box,
  y: Math.floor(Math.random() * 19 + 1) * box
};

let score = 0;
let d;
let game;

document.addEventListener('keydown', direction);

function direction(event) {
  if (event.keyCode == 37 && d != 'RIGHT') {
    d = 'LEFT';
  } else if (event.keyCode == 38 && d != 'DOWN') {
    d = 'UP';
  } else if (event.keyCode == 39 && d != 'LEFT') {
    d = 'RIGHT';
  } else if (event.keyCode == 40 && d != 'UP') {
    d = 'DOWN';
  }
}

function collision(newHead, array) {
  for (let i = 1; i < array.length; i++) {
    if (newHead.x === array[i].x && newHead.y === array[i].y) {
      return true;
    }
  }
  return false;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i == 0 ? 'green' : 'white';
    ctx.fillRect(snake[i].x, snake[i].y, box, box);

    ctx.strokeStyle = 'red';
    ctx.strokeRect(snake[i].x, snake[i].y, box, box);
  }

  ctx.fillStyle = 'red';
  ctx.fillRect(food.x, food.y, box, box);

  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  if (d == 'LEFT') snakeX -= box;
  if (d == 'UP') snakeY -= box;
  if (d == 'RIGHT') snakeX += box;
  if (d == 'DOWN') snakeY += box;

  if (snakeX < 0) snakeX = canvas.width - box;
  if (snakeY < 0) snakeY = canvas.height - box;
  if (snakeX >= canvas.width) snakeX = 0;
  if (snakeY >= canvas.height) snakeY = 0;

  if (snakeX == food.x && snakeY == food.y) {
    score++;
    food = {
      x: Math.floor(Math.random() * (canvas.width / box)) * box,
      y: Math.floor(Math.random() * (canvas.height / box)) * box
    };
  } else {
    snake.pop();
  }

  let newHead = {
    x: snakeX,
    y: snakeY
  };

  if (collision(newHead, snake)) {
    clearInterval(game);
    showGameOver(score);
    return;
  }

  snake.unshift(newHead);

  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText('Skor: ' + score, 10, 20);
}

function startGame() {
  if (game) clearInterval(game);
  snake = [];
  snake[0] = { x: 9 * box, y: 10 * box };
  score = 0;
  d = undefined;
  food = {
    x: Math.floor(Math.random() * 19 + 1) * box,
    y: Math.floor(Math.random() * 19 + 1) * box
  };
  game = setInterval(draw, 100);
}

const leaderboardList = document.getElementById('leaderboardList');

function updateLeaderboard() {
  leaderboardList.innerHTML = '';
  const leaderboardRef = ref(database, 'leaderboard');
  const leaderboardQuery = query(leaderboardRef, orderByChild('score'), limitToLast(10));
  onValue(leaderboardQuery, snapshot => {
    const data = snapshot.val();
    if (data) {
      const entries = Object.entries(data).map(([key, value]) => value);
      entries.sort((a, b) => b.score - a.score); // Skora göre sıralama
      entries.forEach((entry, index) => {
        const li = document.createElement('li');
        const filteredName = filterBadWords(entry.name);
        li.textContent = `${index + 1}. ${filteredName}: ${entry.score}`;
        leaderboardList.appendChild(li);
      });
    }
  });
}

function saveToLeaderboard(name, score) {
  const leaderboardRef = ref(database, 'leaderboard');
  const newEntryRef = push(leaderboardRef);

  console.log("newEntryRef:", newEntryRef); 

  
  set(newEntryRef, {
    name: name,
    score: score
  }).then(() => {
    console.log("Veritabanına başarıyla yazıldı.");
  }).catch(error => {
    console.error("Veritabanına yazma hatası:", error);
  });

  updateLeaderboard();
}

const badWords = [
"list", "of", "bad", "words", "or", "insult", "words","that", "you", "may", "want", "to", "ignore", "in", "the", "leaderboard" ];

function filterBadWords(input) {
  let filteredName = input;

  badWords.forEach(word => {
    const regexPattern = word.split("").map(char => {
      return `[${char}${char.toUpperCase()}@*.!?]`; 
    }).join(".*?"); 

    const regex = new RegExp(regexPattern, "gi");
    filteredName = filteredName.replace(regex, "****");
  });

  return filteredName;
}

function showGameOver(score) {
  let name = prompt(`Oyun Bitti! Skorunuz: ${score}\nLütfen adınızı girin:`);

  if (name) {
    name = filterBadWords(name);

    saveToLeaderboard(name, score);
  }
}

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);

document.getElementById('upButton').addEventListener('click', () => direction({ keyCode: 38 }));
document.getElementById('downButton').addEventListener('click', () => direction({ keyCode: 40 }));
document.getElementById('leftButton').addEventListener('click', () => direction({ keyCode: 37 }));
document.getElementById('rightButton').addEventListener('click', () => direction({ keyCode: 39 }));

document.getElementById('fullscreenButton').addEventListener('click', () => {
  if (window.innerWidth <= 768) {
    alert("Bu özellik yalnızca masaüstü cihazlarda kullanılabilir.");
    return;
  }

  const boxSize = Math.floor(window.innerWidth / 20); 
  const gridSize = Math.min(boxSize, 40); 

  canvas.width = gridSize * 20;
  canvas.height = gridSize * 20;

  snake = snake.map(segment => ({
    x: Math.floor(segment.x / box) * gridSize,
    y: Math.floor(segment.y / box) * gridSize
  }));

  food = {
    x: Math.floor(food.x / box) * gridSize,
    y: Math.floor(food.y / box) * gridSize
  };

  box = gridSize;
});

updateLeaderboard();
