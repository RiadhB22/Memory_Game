// session.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, get, ref, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAV8RMYwJ4-r5oGn6I1zPsVDTXkQE-GRpM",
  authDomain: "memorygame-70305.firebaseapp.com",
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "memorygame-70305",
  storageBucket: "memorygame-70305.appspot.com",
  messagingSenderId: "700177553228",
  appId: "1:700177553228:web:4a750936d2866eeface1e9"
};

export const sessionId = localStorage.getItem("memory_session_id") || crypto.randomUUID();
localStorage.setItem("memory_session_id", sessionId);
sessionStorage.setItem("sessionId", sessionId);

export let player = sessionStorage.getItem("player");

export async function detectPlayerRole() {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const gameRef = ref(db, 'game');

  const snap = await get(gameRef);
  const data = snap.val();
  const nom = prompt("Entrez votre nom :");

  const updates = {};
  if (!data) {
    player = "joueur1";
    sessionStorage.setItem("player", "joueur1");
    updates["sessions/joueur1"] = sessionId;
    updates["sessions/nomJoueur1"] = nom;
  } else if (!data.sessions?.joueur1) {
    player = "joueur1";
    sessionStorage.setItem("player", "joueur1");
    updates["sessions/joueur1"] = sessionId;
    updates["sessions/nomJoueur1"] = nom;
  } else if (!data.sessions?.joueur2) {
    player = "joueur2";
    sessionStorage.setItem("player", "joueur2");
    updates["sessions/joueur2"] = sessionId;
    updates["sessions/nomJoueur2"] = nom;
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return;
  }

  await update(gameRef, updates);
}