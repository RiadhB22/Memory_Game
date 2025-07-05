// 📁 memory-core.js
import { db } from "./firebase-init.js";
import { ref, get, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { detectPlayerRole } from "./session.js";

const gameRef = ref(db, "game");

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}
let cards = images.sort(() => 0.5 - Math.random());

const sounds = {
  flip1: new Audio("files/flip1.mp3"),
  flip2: new Audio("files/flip2.mp3")
};

let player, sessionId, playerName;

init();

async function init() {
  player = await detectPlayerRole();
  if (!player) return;

  sessionId = sessionStorage.getItem("sessionId");
  playerName = sessionStorage.getItem("nom" + capitalize(player));

  setupResetButton();
  setupListeners();
  checkStart();
}

function checkStart() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data?.started && data?.noms?.joueur1 && data?.noms?.joueur2) {
      const newGame = {
        started: true,
        turn: "joueur1",
        board: cards,
        flipped: [],
        matched: [],
        scores: { joueur1: 0, joueur2: 0 },
        sessions: data.sessions,
        noms: data.noms,
        moves: 0,
        timeStart: Date.now()
      };
      set(gameRef, newGame);
    }
  });
}

function setupListeners() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const nom1 = data.noms?.joueur1 || "Joueur 1";
    const nom2 = data.noms?.joueur2 || "Joueur 2";

    document.getElementById("player1-name").textContent = `${nom1} :`;
    document.getElementById("player2-name").textContent = `${nom2} :`;

    document.getElementById("score1").textContent = data.scores?.joueur1 || 0;
    document.getElementById("score2").textContent = data.scores?.joueur2 || 0;

    document.getElementById("reset-button").disabled = player !== "joueur1";

    if (data.board) renderGame(data);
    updateStatus(data);
  });
}

function renderGame(data) {
  const game = document.getElementById("game");
  game.innerHTML = "";
  data.board.forEach((card, index) => {
    const isFlipped = data.flipped.includes(index);
    const isMatched = data.matched.includes(card.id);

    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.dataset.index = index;
    cardEl.innerHTML = `
      <div class="inner ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''}">
        <div class="front"><img src="${card.img}" alt=""></div>
        <div class="back"><img src="files/verso.jpg" alt=""></div>
      </div>`;

    cardEl.addEventListener("click", () => {
      if (data.turn === player) handleCardClick(index, card.id);
    });
    game.appendChild(cardEl);
  });
}

async function handleCardClick(index, id) {
  const snap = await get(gameRef);
  const data = snap.val();
  if (!data || data.turn !== player || data.flipped.length >= 2 || data.flipped.includes(index) || data.matched.includes(id)) return;

  const newFlipped = [...data.flipped, index];
  sounds[newFlipped.length === 1 ? 'flip1' : 'flip2'].play();

  update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 800);
  }
}

function checkMatch([i1, i2], data) {
  const c1 = data.board[i1];
  const c2 = data.board[i2];
  let matched = data.matched || [];
  let scores = data.scores;
  let turn = data.turn;
  let moves = data.moves + 1;

  if (c1.id === c2.id) {
    matched.push(c1.id);
    scores[turn] += 1;
  } else {
    turn = turn === "joueur1" ? "joueur2" : "joueur1";
  }

  update(gameRef, {
    flipped: [],
    matched,
    scores,
    turn,
    moves
  });
}

function updateStatus(data) {
  const elapsed = Math.floor((Date.now() - data.timeStart) / 1000);
  document.getElementById("timer").textContent = `${elapsed}s`;

  const p1 = document.getElementById("player1-name");
  const p2 = document.getElementById("player2-name");
  p1.classList.toggle("active-player", data.turn === "joueur1");
  p2.classList.toggle("active-player", data.turn === "joueur2");
}

function setupResetButton() {
  document.getElementById("reset-button").addEventListener("click", () => {
    if (player !== "joueur1") return;
    remove(gameRef);
    location.reload();
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
