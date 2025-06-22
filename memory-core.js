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

const sessionId = crypto.randomUUID();
sessionStorage.setItem("sessionId", sessionId);

let player;

const waitingEl = document.getElementById("waiting-message");

async function detectPlayerRole() {
  const snap = await get(gameRef);
  const data = snap.val();
  const nom = prompt("Entrez votre nom :") || "Anonyme";

  if (!data || !data.sessions || !data.sessions.joueur1) {
    player = "joueur1";
    await set(gameRef, {
      sessions: { joueur1: sessionId },
      noms: { joueur1: nom },
      started: false
    });
  } else if (!data.sessions.joueur2) {
    player = "joueur2";
    await update(gameRef, {
      sessions: { ...data.sessions, joueur2: sessionId },
      noms: { ...data.noms, joueur2: nom }
    });
  } else {
    alert("Deux joueurs sont déjà connectés.");
    throw new Error("Session pleine");
  }

  sessionStorage.setItem("player", player);
  sessionStorage.setItem("nom", nom);
}

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}

const cards = images.sort(() => 0.5 - Math.random());
const sounds = {
  flip1: new Audio("files/flip1.mp3"),
  flip2: new Audio("files/flip2.mp3")
};

await init();

async function init() {
  await detectPlayerRole();

  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data) return;

    if (data.sessions.joueur1 && data.sessions.joueur2) {
      waitingEl.style.display = "none";
    } else {
      waitingEl.style.display = "block";
    }

    const noms = data.noms || {};
    document.getElementById("player1-name").textContent = (data.turn === 'joueur1' ? "▶️ " : "") + (noms.joueur1 || "Joueur 1") + " :";
    document.getElementById("player2-name").textContent = (data.turn === 'joueur2' ? "▶️ " : "") + (noms.joueur2 || "Joueur 2") + " :";

    document.getElementById("reset-button").disabled = player !== 'joueur1';

    if (!data.started && player === "joueur1" && data.sessions.joueur2) {
      const gameData = {
        ...data,
        board: cards,
        matched: [],
        flipped: [],
        turn: "joueur1",
        moves: 0,
        scores: { joueur1: 0, joueur2: 0 },
        timeStart: Date.now(),
        started: true
      };
      set(gameRef, gameData);
    }

    if (data.started) {
      renderGame(data);
      updateStatus(data);
    }
  });

  setupResetButton();
}

function renderGame(data) {
  const game = document.getElementById("game");
  game.innerHTML = "";
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
      if (data.turn !== player || isFlipped || isMatched) return;
      handleCardClick(index, card.id);
    });
    game.appendChild(cardEl);
  });
}

async function handleCardClick(index, id) {
  const snap = await get(gameRef);
  const data = snap.val();
  if (!data || data.flipped.length >= 2) return;

  const newFlipped = [...data.flipped, index];
  sounds[newFlipped.length === 1 ? 'flip1' : 'flip2'].play();
  await update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 1000);
  }
}

function checkMatch([i1, i2], data) {
  const c1 = data.board[i1];
  const c2 = data.board[i2];
  let matched = data.matched || [];
  let scores = data.scores;
  let turn = data.turn;
  let moves = data.moves + 1;

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
    moves,
    scores
  });
}

function updateStatus(data) {
  document.getElementById("score1").textContent = data.scores.joueur1;
  document.getElementById("score2").textContent = data.scores.joueur2;
  document.getElementById("move-count").textContent = data.moves;

  const now = Date.now();
  const elapsed = Math.floor((now - data.timeStart) / 1000);
  document.getElementById("timer").textContent = `${elapsed}s`;

  const startTime = new Date(data.timeStart);
  document.getElementById("start-time").textContent = startTime.toLocaleTimeString();
}

function setupResetButton() {
  document.getElementById("reset-button").addEventListener("click", () => {
    if (player !== 'joueur1') return;
    remove(gameRef);
    window.location.reload();
  });
}
