const images = [];
for (let i = 1; i <= 20; i++) {
  images.push({ id: i, img: `files/${i}-1.jpg` });
  images.push({ id: i, img: `files/${i}-2.jpg` });
}

const sounds = {
  flip1: new Audio("files/flip1.mp3"),
  flip2: new Audio("files/flip2.mp3")
};

export async function initGame(gameRef) {
  const { get, set } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js");
  const snap = await get(gameRef);
  const data = snap.val();

  if (!data.started && data.names?.joueur1 && data.names?.joueur2) {
    const cards = [...images].sort(() => 0.5 - Math.random());
    await set(gameRef, {
      ...data,
      started: true,
      board: cards,
      matched: [],
      flipped: [],
      turn: "joueur1",
      moves: 0,
      scores: { joueur1: 0, joueur2: 0 },
      timeStart: Date.now()
    });
  }
}

export function renderGame(data, player, gameRef) {
  const game = document.getElementById("game");
  game.innerHTML = "";

  data.board?.forEach((card, index) => {
    const isFlipped = data.flipped?.includes(index);
    const isMatched = data.matched?.includes(card.id);

    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.innerHTML = `
      <div class="inner ${isFlipped || isMatched ? "flipped" : ""} ${isMatched ? "matched" : ""}">
        <div class="front"><img src="${card.img}" /></div>
        <div class="back"><img src="files/verso.jpg" /></div>
      </div>`;

    if (!isFlipped && !isMatched && data.turn === player) {
      cardEl.addEventListener("click", () => handleCardClick(index, card.id, data, gameRef, player));
    }

    game.appendChild(cardEl);
  });

  updateStatus(data, player);
}

async function handleCardClick(index, id, data, gameRef, player) {
  const { update, get } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js");
  if (data.flipped?.length >= 2 || data.turn !== player || data.flipped?.includes(index)) return;

  const flipped = [...(data.flipped || []), index];
  sounds[flipped.length === 1 ? 'flip1' : 'flip2'].play();
  await update(gameRef, { flipped });

  if (flipped.length === 2) {
    setTimeout(async () => {
      const snap = await get(gameRef);
      const newData = snap.val();
      const [i1, i2] = flipped;
      const c1 = newData.board[i1];
      const c2 = newData.board[i2];

      let matched = newData.matched || [];
      let scores = newData.scores;
      let turn = newData.turn;
      let move = newData.moves + 1;

      if (c1.id === c2.id && i1 !== i2) {
        matched.push(c1.id);
        scores[turn]++;
      } else {
        turn = turn === "joueur1" ? "joueur2" : "joueur1";
      }

      await update(gameRef, {
        flipped: [],
        matched,
        scores,
        turn,
        moves: move
      });
    }, 800);
  }
}

function updateStatus(data, player) {
  document.getElementById("score1").textContent = data.scores?.joueur1 || 0;
  document.getElementById("score2").textContent = data.scores?.joueur2 || 0;
  document.getElementById("move-count").textContent = data.moves || 0;

  const now = Date.now();
  const elapsed = Math.floor((now - (data.timeStart || now)) / 1000);
  document.getElementById("timer").textContent = `${elapsed}s`;

  const p1 = document.getElementById("player1-name");
  const p2 = document.getElementById("player2-name");
  p1.classList.remove("active-player");
  p2.classList.remove("active-player");
  if (data.turn === "joueur1") p1.classList.add("active-player");
  if (data.turn === "joueur2") p2.classList.add("active-player");
}
