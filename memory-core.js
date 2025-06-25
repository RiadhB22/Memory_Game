// memory-core.js
import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

let player = sessionStorage.getItem("player");

async function detectPlayerRole() {
  const snap = await get(gameRef);
  const data = snap.val();
  const nom = prompt("Entrez votre nom :");

  if (!data) {
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    player = "joueur1";
    await update(gameRef, { sessions: { joueur1: sessionId }, noms: { joueur1: nom } });
    return;
  }

  if (!data.sessions?.joueur1) {
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    player = "joueur1";
    await update(gameRef, { "sessions/joueur1": sessionId, "noms/joueur1": nom });
    return;
  }

  if (!data.sessions?.joueur2) {
    sessionStorage.setItem("player", "joueur2");
    sessionStorage.setItem("nomJoueur2", nom);
    player = "joueur2";
    await update(gameRef, { "sessions/joueur2": sessionId, "noms/joueur2": nom });
    return;
  }

  alert("Deux joueurs sont déjà connectés.");
}

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}

let cards = images.sort(() => 0.5 - Math.random());

export async function init() {
  await detectPlayerRole();
  setupListeners();
  setupResetButton();
  checkStart();
}

function checkStart() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data || !data.started) {
      const session1 = sessionStorage.getItem("sessionId");
      if (player === "joueur1") {
        const gameData = {
          started: true,
          turn: "joueur1",
          board: cards,
          matched: [],
          flipped: [],
          moves: 0,
          sessions: { joueur1: session1 },
          scores: { joueur1: 0, joueur2: 0 },
          noms: { joueur1: sessionStorage.getItem("nomJoueur1") },
          timeStart: Date.now()
        };
        set(gameRef, gameData);
      }
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

    document.getElementById("player1-name").textContent = `👤 ${data.noms?.joueur1 || "Joueur 1"}`;
    document.getElementById("player2-name").textContent = `👤 ${data.noms?.joueur2 || "Joueur 2"}`;

    renderGame(data);
    updateStatus(data);
  });
}

function renderGame(data) {
  const board = document.getElementById("game-board");
  board.innerHTML = "";

  data.board.forEach((card, index) => {
    const isFlipped = data.flipped && data.flipped.includes(index);
    const isMatched = data.matched && data.matched.includes(card.id);
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
  if (!data || data.turn !== player || (data.flipped && data.flipped.length >= 2)) return;
  if (data.matched && data.matched.includes(id)) return;
  if (data.flipped && data.flipped.includes(index)) return;

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
  let move = data.moves + 1;

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

  const startTime = new Date(data.timeStart);
  document.getElementById("start-time").textContent = startTime.toLocaleTimeString();

  document.getElementById("player1-name").classList.remove("active-player");
  document.getElementById("player2-name").classList.remove("active-player");
  if (data.turn === "joueur1") document.getElementById("player1-name").classList.add("active-player");
  if (data.turn === "joueur2") document.getElementById("player2-name").classList.add("active-player");
}

function setupResetButton() {
  document.getElementById("reset-button").addEventListener("click", () => {
    if (player !== 'joueur1') return;
    remove(gameRef);
    window.location.reload();
  });
}

init();
