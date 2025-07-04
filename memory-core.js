// memory-core.js
import app from "./firebase-init.js";
import { getDatabase, ref, set, update, get, onValue, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initSession } from "./session.js";

const db = getDatabase(app);
const gameRef = ref(db, "game");

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}
let cards = images.sort(() => 0.5 - Math.random());

let player = "";
let sessionId = "";

await init();

async function init() {
  await initSession();

  player = sessionStorage.getItem("player");
  sessionId = sessionStorage.getItem("sessionId");

  document.getElementById("reset").disabled = player !== "joueur1";

  document.getElementById("reset").addEventListener("click", () => {
    if (player === "joueur1") {
      remove(gameRef);
      window.location.reload();
    }
  });

  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data || !data.board || !data.sessions?.joueur1 || !data.sessions?.joueur2) {
      document.getElementById("waiting-message").classList.remove("hidden");
      return;
    }

    document.getElementById("waiting-message").classList.add("hidden");
    updateUI(data);
    renderBoard(data);
  });

  const snap = await get(gameRef);
  const data = snap.val();

  if (!data || !data.started) {
    const gameData = {
      started: true,
      turn: "joueur1",
      board: cards,
      matched: [],
      flipped: [],
      moves: 0,
      scores: { joueur1: 0, joueur2: 0 },
      timeStart: Date.now(),
      sessions: data?.sessions || {},
      noms: data?.noms || {}
    };
    await set(gameRef, gameData);
  }
}

function renderBoard(data) {
  const board = document.getElementById("game");
  board.innerHTML = "";

  data.board.forEach((card, index) => {
    const isFlipped = data.flipped.includes(index);
    const isMatched = data.matched.includes(card.id);

    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.dataset.index = index;

    cardEl.innerHTML = `
      <div class="inner ${isFlipped || isMatched ? "flipped" : ""} ${isMatched ? "matched" : ""}">
        <div class="front"><img src="${card.img}" /></div>
        <div class="back"><img src="files/verso.jpg" /></div>
      </div>
    `;

    cardEl.addEventListener("click", () => {
      if (data.turn !== player || isMatched || isFlipped || data.flipped.length >= 2) return;
      handleFlip(index);
    });

    board.appendChild(cardEl);
  });
}

async function handleFlip(index) {
  const snap = await get(gameRef);
  const data = snap.val();
  const newFlipped = [...data.flipped, index];
  await update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 800);
  }
}

function checkMatch([i1, i2], data) {
  const c1 = data.board[i1];
  const c2 = data.board[i2];
  const matched = data.matched || [];
  let scores = data.scores;
  let turn = data.turn;
  let move = (data.moves || 0) + 1;

  if (c1.id === c2.id && i1 !== i2) {
    matched.push(c1.id);
    scores[turn]++;
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

function updateUI(data) {
  document.getElementById("score1").textContent = `Score: ${data.scores?.joueur1 || 0}`;
  document.getElementById("score2").textContent = `Score: ${data.scores?.joueur2 || 0}`;
  document.getElementById("move-count").textContent = `Coups: ${data.moves || 0}`;

  const now = Date.now();
  const elapsed = Math.floor((now - (data.timeStart || now)) / 1000);
  document.getElementById("timer").textContent = `⏱️ ${elapsed}s`;

  const p1 = document.getElementById("player1-name");
  const p2 = document.getElementById("player2-name");
  p1.classList.remove("active-player");
  p2.classList.remove("active-player");
  if (data.turn === "joueur1") p1.classList.add("active-player");
  if (data.turn === "joueur2") p2.classList.add("active-player");
}
