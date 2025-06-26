// session.js
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

export async function detectPlayerRole() {
  const sessionId = localStorage.getItem("memory_session_id") || crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
  sessionStorage.setItem("sessionId", sessionId);

  let snap = await get(gameRef);
  const data = snap.val() || {};

  const nom = prompt("Entrez votre nom :");
  if (!nom) return null;

  let updates = {};

  if (!data.sessions?.joueur1) {
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    updates["sessions/joueur1"] = sessionId;
    updates["noms/joueur1"] = nom;
  } else if (!data.sessions?.joueur2) {
    sessionStorage.setItem("player", "joueur2");
    sessionStorage.setItem("nomJoueur2", nom);
    updates["sessions/joueur2"] = sessionId;
    updates["noms/joueur2"] = nom;
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return null;
  }

  await update(gameRef, updates);
  return sessionStorage.getItem("player");
}
