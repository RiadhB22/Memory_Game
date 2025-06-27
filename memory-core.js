import { ref, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}
const cards = images.sort(() => Math.random() - 0.5);

export function initGame(db, player) {
  const gameRef = ref(db, "game");

  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data || !data.board) return;

    updateUI(data, player);
    renderGame(data, player, gameRef);
  });

  // Initialiser partie si joueur 1 et tout prêt
  onValue(gameRef, (snap) => {
    const data = snap.val();
    if (player === "joueur1" && data?.sessions?.joueur1 && data?.sessions?.joueur2 && !data.started) {
      set(gameRef, {
        ...data,
        started: true,
        turn: "joueur1",
        board: cards,
        flipped: [],
        matched: [],
        scores: { joueur1: 0, joueur2: 0 },
        moves: 0,
        timeStart: Date.now()
      });
    }
  });

  document.getElementById("reset-button").addEventListener("click", () => {
    if (player === "joueur1") {
      remove(gameRef);
      location.reload();
    }
  });
}

function renderGame(data, player, gameRef) {
  const gameBoard = document.getElementById("game");
  gameBoard.innerHTML = "";
  data.board.forEach((card, index) => {
    const isFlipped = data.flipped?.includes(index);
    const isMatched = data.matched?.includes(card.id);
    const cardEl = document.createElement("div");
    cardEl.className = `card ${isMatched ? "matched" : ""}`;
    cardEl.innerHTML = `
      <div class="inner ${isFlipped || isMatched ? "flipped" : ""}">
        <div class="front"><img src="${card.img}" alt=""></div>
        <div class="back"><img src="files/verso.jpg" alt=""></div>
      </div>
    `;
    cardEl.addEventListener("click", () => {
      if (player !== data.turn || isMatched || data.flipped?.includes(index)) return;
      handleCardClick(index, card.id, data, gameRef);
    });
    gameBoard.appendChild(cardEl);
  });
}

function handleCardClick(index, id, data, gameRef) {
  const flipped = data.flipped || [];
  if (flipped.length >= 2) return;

  const newFlipped = [...flipped, index];
  update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data, gameRef), 1000);
  }
}

function checkMatch([i1, i2], data, gameRef) {
  const c1 = data.board[i1];
  const c2 = data.board[i2];

  const matched = data.matched || [];
  const scores = data.scores || { joueur1: 0, joueur2: 0 };
  let turn = data.turn;
  let moves = (data.moves || 0) + 1;

  if (c1.id === c2.id && i1 !== i2) {
    matched.push(c1.id);
    scores[turn]++;
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

function updateUI(data, player) {
  document.getElementById("score1").textContent = data.scores?.joueur1 ?? 0;
  document.getElementById("score2").textContent = data.scores?.joueur2 ?? 0;
  document.getElementById("move-count").textContent = data.moves ?? 0;

  const elapsed = Math.floor((Date.now() - (data.timeStart || Date.now())) / 1000);
  document.getElementById("timer").textContent = `${elapsed}s`;
  document.getElementById("start-time").textContent = new Date(data.timeStart).toLocaleTimeString();

  const p1 = document.getElementById("player1-name");
  const p2 = document.getElementById("player2-name");

  p1.classList.remove("active-player");
  p2.classList.remove("active-player");

  if (data.turn === "joueur1") p1.classList.add("active-player");
  if (data.turn === "joueur2") p2.classList.add("active-player");

  const nom1 = sessionStorage.getItem("nomJoueur1") || "---";
  const nom2 = sessionStorage.getItem("nomJoueur2") || "---";
  p1.textContent = `Joueur 1 : ${nom1}`;
  p2.textContent = `Joueur 2 : ${nom2}`;
}
