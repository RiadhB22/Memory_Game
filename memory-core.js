// memory-core.js
import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

const sounds = {
  flip1: new Audio("files/flip1.mp3"),
  flip2: new Audio("files/flip2.mp3")
};

let player = null;
let sessionId = null;
let playerName = null;

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}

const cards = images.sort(() => 0.5 - Math.random());

export async function initGame(nom, role) {
  player = role;
  playerName = nom;
  sessionId = localStorage.getItem("memory_session_id");

  document.getElementById(`${player}-name`).textContent = `${nom} :`;
  document.getElementById("reset-button").disabled = player !== "joueur1";

  setupListeners();
  setupReset();
  checkStart();
}

function setupListeners() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data || !data.board) return;

    if (!data.sessions?.joueur1 || !data.sessions?.joueur2) {
      document.getElementById("waiting-message").textContent = "⏳ En attente de l'autre joueur...";
    } else {
      document.getElementById("waiting-message").textContent = "";
    }

    renderBoard(data);
    updateUI(data);
  });
}

function checkStart() {
  onValue(gameRef, snapshot => {
    const data = snapshot.val();
    if (!data?.started && data?.sessions?.joueur1 && data?.sessions?.joueur2) {
      const newGame = {
        started: true,
        turn: "joueur1",
        board: cards,
        flipped: [],
        matched: [],
        moves: 0,
        scores: { joueur1: 0, joueur2: 0 },
        timeStart: Date.now(),
        sessions: data.sessions,
        noms: {
          joueur1: player === "joueur1" ? playerName : data.noms?.joueur1,
          joueur2: player === "joueur2" ? playerName : data.noms?.joueur2
        }
      };
      set(gameRef, newGame);
    } else {
      update(gameRef, {
        [`noms/${player}`]: playerName
      });
    }
  });
}

function renderBoard(data) {
  const board = document.getElementById("game-board");
  board.innerHTML = "";
  data.board.forEach((card, index) => {
    const flipped = data.flipped.includes(index);
    const matched = data.matched.includes(card.id);
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.innerHTML = `
      <div class="inner ${flipped || matched ? 'flipped' : ''} ${matched ? 'matched' : ''}">
        <div class="front"><img src="${card.img}" /></div>
        <div class="back"><img src="files/verso.jpg" /></div>
      </div>
    `;
    cardDiv.addEventListener("click", () => handleFlip(index, card.id));
    board.appendChild(cardDiv);
  });
}

async function handleFlip(index, id) {
  const snap = await get(gameRef);
  const data = snap.val();
  if (!data || data.turn !== player || data.flipped.length >= 2) return;
  if (data.matched.includes(id) || data.flipped.includes(index)) return;

  const newFlipped = [...data.flipped, index];
  sounds[newFlipped.length === 1 ? 'flip1' : 'flip2'].play();
  await update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data), 1000);
  }
}

function checkMatch(flippedIndices, data) {
  const [i1, i2] = flippedIndices;
  const c1 = data.board[i1];
  const c2 = data.board[i2];
  let matched = [...data.matched];
  let scores = { ...data.scores };
  let turn = data.turn;
  let moves = data.moves + 1;

  if (c1.id === c2.id) {
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

function updateUI(data) {
  document.getElementById("score1").textContent = data.scores.joueur1;
  document.getElementById("score2").textContent = data.scores.joueur2;
  document.getElementById("move-count").textContent = data.moves;

  const duration = Math.floor((Date.now() - data.timeStart) / 1000);
  document.getElementById("timer").textContent = `${duration}s`;
  const startTime = new Date(data.timeStart);
  document.getElementById("start-time").textContent = startTime.toLocaleTimeString();

  document.getElementById("player1-name").classList.remove("active-player");
  document.getElementById("player2-name").classList.remove("active-player");

  if (data.turn === "joueur1") {
    document.getElementById("player1-name").classList.add("active-player");
  } else {
    document.getElementById("player2-name").classList.add("active-player");
  }

  if (data.noms) {
    if (data.noms.joueur1) {
      document.getElementById("player1-name").textContent = `${data.noms.joueur1} :`;
    }
    if (data.noms.joueur2) {
      document.getElementById("player2-name").textContent = `${data.noms.joueur2} :`;
    }
  }
}

function setupReset() {
  document.getElementById("reset-button").addEventListener("click", () => {
    if (player !== 'joueur1') return;
    remove(gameRef);
    window.location.reload();
  });
}
