import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase, ref, get, set, update, onValue, remove
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initGame, renderGame } from "./memory-core.js";

const firebaseConfig = {
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const gameRef = ref(db, "game");
let currentPlayer = null;

async function setup() {
  const snap = await get(gameRef);
  const data = snap.val();
  const id = crypto.randomUUID();

  // Si aucune session n'existe
  if (!data || !data.sessions?.joueur1 || !data.sessions?.joueur2) {
    const name = prompt("Entrez votre nom :");

    if (!data?.sessions?.joueur1) {
      await update(gameRef, {
        "sessions/joueur1": id,
        "names/joueur1": name,
        "scores/joueur1": 0,
        "turn": "joueur1",
        "started": false
      });
      currentPlayer = "joueur1";
    } else if (!data.sessions?.joueur2) {
      await update(gameRef, {
        "sessions/joueur2": id,
        "names/joueur2": name,
        "scores/joueur2": 0,
        "started": true,
        "timeStart": Date.now()
      });
      currentPlayer = "joueur2";
    }

    // Créer le plateau s’il n’existe pas
    await initGame(gameRef);

    // Afficher immédiatement le jeu pour joueur 1
    const updatedSnap = await get(gameRef);
    renderGame(updatedSnap.val(), currentPlayer, gameRef);
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return;
  }

  // Écoute Firebase pour synchroniser
  onValue(gameRef, (snap) => {
    const data = snap.val();
    renderGame(data, currentPlayer, gameRef);
    updateTime(data.timeStart);
  });

  // Réinitialisation (seulement pour joueur1)
  document.getElementById("reset-button").addEventListener("click", async () => {
    if (currentPlayer !== "joueur1") return;
    await remove(gameRef);
    location.reload();
  });
}

function updateTime(startTime) {
  if (!startTime) return;
  const durationEl = document.getElementById("duration");
  const startEl = document.getElementById("start-time");

  const startDate = new Date(startTime);
  startEl.textContent = `${startDate.getHours()}:${startDate.getMinutes()}`;

  setInterval(() => {
    const now = Date.now();
    const seconds = Math.floor((now - startTime) / 1000);
    durationEl.textContent = `${seconds}s`;
  }, 1000);
}

setup();