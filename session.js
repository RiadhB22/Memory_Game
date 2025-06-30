import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get, update, onValue } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initGame, renderGame, resetGame } from "./memory-core.js";

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
sessionStorage.setItem("sessionId", sessionId);

let currentPlayer = null;

async function detectPlayer() {
  const snap = await get(gameRef);
  const data = snap.val() || {};
  const nom = prompt(`Entrez votre nom :\n(Joueur 1: ${data.names?.joueur1 || "?"}, Joueur 2: ${data.names?.joueur2 || "?"})`);

  if (!data.names || !data.names.joueur1) {
    currentPlayer = "joueur1";
    await update(gameRef, {
      names: { ...data.names, joueur1: nom }
    });
  } else if (!data.names.joueur2) {
    currentPlayer = "joueur2";
    await update(gameRef, {
      names: { ...data.names, joueur2: nom }
    });
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return false;
  }

  return true;
}

document.getElementById("reset-button").addEventListener("click", () => {
  if (currentPlayer === "joueur1") resetGame(gameRef);
});

const ready = await detectPlayer();
if (ready) {
  await initGame(gameRef);
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    renderGame(data, currentPlayer, gameRef);
  });
}
