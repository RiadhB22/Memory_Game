// 📁 memory-core.js
import { db } from "./firebase-init.js";
import {
  ref,
  onValue,
  set,
  update,
  get,
  child
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

import { detectPlayerRole } from "./session.js";

const gameRef = ref(db, "game");
const boardEl = document.getElementById("game");
const moveCountEl = document.getElementById("move-count");
const timerEl = document.getElementById("timer");
const startTimeEl = document.getElementById("start-time");
const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const name1El = document.getElementById("player1-name");
const name2El = document.getElementById("player2-name");
const resetBtn = document.getElementById("reset-button");

let cards = [], currentPlayer = null, canPlay = false, startTime = null, timerInterval = null;

initGame();

async function initGame() {
  currentPlayer = await detectPlayerRole();
  if (!currentPlayer) return;

  resetBtn.addEventListener("click", resetGame);

  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    name1El.textContent = data.noms?.joueur1 || "-";
    name2El.textContent = data.noms?.joueur2 || "-";

    if (!data.cards) return;
    if (!cards.length) {
      cards = data.cards;
      renderBoard(cards);
    }

    updateUI(data);
  });

  const snap = await get(gameRef);
  if (!snap.exists()) await setupNewGame();
  else {
    const data = snap.val();
    if (!data.cards) await setupNewGame();
  }
}

function renderBoard(cards) {
  boardEl.innerHTML = "";
  cards.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.innerHTML = `
      <div class="inner" data-index="${index}">
        <div class="front" style="background-image: url('files/verso.jpg');"></div>
        <div class="back" style="background-image: url('${card.img}')"></div>
      </div>
    `;
    boardEl.appendChild(cardEl);
  });

  boardEl.querySelectorAll(".inner").forEach((el) => {
    el.addEventListener("click", handleCardClick);
  });
}

async function setupNewGame() {
  const images = [];
  for (let i = 1; i <= 32; i++) {
    images.push(`img/${i}.png`);
  }
  const selected = images.slice(0, 32);
  const deck = [...selected, ...selected]
    .map((img) => ({ img, matched: false }))
    .sort(() => Math.random() - 0.5);

  await set(gameRef, {
    cards: deck,
    moveCount: 0,
    scores: { joueur1: 0, joueur2: 0 },
    revealed: [],
    activePlayer: "joueur1",
    startTime: Date.now(),
    noms: {},
    sessions: {}
  });
}

function updateUI(data) {
  moveCountEl.textContent = data.moveCount;
  score1El.textContent = data.scores?.joueur1 || 0;
  score2El.textContent = data.scores?.joueur2 || 0;

  startTime = data.startTime;
  if (!timerInterval) {
    timerInterval = setInterval(() => {
      const now = Date.now();
      const seconds = Math.floor((now - startTime) / 1000);
      timerEl.textContent = `${seconds}s`;
    }, 1000);
  }
  const date = new Date(startTime);
  startTimeEl.textContent = date.toLocaleTimeString();
}

let flippedCards = [];

async function handleCardClick(e) {
  if (flippedCards.length >= 2) return;

  const inner = e.currentTarget;
  const index = parseInt(inner.dataset.index);

  if (cards[index].matched || flippedCards.includes(index)) return;

  flippedCards.push(index);
  inner.classList.add("flipped");

  if (flippedCards.length === 2) {
    const [first, second] = flippedCards;
    const firstCard = cards[first];
    const secondCard = cards[second];

    if (firstCard.img === secondCard.img) {
      cards[first].matched = true;
      cards[second].matched = true;
      const scorePath = `scores/${currentPlayer}`;
      const scoreSnap = await get(child(gameRef, scorePath));
      const newScore = (scoreSnap.val() || 0) + 1;

      await update(gameRef, {
        cards,
        [scorePath]: newScore,
        moveCount: (await get(child(gameRef, "moveCount"))).val() + 1,
      });

      flippedCards = [];
    } else {
      setTimeout(() => {
        boardEl.querySelectorAll(".inner")[first].classList.remove("flipped");
        boardEl.querySelectorAll(".inner")[second].classList.remove("flipped");
        flippedCards = [];
      }, 1000);
    }
  }
}

async function resetGame() {
  await setupNewGame();
  location.reload();
}
