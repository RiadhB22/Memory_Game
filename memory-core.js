// memory-core.js
import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { detectPlayerRole } from "./session.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

let player = null;
let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}
let cards = images.sort(() => 0.5 - Math.random());

export async function init() {
  player = await detectPlayerRole();
  if (!player) return;

  updatePlayerNameDisplay(); // Affiche les noms immédiatement
  setupListeners();
  setupResetButton();
  checkStart();
}

function updatePlayerNameDisplay() {
  const nom1 = sessionStorage.getItem("nomJoueur1") || "Joueur 1";
  const nom2 = sessionStorage.getItem("nomJoueur2") || "Joueur 2";
  document.getElementById("player1-name").innerHTML = `👤 ${nom1}`;
  document.getElementById("player2-name").innerHTML = `👤 ${nom2}`;
}

function checkStart() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data?.started && data?.noms?.joueur1 && data?.noms?.joueur2) {
      const gameData = {
        started: true,
        turn: "joueur1",
        board: cards,
        matched: [],
        flipped: [],
        moves: 0,
        scores: { joueur1: 0, joueur2: 0 },
        sessions: data.sessions,
        noms: data.noms,
        timeStart: Date.now()
      };
      set(gameRef, gameData);
    }
  });
}

function setupListeners() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data || !data.board) return;

    const sessionId = sessionStorage.getItem("sessionId");
    if (data.sessions?.joueur1 === sessionId) player = "joueur1";
    if (data.sessions?.joueur2 === sessionId) player = "joueur2";

    document.getElementById("player1-name").innerHTML = `👤 ${data.noms?.joueur1 || "Joueur 1"}`;
    document.getElementById("player2-name").innerHTML = `👤 ${data.noms?.joueur2 || "Joueur 2"}`;

    renderGame(data);
    updateStatus(data);
  });
}

function renderGame(data) {
  const board = document.getElementById("game-board");
  if (!board) return;
  board.innerHTML = "";
  data.board.forEach((card, index) => {
    const isFlipped = data.flipped?.includes(index);
    const isMatched = data.matched?.includes(card.id);
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.dataset.index = index;
    cardEl.innerHTML = `
      <div class="inner ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''}">
        <div class="front"><img src="${card.img}" alt=""></div>
        <div class="back"><img src="files/verso.jpg" alt=""></div>
      </div>`;
    cardEl.addEventListener("click", () => {
      if (data.turn !== player) return;
      handleCardClick(index, card.id);
    });
    board.appendChild(cardEl);
  });
}

async function handleCardClick(index, id) {
  const snap = await get(gameRef);
  const data = snap.val();
  if (!data || data.turn !== player || data.flipped?.length >= 2) return;
  if (data.matched?.includes(id) || data.flipped?.includes(index)) return;

  const newFlipped = data.flipped ? [...data.flipped, index] : [index];
  update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 800);
  }
}

function checkMatch(flippedIndices, data) {
  const [i1, i2] = flippedIndices;
  const c1 = data.board[i1];
  const c2 = data.board[i2];
  let matched = data.matched || [];
  let scores = data.scores;
  let turn = data.turn;
  let move = (data.moves || 0) + 1;

  if (c1.id === c2.id && i1 !== i2) {
    matched.push(c1.id);
    scores[turn] += 1;
  } else {
    turn = turn === "joueur1" ? "joueur2" : "joueur1";
  }

  update(gameRef, {
    flipped: [],
    matched,
    turn,
    moves: move,
    scores
  });
}

function updateStatus(data) {
  document.getElementById("score1").textContent = data.scores?.joueur1 || 0;
  document.getElementById("score2").textContent = data.scores?.joueur2 || 0;
  document.getElementById("move-count").textContent = data.moves || 0;

  const now = Date.now();
  const elapsed = Math.floor((now - (data.timeStart || now)) / 1000);
  document.getElementById("timer").textContent = `${elapsed}s`;
  document.getElementById("start-time").textContent = new Date(data.timeStart).toLocaleTimeString();

  const p1 = document.getElementById("player1-name");
  const p2 = document.getElementById("player2-name");
  p1.classList.remove("active-player");
  p2.classList.remove("active-player");

  if (data.turn === "joueur1") {
    p1.classList.add("active-player");
    p1.innerHTML += " ✋";
  } else {
    p2.classList.add("active-player");
    p2.innerHTML += " ✋";
  }
}

function setupResetButton() {
  const btn = document.getElementById("reset-button");
  if (!btn) return;
  btn.disabled = player !== "joueur1";

  btn.addEventListener("click", () => {
    if (player === "joueur1") {
      remove(gameRef);
      window.location.reload();
    }
  });
}

init();
