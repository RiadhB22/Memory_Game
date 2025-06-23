// session.js
export const firebaseConfig = {
  apiKey: "AIzaSyAV8RMYwJ4-r5oGn6I1zPsVDTXkQE-GRpM",
  authDomain: "memorygame-70305.firebaseapp.com",
  databaseURL: "https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "memorygame-70305",
  storageBucket: "memorygame-70305.appspot.com",
  messagingSenderId: "700177553228",
  appId: "1:700177553228:web:4a750936d2866eeface1e9"
};

import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

export let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

export let player = sessionStorage.getItem("player");

export async function detectPlayerRole() {
  const db = getDatabase();
  const gameRef = ref(db, 'game');
  const snap = await get(gameRef);
  const data = snap.val();

  const currentId = sessionStorage.getItem("sessionId");

  if (!data || !data.sessions?.joueur1) {
    player = "joueur1";
    const nom = prompt("Entrez votre nom (Joueur 1) :");
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    await update(gameRef, {
      sessions: {
        ...data?.sessions,
        joueur1: currentId,
        nomJoueur1: nom
      }
    });
    return;
  }

  if (!data.sessions?.joueur2) {
    player = "joueur2";
    const nom = prompt("Entrez votre nom (Joueur 2) :");
    sessionStorage.setItem("player", "joueur2");
    sessionStorage.setItem("nomJoueur2", nom);
    await update(gameRef, {
      sessions: {
        ...data.sessions,
        joueur2: currentId,
        nomJoueur2: nom
      }
    });
    return;
  }

  alert("❌ Deux joueurs sont déjà connectés. Merci de réessayer plus tard.");
}
