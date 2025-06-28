import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
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
const gameRef = ref(db, 'game');

let player;
let nom;

async function detectPlayer() {
  const snap = await get(gameRef);
  const data = snap.val();

  const nom1 = data?.names?.joueur1 || null;
  const nom2 = data?.names?.joueur2 || null;

  if (!nom1) {
    nom = prompt("Entrez votre nom (Joueur 1) :");
    player = "joueur1";
    await set(gameRef, {
      ...data,
      names: { ...data?.names, joueur1: nom },
      scores: { ...data?.scores, joueur1: 0, joueur2: 0 },
      turn: "joueur1"
    });
  } else if (!nom2) {
    nom = prompt("Entrez votre nom (Joueur 2) :");
    player = "joueur2";
    await set(gameRef, {
      ...data,
      names: { ...data?.names, joueur2: nom },
      scores: { ...data?.scores, joueur1: 0, joueur2: 0 }
    });
  } else {
    alert("Deux joueurs sont déjà connectés.");
    throw new Error("Deux joueurs déjà connectés");
  }
}

await detectPlayer();
await initGame(gameRef);

onValue(gameRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    renderGame(data, player, gameRef);
  }
});

document.getElementById("reset-button").addEventListener("click", () => {
  if (player === "joueur1") resetGame(gameRef);
});
