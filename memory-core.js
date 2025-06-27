// memory-core.js
import { getDatabase, ref, get, update, onValue, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, 'game');
const sessionId = sessionStorage.getItem("sessionId");
const player = sessionStorage.getItem("player");

const flip1 = new Audio("files/flip1.mp3");
const flip2 = new Audio("files/flip2.mp3");

function renderGame(data) {
  const game = document.getElementById("game");
  if (!game) return;
  game.innerHTML = "";
  data.board.forEach((card, index) => {
    const isFlipped = data.flipped?.includes(index);
    const isMatched = data.matched?.includes(card.id);
    const div = document.createElement("div");
    div.className = `card ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`;
    div.dataset.index = index;
    div.innerHTML = `
      <div class="inner">
        <div class="front"><img src="${card.img}" alt=""></div>
        <div class="back"><img src="files/verso.jpg" alt=""></div>
      </div>`;
    div.addEventListener("click", () => {
      if (data.turn !== player || isFlipped || isMatched || data.flipped.length >= 2) return;
      handleCardClick(index, card.id);
    });
    game.appendChild(div);
  });
}

async function handleCardClick(index, id) {
  const snap = await get(gameRef);
  const data = snap.val();
  if (!data || data.flipped.includes(index) || data.matched.includes(id)) return;

  const newFlipped = [...data.flipped, index];
  if (newFlipped.length === 1) flip1.play();
  else flip2.play();

  update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 800);
  }
}

function checkMatch(indices, data) {
  const [i1, i2] = indices;
  const c1 = data.board[i1];
  const c2 = data.board[i2];

  let matched = [...data.matched];
  let scores = { ...data.scores };
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
  document.getElementById("score1").textContent = data.scores?.joueur1 || 0;
  document.getElementById("score2").textContent = data.scores?.joueur2 || 0;
  document.getElementById("move-count").textContent = data.moves || 0;

  const elapsed = Math.floor((Date.now() - (data.timeStart || Date.now())) / 1000);
  document.getElementById("timer").textContent = `${elapsed}s`;
  const start = new Date(data.timeStart);
  document.getElementById("start-time").textContent = start.toLocaleTimeString();

  const p1 = document.getElementById("player1-name");
  const p2 = document.getElementById("player2-name");
  p1.classList.remove("active-player");
  p2.classList.remove("active-player");
  if (data.turn === "joueur1") p1.classList.add("active-player");
  if (data.turn === "joueur2") p2.classList.add("active-player");
}

function setupListeners() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data) return;
    if (!data.board || !data.scores) return;
    renderGame(data);
    updateStatus(data);
  });
}

function setupResetButton() {
  const btn = document.getElementById("reset-button");
  if (!btn || player !== 'joueur1') return;
  btn.addEventListener("click", () => {
    if (confirm("Voulez-vous vraiment réinitialiser le jeu ?")) {
      remove(gameRef);
      location.reload();
    }
  });
}

setupListeners();
setupResetButton();
