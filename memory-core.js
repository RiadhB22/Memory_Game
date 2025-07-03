import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

const sounds = {
  flip1: new Audio("files/flip1.mp3"),
  flip2: new Audio("files/flip2.mp3")
};

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}
let cards = images.sort(() => 0.5 - Math.random());

let player = sessionStorage.getItem("player");
let sessionId = sessionStorage.getItem("sessionId");

function renderHeader(data) {
  const header = document.getElementById("header");
  header.innerHTML = `
    <span class="${data.turn === 'joueur1' ? 'active' : ''}">🧑 ${data.names?.joueur1 || "Joueur 1"} : <strong>${data.scores?.joueur1 || 0}</strong></span>
    <span>🕒 Début : ${new Date(data.timeStart).toLocaleTimeString()}</span>
    <span>🎯 Coups : ${data.moves}</span>
    <span>⏱ Durée : <span id="duration">0s</span></span>
    <span class="${data.turn === 'joueur2' ? 'active' : ''}">🧑 ${data.names?.joueur2 || "Joueur 2"} : <strong>${data.scores?.joueur2 || 0}</strong></span>
  `;
}

function renderGame(data) {
  const board = document.getElementById("game");
  board.innerHTML = "";
  data.board.forEach((card, index) => {
    const isFlipped = data.flipped.includes(index);
    const isMatched = data.matched.includes(card.id);
    const div = document.createElement("div");
    div.className = `card ${isMatched ? 'matched' : ''}`;
    div.innerHTML = `
      <div class="inner ${isFlipped ? 'flipped' : ''}">
        <div class="front"><img src="${card.img}" alt=""></div>
        <div class="back"><img src="files/verso.jpg" alt=""></div>
      </div>`;
    div.addEventListener("click", () => handleCardClick(index, card.id, data));
    board.appendChild(div);
  });
}

async function handleCardClick(index, id, data) {
  if (data.turn !== player || data.flipped.length >= 2 || data.flipped.includes(index)) return;
  const newFlipped = [...data.flipped, index];
  sounds[newFlipped.length === 1 ? 'flip1' : 'flip2'].play();
  await update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 1000);
  }
}

async function checkMatch([i1, i2], data) {
  const c1 = data.board[i1];
  const c2 = data.board[i2];
  let matched = [...data.matched];
  let scores = { ...data.scores };
  let turn = data.turn;
  if (c1.id === c2.id) {
    matched.push(c1.id);
    scores[turn] += 1;
  } else {
    turn = turn === "joueur1" ? "joueur2" : "joueur1";
  }
  await update(gameRef, {
    flipped: [],
    matched,
    turn,
    moves: data.moves + 1,
    scores
  });
}

function updateDuration(start) {
  setInterval(() => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const el = document.getElementById("duration");
    if (el) el.textContent = `${elapsed}s`;
  }, 1000);
}

export function launchGame() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data || !data.board) return;
    renderHeader(data);
    renderGame(data);
    updateDuration(data.timeStart);
  });
}

export async function createGame(name, role) {
  const snapshot = await get(gameRef);
  const data = snapshot.val();
  sessionId = crypto.randomUUID();
  sessionStorage.setItem("sessionId", sessionId);
  sessionStorage.setItem("player", role);

  const names = data?.names || {};
  names[role] = name;
  const sessions = data?.sessions || {};
  sessions[role] = sessionId;

  if (!data || !data.started) {
    const gameData = {
      started: true,
      board: cards,
      matched: [],
      flipped: [],
      moves: 0,
      scores: { joueur1: 0, joueur2: 0 },
      names,
      sessions,
      turn: "joueur1",
      timeStart: Date.now()
    };
    await set(gameRef, gameData);
  } else {
    await update(gameRef, { names, sessions });
  }
}

export async function clearGame() {
  await remove(gameRef);
}
