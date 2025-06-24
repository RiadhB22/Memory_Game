// memory-core.js

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let score = { joueur1: 0, joueur2: 0 };
let currentPlayer = "joueur1";
let startTime = null;

const board = document.getElementById("game-board");
const movesEl = document.getElementById("moves");
const durationEl = document.getElementById("duration");
const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const startTimeEl = document.getElementById("start-time");
const resetBtn = document.getElementById("reset-button");

let interval;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createBoard() {
  const totalPairs = 20;
  const cards = [];
  for (let i = 1; i <= totalPairs; i++) {
    cards.push(`${i}-1.jpg`, `${i}-2.jpg`);
  }

  const shuffled = shuffle(cards);
  board.innerHTML = "";
  shuffled.forEach((imgName) => {
    const card = document.createElement("img");
    card.src = "files/back.jpg";
    card.dataset.img = imgName;
    card.className = "card";
    card.addEventListener("click", handleFlip);
    board.appendChild(card);
  });
}

function handleFlip(e) {
  if (lockBoard) return;
  const card = e.target;
  if (card === firstCard || card.src.includes("files/" + card.dataset.img)) return;

  card.src = "files/" + card.dataset.img;

  if (!firstCard) {
    firstCard = card;
    return;
  }
  secondCard = card;
  lockBoard = true;

  moves++;
  movesEl.textContent = `🃏 Coups : ${moves}`;

  const isMatch = firstCard.dataset.img.split("-")[0] === secondCard.dataset.img.split("-")[0];
  if (isMatch) {
    score[currentPlayer]++;
    updateScores();
    resetTurn();
  } else {
    setTimeout(() => {
      firstCard.src = "files/back.jpg";
      secondCard.src = "files/back.jpg";
      switchPlayer();
      resetTurn();
    }, 1000);
  }
}

function updateScores() {
  score1El.textContent = `Score : ${score.joueur1}`;
  score2El.textContent = `Score : ${score.joueur2}`;
}

function switchPlayer() {
  currentPlayer = currentPlayer === "joueur1" ? "joueur2" : "joueur1";
  highlightCurrentPlayer();
}

function highlightCurrentPlayer() {
  document.getElementById("player1-display").classList.remove("active-player");
  document.getElementById("player2-display").classList.remove("active-player");
  document.getElementById(`${currentPlayer}-display`).classList.add("active-player");
}

function resetTurn() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

function startTimer() {
  startTime = Date.now();
  startTimeEl.textContent = `🕘 Heure de début : ${new Date(startTime).toLocaleTimeString()}`;
  interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    durationEl.textContent = `⏱️ Durée : ${elapsed}s`;
  }, 1000);
}

function resetGame() {
  moves = 0;
  score = { joueur1: 0, joueur2: 0 };
  currentPlayer = "joueur1";
  updateScores();
  movesEl.textContent = "🃏 Coups : 0";
  clearInterval(interval);
  durationEl.textContent = "⏱️ Durée : 0s";
  startTimeEl.textContent = "🕘 Heure de début : --:--";
  createBoard();
  highlightCurrentPlayer();
  startTimer();
}

resetBtn.addEventListener("click", resetGame);

// Déclencher le jeu au bon moment
document.addEventListener("start-game", () => {
  resetBtn.disabled = false;
  resetGame();
});
