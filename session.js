import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import {
  initGame,
  renderGame
} from "./memory-core.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAV8RMYwJ4-r5oGn6I1zPsVDTXkQE-GRpM",
  authDomain: "memorygame-70305.firebaseapp.com",
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "memorygame-70305",
  storageBucket: "memorygame-70305.appspot.com",
  messagingSenderId: "700177553228",
  appId: "1:700177553228:web:4a750936d2866eeface1e9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const gameRef = ref(db, "game");

let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}

let currentPlayer = localStorage.getItem("player");
let nom = localStorage.getItem("nom");

(async () => {
  const snap = await get(gameRef);
  const data = snap.val();
  const session = sessionId;

  if (!data || !data.sessions?.joueur1) {
    currentPlayer = "joueur1";
    nom = prompt("Entrez votre nom (Joueur 1) :");
    await set(gameRef, {
      started: false,
      board: [],
      flipped: [],
      matched: [],
      turn: "joueur1",
      sessions: { joueur1: session },
      scores: { joueur1: 0, joueur2: 0 },
      moves: 0
    });
  } else if (!data.sessions?.joueur2) {
    currentPlayer = "joueur2";
    nom = prompt("Entrez votre nom (Joueur 2) :");
    await update(gameRef, {
      sessions: { ...data.sessions, joueur2: session }
    });
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return;
  }

  localStorage.setItem("player", currentPlayer);
  localStorage.setItem("nom", nom);

  document.getElementById(`${currentPlayer}-name`).textContent = `👤 ${nom} :`;

  await initGame(gameRef);

  document.getElementById("reset-button").disabled = currentPlayer !== "joueur1";
  document.getElementById("reset-button").addEventListener("click", async () => {
    if (currentPlayer === "joueur1") {
      await remove(gameRef);
      location.reload();
    }
  });

  onValue(gameRef, (snapshot) => {
    const gameData = snapshot.val();
    if (!gameData || !gameData.board) return;
    renderGame(gameData, currentPlayer, gameRef);
  });
})();
