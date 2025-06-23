// session.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAV8RMYwJ4-r5oGn6I1zPsVDTXkQE-GRpM",
  authDomain: "memorygame-70305.firebaseapp.com",
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "memorygame-70305",
  storageBucket: "memorygame-70305.appspot.com",
  messagingSenderId: "700177553228",
  appId: "1:700177553228:web:4a750936d2866eeface1e9"
};

const app = initializeApp(firebaseConfig);

export let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);
export let player = sessionStorage.getItem("player");

import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
const db = getDatabase(app);
const gameRef = ref(db, 'game');

export async function detectPlayerRole() {
  const snap = await get(gameRef);
  const data = snap.val();

  let nom;
  const sessionId = sessionStorage.getItem("sessionId");

  if (!data || !data.sessions?.joueur1) {
    nom = prompt("Entrez votre nom (Joueur 1) :");
    update(gameRef, {
      sessions: {
        ...(data?.sessions || {}),
        joueur1: sessionId,
        nomJoueur1: nom
      }
    });
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    player = "joueur1";
    return;
  }

  if (!data.sessions?.joueur2) {
    nom = prompt("Entrez votre nom (Joueur 2) :");
    update(gameRef, {
      sessions: {
        ...data.sessions,
        joueur2: sessionId,
        nomJoueur2: nom
      }
    });
    sessionStorage.setItem("player", "joueur2");
    sessionStorage.setItem("nomJoueur2", nom);
    player = "joueur2";
    return;
  }

  alert("Deux joueurs sont déjà connectés.");
}
