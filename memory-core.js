// ✅ memory-core.js

export async function initGame(gameRef) {
  const { get, set } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js');
  const snap = await get(gameRef);
  const data = snap.val();
  if (!data || !data.board || data.board.length === 0) {
    const cards = [];
    for (let i = 1; i <= 20; i++) {
      cards.push({ id: i, img: `files/${i}-1.jpg` });
      cards.push({ id: i, img: `files/${i}-2.jpg` });
    }
    const shuffled = cards.sort(() => 0.5 - Math.random());
    await set(gameRef, { ...data, board: shuffled, flipped: [], matched: [] });
  }
}

export function renderGame(data, currentPlayer, gameRef) {
  const gameContainer = document.getElementById("game");
  if (!gameContainer) return;
  gameContainer.innerHTML = "";

  if (!data.board || data.board.length === 0) return;

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
      if (data.turn !== currentPlayer || isMatched || isFlipped || data.flipped.length >= 2) return;
      handleCardClick(index, card.id, gameRef, currentPlayer);
    });

    gameContainer.appendChild(cardEl);
  });

  updateHeader(data, currentPlayer);
}

function updateHeader(data, currentPlayer) {
  const p1 = document.getElementById("player1-name");
  const p2 = document.getElementById("player2-name");
  const turn = data.turn;

  const allNames = {
    joueur1: data.names?.joueur1 || "Joueur 1",
    joueur2: data.names?.joueur2 || "Joueur 2"
  };

  if (p1 && p2) {
    p1.classList.remove("active");
    p2.classList.remove("active");

    if (turn === "joueur1") p1.classList.add("active");
    if (turn === "joueur2") p2.classList.add("active");

    p1.innerHTML = `👤 ${allNames.joueur1} : <span id="score1">${data.scores?.joueur1 || 0}</span>`;
    p2.innerHTML = `👤 ${allNames.joueur2} : <span id="score2">${data.scores?.joueur2 || 0}</span>`;
  }

  document.getElementById("move-count").textContent = data.moves || 0;

  const btn = document.getElementById("reset-button");
  if (btn) btn.disabled = currentPlayer !== "joueur1";
}

export async function handleCardClick(index, id, gameRef, currentPlayer) {
  const { get, update } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js');
  const snap = await get(gameRef);
  const data = snap.val();
  if (!data || data.turn !== currentPlayer || data.flipped.length >= 2) return;

  const newFlipped = [...(data.flipped || []), index];
  await update(gameRef, { flipped: newFlipped });

  if (newFlipped.length === 2) {
    setTimeout(() => checkMatch(newFlipped, data, gameRef), 1000);
  }
}

async function checkMatch([i1, i2], data, gameRef) {
  const { update } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js');
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

  await update(gameRef, {
    flipped: [],
    matched,
    scores,
    turn,
    moves
  });
}
