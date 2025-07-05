// 📁 session.js
import { db } from "./firebase-init.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const gameRef = ref(db, "game");

export async function detectPlayerRole() {
  let sessionId = localStorage.getItem("memory_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("memory_session_id", sessionId);
  }
  sessionStorage.setItem("sessionId", sessionId);

  const snap = await get(gameRef);
  const data = snap.val() || {};

  const joueur1 = data.sessions?.joueur1;
  const joueur2 = data.sessions?.joueur2;

  const nom = prompt(`Entrez votre nom (${!joueur1 ? 'Joueur 1' : 'Joueur 2'}) :`);

  if (!joueur1) {
    await update(gameRef, {
      sessions: { ...data.sessions, joueur1: sessionId },
      noms: { ...data.noms, joueur1: nom }
    });
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    return "joueur1";
  }

  if (!joueur2 && joueur1 !== sessionId) {
    await update(gameRef, {
      sessions: { ...data.sessions, joueur2: sessionId },
      noms: { ...data.noms, joueur2: nom }
    });
    sessionStorage.setItem("player", "joueur2");
    sessionStorage.setItem("nomJoueur2", nom);
    return "joueur2";
  }

  alert("Deux joueurs sont déjà connectés.");
  return null;
}
