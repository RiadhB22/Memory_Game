import { db } from "./firebase-init.js";
import {
  ref,
  set,
  onValue,
  update,
  remove,
  get,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { detectPlayerRole } from "./session.js";

const gameRef = ref(db, "game");

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}
const cards = images.sort(() => 0.5 - Math.random());

const sounds = {
  flip1: new Audio("files/flip1.mp3"),
  flip2: new Audio("files/flip2.mp3"),
};

let player;

init();

async function init() {
  player = await detectPlayerRole();
  if (!player) return;

  const p1 = sessionStorage.getItem("nomJoueur1") || "Joueur 1";
  const p2 = sessionStorage.getItem("nomJoueur2") || "Joueur 2";

  document.getElementById("player1-name").textContent = "👤 " + p1 + " :";
  document.getElementById("player2-name").textContent = "👤 " + p2 + " :";

  document.getElementById("reset-button").disabled = player !== "joueur1";
  document.getElementById("reset-button").addEventListener("click", () => {
    if (player === "joueur1") {
      remove(gameRef);
      location.reload();
    }
  });

  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    updateNames(data);
    renderGame(data);
    updateStatus(data);

    if (
      !data.started &&
      data.sessions?.joueur1 &&
      data.sessions?.joueur2
    ) {
      set(gameRef, {
        ...data,
        started: true,
        turn: "joueur1",
        board: cards,
        matched: [],
        flipped: [],
        moves: 0,
        scores: { joueur1: 0, joueur2: 0 },
        timeStart: Date.now(),
      });
    }
  });
}

function updateNames(data) {
  if (data.noms?.joueur1) {
    document.getElementById("player1-name").textContent =
      "👤 " + data.noms.joueur1 + " :";
  }
  if (data.noms?.joueur2) {
    document.getElementById("player2-name").textContent =
      "👤 " + data.noms.joueur2 + " :";
  }
}

function renderGame(data) {
  const game = document.getElementById("game");
  game.innerHTML = "";
  if (!data.board) return;

  data.board.forEach((card, index) => {
    const isFlipped = data.flipped?.includes(index);
    const isMatched = data.matched?.includes(card.id);
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.dataset.index = index;
    cardEl.innerHTML = `
      <div class="inner ${isFlipped || isMatched ? "flipped" : ""} ${
      isMatched ? "matched" : ""
    }">
        <div class="front"><img src="${card.img}" alt="carte"></div>
        <div class="back"><img src="files/verso.jpg" alt="verso"></div>
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

  const newFlipped = data.flipped ? [...data.flipped, index] : [index];
  sounds[newFlipped.length === 1 ? "flip1" : "flip2"].play();

  await update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 1000);
  }
}

function checkMatch(indices, data) {
  const [i1, i2] = indices;
  const c1 = data.board[i1];
  const c2 = data.board[i2];

  let matched = [...(data.matched || [])];
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
    moves,
  });
}

function updateStatus(data) {
  document.getElementById("score1").textContent =
    data.scores?.joueur1 || 0;
  document.getElementById("score2").textContent =
    data.scores?.joueur2 || 0;
  document.getElementById("move-count").textContent =
    data.moves || 0;

  const elapsed = Math.floor(
    (Date.now() - (data.timeStart || Date.now())) / 1000
  );
  document.getElementById("timer").textContent = `${elapsed}s`;

  const p1 = document.getElementById("player1-name");
  const p2 = document.getElementById("player2-name");
  p1.classList.remove("active-player");
  p2.classList.remove("active-player");
  if (data.turn === "joueur1") p1.classList.add("active-player");
  if (data.turn === "joueur2") p2.classList.add("active-player");
}
