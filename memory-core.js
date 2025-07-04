// memory-core.js
import { ref, get, update, onValue } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { gameRef, player, sessionId } from "./session.js";

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}
let cards = images.sort(() => Math.random() - 0.5);

const sounds = {
  flip1: new Audio("files/flip1.mp3"),
  flip2: new Audio("files/flip2.mp3")
};

export function initGameListeners() {
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    renderBoard(data);
    updateStatus(data);
  });
}

function renderBoard(data) {
  const board = document.getElementById("game");
  board.innerHTML = "";
  data.board?.forEach((card, index) => {
    const flipped = data.flipped?.includes(index);
    const matched = data.matched?.includes(card.id);
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="inner ${flipped || matched ? "flipped" : ""}">
        <div class="front"><img src="${card.img}" /></div>
        <div class="back"><img src="files/verso.jpg" /></div>
      </div>`;
    div.addEventListener("click", () => handleCardClick(index, card.id, data));
    board.appendChild(div);
  });
}

function handleCardClick(index, id, data) {
  if (player !== data.turn) return;
  if (data.flipped?.length >= 2 || data.flipped?.includes(index)) return;
  if (data.matched?.includes(id)) return;

  const flipped = [...(data.flipped || []), index];
  sounds[flipped.length === 1 ? "flip1" : "flip2"].play();
  update(gameRef, { flipped });

  if (flipped.length === 2) {
    setTimeout(() => checkMatch(flipped, data), 1000);
  }
}

function checkMatch([i1, i2], data) {
  const card1 = data.board[i1];
  const card2 = data.board[i2];
  let matched = data.matched || [];
  let scores = data.scores || { joueur1: 0, joueur2: 0 };
  let turn = data.turn;
  let moves = data.moves || 0;

  if (card1.id === card2.id && i1 !== i2) {
    matched.push(card1.id);
    scores[turn] += 1;
  } else {
    turn = turn === "joueur1" ? "joueur2" : "joueur1";
  }

  update(gameRef, {
    flipped: [],
    matched,
    scores,
    turn,
    moves: moves + 1
  });
}

function updateStatus(data) {
  document.getElementById("score1").textContent = data.scores?.joueur1 || 0;
  document.getElementById("score2").textContent = data.scores?.joueur2 || 0;
  document.getElementById("move-count").textContent = data.moves || 0;

  const t = Date.now() - (data.timeStart || Date.now());
  document.getElementById("timer").textContent = `${Math.floor(t / 1000)}s`;
}
