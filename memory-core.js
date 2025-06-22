// memory-core.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAV8RMYwJ4-r5oGn6I1zPsVDTXkQE-GRpM",
  authDomain: "memorygame-70305.firebaseapp.com",
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "memorygame-70305",
  storageBucket: "memorygame-70305.appspot.com",
  messagingSenderId: "700177553228",
  appId: "1:700177553228:web:4a750936d2866eeface1e9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const gameRef = ref(db, 'game');

// Nettoyage automatique au début (pour tests)
localStorage.removeItem("memory_session_id");
sessionStorage.clear();

let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

let player = sessionStorage.getItem("player");

const images = [];
for (let i = 1; i <= 6; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}
let cards = images.sort(() => 0.5 - Math.random());

const sounds = {
  flip1: new Audio("files/flip1.mp3"),
  flip2: new Audio("files/flip2.mp3")
};

await init();

export async function init() {
  await detectPlayerRole();
  document.getElementById("reset-button").disabled = player !== 'joueur1';
  setupListeners();
  setupResetButton();
  checkStart();
}

async function detectPlayerRole() {
  const snap = await get(gameRef);
  const data = snap.val();
  const nom = prompt("Entrez votre nom :") || "Anonyme";

  if (!data || !data.sessions) {
    await set(gameRef, {
      started: false,
      sessions: { joueur1: sessionId },
      names: { joueur1: nom },
      scores: { joueur1: 0, joueur2: 0 },
      matched: [], flipped: [], moves: 0
    });
    player = "joueur1";
  } else if (!data.sessions.joueur2) {
    await update(gameRef, {
      'sessions/joueur2': sessionId,
      'names/joueur2': nom
    });
    player = "joueur2";
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return;
  }
  sessionStorage.setItem("player", player);
  sessionStorage.setItem("nomJoueur", nom);
}

function checkStart() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data || !data.sessions || !data.names) return;

    const p1 = data.names.joueur1;
    const p2 = data.names.joueur2;

    document.getElementById("player1-name").textContent = "👤 " + (p1 || "Joueur 1") + " :";
    document.getElementById("player2-name").textContent = "👤 " + (p2 || "Joueur 2") + " :";

    if (data.sessions.joueur1 && data.sessions.joueur2 && !data.started) {
      update(gameRef, {
        started: true,
        turn: "joueur1",
        board: cards,
        timeStart: Date.now()
      });
    }
  });
}

function setupListeners() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data || !data.board) return;
    renderGame(data);
    updateStatus(data);
  });
}

function renderGame(data) {
  const game = document.getElementById("game");
  game.innerHTML = "";
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
    game.appendChild(cardEl);
  });
}

async function handleCardClick(index, id) {
  const snap = await get(gameRef);
  const data = snap.val();
  if (!data || data.turn !== player || data.flipped?.length >= 2) return;
  if (data.matched?.includes(id) || data.flipped?.includes(index)) return;

  const newFlipped = [...(data.flipped || []), index];
  sounds[newFlipped.length === 1 ? 'flip1' : 'flip2'].play();

  update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 800);
  }
}

function checkMatch([i1, i2], data) {
  const c1 = data.board[i1];
  const c2 = data.board[i2];
  let matched = [...(data.matched || [])];
  let scores = data.scores;
  let turn = data.turn;
  let moves = (data.moves || 0) + 1;

  if (c1.id === c2.id && i1 !== i2) {
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
  document.getElementById("score1").textContent = data.scores.joueur1;
  document.getElementById("score2").textContent = data.scores.joueur2;
  document.getElementById("move-count").textContent = data.moves;

  const elapsed = Math.floor((Date.now() - (data.timeStart || Date.now())) / 1000);
  document.getElementById("timer").textContent = `${elapsed}s`;

  const startTime = new Date(data.timeStart);
  document.getElementById("start-time").textContent = startTime.toLocaleTimeString();

  document.getElementById("player1-name").classList.toggle("active-player", data.turn === "joueur1");
  document.getElementById("player2-name").classList.toggle("active-player", data.turn === "joueur2");
}

function setupResetButton() {
  document.getElementById("reset-button").addEventListener("click", () => {
    if (player === 'joueur1') {
      remove(gameRef);
      location.reload();
    }
  });
}
