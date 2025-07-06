// 📁 memory-core.js
import { db } from "./firebase-init.js";
import { ref, set, onValue, update, get, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { detectPlayerRole } from "./session.js";

const gameRef = ref(db, "game");
const board = document.getElementById("game");
const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");
const moveCount = document.getElementById("move-count");
const timer = document.getElementById("timer");
const player1Name = document.getElementById("player1-name");
const player2Name = document.getElementById("player2-name");
const startTime = document.getElementById("start-time");
const resetButton = document.getElementById("reset-button");

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let currentPlayer = "joueur1";
let moveCounter = 0;
let matchedPairs = 0;
let timerInterval;
let startTimestamp;

const totalPairs = 32;

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createCards() {
  const images = [];
  for (let i = 1; i <= totalPairs; i++) {
    images.push(i + ".png", i + ".png");
  }
  return shuffleArray(images);
}

function renderBoard(images) {
  board.innerHTML = "";
  images.forEach((img, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.image = img;
    card.dataset.index = index;
    card.innerHTML = `
      <div class="inner">
        <div class="front"><img src="img/${img}" width="100%" height="100%"></div>
        <div class="back"></div>
      </div>`;
    card.addEventListener("click", handleCardClick);
    board.appendChild(card);
  });
}

function handleCardClick(e) {
  if (lockBoard) return;
  const card = e.currentTarget;
  const inner = card.querySelector(".inner");
  if (inner.classList.contains("flipped") || inner.classList.contains("matched")) return;
  inner.classList.add("flipped");

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;
  moveCounter++;
  moveCount.textContent = moveCounter;

  const img1 = firstCard.dataset.image;
  const img2 = secondCard.dataset.image;

  if (img1 === img2) {
    matchedPairs++;
    firstCard.querySelector(".inner").classList.add("matched");
    secondCard.querySelector(".inner").classList.add("matched");
    updateScore();
    resetTurn();
  } else {
    setTimeout(() => {
      firstCard.querySelector(".inner").classList.remove("flipped");
      secondCard.querySelector(".inner").classList.remove("flipped");
      resetTurn();
    }, 1000);
  }
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function updateScore() {
  const scoreSpan = currentPlayer === "joueur1" ? score1 : score2;
  scoreSpan.textContent = parseInt(scoreSpan.textContent) + 1;
}

function startGame(images) {
  renderBoard(images);
  moveCounter = 0;
  matchedPairs = 0;
  score1.textContent = "0";
  score2.textContent = "0";
  moveCount.textContent = "0";
  clearInterval(timerInterval);
  startTimestamp = Date.now();
  startTime.textContent = new Date(startTimestamp).toLocaleTimeString();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
    timer.textContent = `${elapsed}s`;
  }, 1000);
}

async function init() {
  const player = await detectPlayerRole();
  if (!player) return;

  const snap = await get(gameRef);
  const data = snap.val();
  const name1 = data?.noms?.joueur1 || "-";
  const name2 = data?.noms?.joueur2 || "-";
  player1Name.textContent = name1;
  player2Name.textContent = name2;

  if (data?.images) {
    startGame(data.images);
  } else {
    const images = createCards();
    await set(gameRef, { images, noms: { joueur1: name1, joueur2: name2 }, sessions: {} });
    startGame(images);
  }
}

resetButton.addEventListener("click", async () => {
  await remove(gameRef);
  location.reload();
});

init();
