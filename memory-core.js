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

import { detectPlayerRole, savePlayerName } from "./session.js";

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
const titleEl = document.getElementById("game-title");

let cards = [], currentPlayer = null, canPlay = false, startTime = null, timerInterval = null;

initGame();

async function initGame() {
  currentPlayer = await detectPlayerRole();
  if (!currentPlayer) return;

  await savePlayerName(currentPlayer);

  resetBtn.disabled = currentPlayer !== "joueur1";
  resetBtn.addEventListener("click", resetGame);

  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (!data.sessions || Object.keys(data.sessions).length < 2) {
      boardEl.innerHTML = '<div class="waiting">⌛ En attente de l\'autre joueur...</div>';
      return;
    }

    name1El.textContent = data.noms?.joueur1 || "👤 Joueur 1";
    name2El.textContent = data.noms?.joueur2 || "👤 Joueur 2";

    if (!data.cards) return;
    cards = data.cards;
    renderBoard(cards);
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
  for (let i = 1; i <= 20; i++) {
    images.push(`files/${i}-1.jpg`, `files/${i}-2.jpg`);
  }
  const deck = images.map((img) => ({ img, matched: false }))
    .sort(() => Math.random() - 0.5)
    .slice(0, 40);

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

  if (data.activePlayer === "joueur1") {
    name1El.classList.add("active-player");
    name2El.classList.remove("active-player");
  } else {
    name2El.classList.add("active-player");
    name1El.classList.remove("active-player");
  }

  if (data.activePlayer === currentPlayer) {
    boardEl.classList.add("can-play");
  } else {
    boardEl.classList.remove("can-play");
  }
}

let flippedCards = [];

async function handleCardClick(e) {
  const snap = await get(gameRef);
  const data = snap.val();
  if (data.activePlayer !== currentPlayer) return;

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
        moveCount: data.moveCount + 1,
      });

      flippedCards = [];
    } else {
      setTimeout(async () => {
        boardEl.querySelectorAll(".inner")[first].classList.remove("flipped");
        boardEl.querySelectorAll(".inner")[second].classList.remove("flipped");
        flippedCards = [];

        await update(gameRef, {
          activePlayer: currentPlayer === "joueur1" ? "joueur2" : "joueur1",
          moveCount: data.moveCount + 1
        });
      }, 1000);
    }
  }
}

async function resetGame() {
  if (currentPlayer !== "joueur1") return;
  await setupNewGame();
  location.reload();
}
