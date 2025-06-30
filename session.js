import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

import {
  initGame,
  renderGame,
  handleCardClick,
  resetGame
} from "./memory-core.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAV8RMYwJ4-r5oGn6I1zPsVDTXkQE-GRpM",
  authDomain: "memorygame-70305.firebaseapp.com",
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "memorygame-70305",
  storageBucket: "memorygame-70305.appspot.com",
  messagingSenderId: "700177553228",
  appId: "1:700177553228:web:4a750936d2866eeface1e9"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const gameRef = ref(db, "game");

let player = localStorage.getItem("memory_player");
let name = localStorage.getItem("memory_name");

async function assignPlayer() {
  const snap = await get(gameRef);
  const data = snap.val() || {};
  const names = data.names || {};

  if (!player || !name) {
    const promptText =
      !names.joueur1
        ? "Entrez votre nom (Joueur 1) :"
        : !names.joueur2
        ? "Entrez votre nom (Joueur 2) :"
        : null;

    if (!promptText) {
      alert("Deux joueurs sont déjà connectés.");
      return;
    }

    name = prompt(promptText);
    if (!name) return;

    player = !names.joueur1 ? "joueur1" : "joueur2";
    localStorage.setItem("memory_player", player);
    localStorage.setItem("memory_name", name);

    await update(gameRef, {
      names: { ...names, [player]: name }
    });
  }
}

await assignPlayer();
initGame(gameRef);

onValue(gameRef, (snap) => {
  const data = snap.val();
  if (!data) return;

  if (!data.names?.joueur1 || !data.names?.joueur2) {
    document.getElementById("status-message").style.display = "block";
  } else {
    document.getElementById("status-message").style.display = "none";
    renderGame(data, player, gameRef);
  }
});

document.getElementById("reset-button").addEventListener("click", () => {
  if (player === "joueur1") resetGame(gameRef);
});
