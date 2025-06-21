// memory-core.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Firebase config
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

  if (!data || !data.sessions?.joueur1) {
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    player = "joueur1";
    return;
  }

  if (!data.sessions?.joueur2) {
    sessionStorage.setItem("player", "joueur2");
    sessionStorage.setItem("nomJoueur2", nom);
    player = "joueur2";
    update(gameRef, {
      'sessions/joueur2': sessionId,
      'names/joueur2': nom
    });
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

function checkStart() {
  const waitingEl = document.getElementById("waiting-message");

  onValue(gameRef, snapshot => {
    const data = snapshot.val();

    if (!data || !data.started) {
      waitingEl.style.display = "block";

      const nom1 = sessionStorage.getItem("nomJoueur1");
      const nom2 = sessionStorage.getItem("nomJoueur2");
      const session1 = sessionStorage.getItem("sessionId");

      if (player === "joueur1" && nom1 && data?.sessions?.joueur2) {
        const gameData = {
          started: true,
          turn: "joueur1",
          board: cards,
          matched: [],
          flipped: [],
          moves: 0,
          sessions: {
            joueur1: session1,
            joueur2: data.sessions.joueur2
          },
          names: {
            joueur1: nom1,
            joueur2: data.names?.joueur2 || "Joueur 2"
          },
          scores: { joueur1: 0, joueur2: 0 },
          timeStart: Date.now()
        };
        set(gameRef, gameData);
      }
      return;
    }

    waitingEl.style.display = "none";
  });
}

function setupListeners() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data || !data.board) return;

    const sessionId = sessionStorage.getItem("sessionId");
    if (data.sessions?.joueur1 === sessionId && player !== "joueur1") {
      alert("Ce navigateur est déjà inscrit comme Joueur 1.");
      return;
    }
    if (data.sessions?.joueur2 === sessionId && player !== "joueur2") {
      alert("Ce navigateur est déjà inscrit comme Joueur 2.");
      return;
    }

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
  if (!data || data.turn !== player || (data.flipped?.length >= 2)) return;
  if (data.matched?.includes(id)) return;
  if (data.flipped?.includes(index)) return;

  const newFlipped = [...(data.flipped || []), index];
  sounds[newFlipped.length === 1 ? 'flip1' : 'flip2'].play();

  update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 800);
  }
}

function checkMatch(flippedIndices, data) {
  const [i1, i2] = flippedIndices;
  const c1 = data.board[i1];
  const c2 = data.board[i2];

  let matched = [...(data.matched || [])];
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

  const p1 = document.getElementById("player1-name");
  const p2 = document.getElementById("player2-name");

  p1.classList.toggle("active-player", data.turn === "joueur1");
  p2.classList.toggle("active-player", data.turn === "joueur2");

  p1.textContent = `👤 ${data.names?.joueur1 || "Joueur 1"} :`;
  p2.textContent = `👤 ${data.names?.joueur2 || "Joueur 2"} :`;
}

function setupResetButton() {
  document.getElementById("reset-button").addEventListener("click", () => {
    if (player !== 'joueur1') return;
    remove(gameRef);
    window.location.reload();
  });
}
