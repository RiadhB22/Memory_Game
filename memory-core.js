// memory-core.js
import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { firebaseConfig, sessionId, player, detectPlayerRole } from "./session.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const gameRef = ref(db, 'game');

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}

const cards = images.sort(() => 0.5 - Math.random());
const sounds = {
  flip1: new Audio("files/flip1.mp3"),
  flip2: new Audio("files/flip2.mp3"),
  error: new Audio("files/error.mp3")
};

init();

async function init() {
  await detectPlayerRole();
  document.getElementById("reset-button").disabled = player !== 'joueur1';
  document.getElementById("reset-button").style.cursor = player !== 'joueur1' ? 'not-allowed' : 'pointer';
  setupListeners();
  setupResetButton();
  checkStart();
}

function checkStart() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    const waitingEl = document.getElementById("waiting-message");

    if (data && data.sessions?.joueur1 && data.sessions?.joueur2) {
      if (waitingEl) waitingEl.style.display = "none";
    } else if (player === "joueur1" && waitingEl) {
      waitingEl.style.display = "block";
    }

    if (!data || !data.started) {
      if (data?.sessions?.joueur1 && data?.sessions?.joueur2 && player === "joueur1") {
        const gameData = {
          started: true,
          turn: "joueur1",
          board: cards,
          matched: [],
          flipped: [],
          moves: 0,
          sessions: data.sessions,
          scores: { joueur1: 0, joueur2: 0 },
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

    if ((data.sessions?.joueur1 === sessionId && player !== "joueur1") ||
        (data.sessions?.joueur2 === sessionId && player !== "joueur2")) {
      alert("Ce navigateur est déjà inscrit. Utilisez un autre navigateur pour l’autre joueur.");
      return;
    }

    updateNamesUI(data);
    renderGame(data);
    updateStatus(data);
  });
}

function updateNamesUI(data) {
  const nom1 = data.sessions?.nomJoueur1 || "Joueur 1";
  const nom2 = data.sessions?.nomJoueur2 || "Joueur 2";
  document.getElementById("player1-name").textContent = `${data.turn === 'joueur1' ? '🖐️ ' : ''}${nom1} :`;
  document.getElementById("player2-name").textContent = `${data.turn === 'joueur2' ? '🖐️ ' : ''}${nom2} :`;
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
      if (data.flipped?.length >= 2) {
        sounds.error.play();
        return;
      }
      handleCardClick(index, card.id);
    });
    game.appendChild(cardEl);
  });
}

async function handleCardClick(index, id) {
  const snap = await get(gameRef);
  const data = snap.val();
  if (!data || data.turn !== player || data.flipped?.length >= 2 ||
      data.matched?.includes(id) || data.flipped?.includes(index)) return;

  const newFlipped = data.flipped ? [...data.flipped, index] : [index];
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
  document.getElementById("score1").textContent = `Score : ${data.scores?.joueur1 || 0}`;
  document.getElementById("score2").textContent = `Score : ${data.scores?.joueur2 || 0}`;
  document.getElementById("move-count").textContent = data.moves || 0;

  const now = Date.now();
  const elapsed = Math.floor((now - (data.timeStart || now)) / 1000);
  document.getElementById("timer").textContent = `${elapsed}s`;
  document.getElementById("start-time").textContent = new Date(data.timeStart).toLocaleTimeString();

  const p1 = document.getElementById("player1-name");
  const p2 = document.getElementById("player2-name");
  p1.classList.remove("active-player");
  p2.classList.remove("active-player");
  if (data.turn === "joueur1") p1.classList.add("active-player");
  if (data.turn === "joueur2") p2.classList.add("active-player");
}

function setupResetButton() {
  document.getElementById("reset-button").addEventListener("click", () => {
    if (player !== 'joueur1') return;
    if (confirm("Êtes-vous sûr de vouloir recommencer ? Le jeu en cours sera annulé.")) {
      remove(gameRef);
      window.location.reload();
    }
  });
}
