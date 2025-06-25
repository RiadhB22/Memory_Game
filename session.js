// session.js
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initGame } from "./memory-core.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

async function detectPlayerRole() {
  const snap = await get(gameRef);
  const data = snap.val();
  const sessionId = localStorage.getItem("memory_session_id") || crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
  sessionStorage.setItem("sessionId", sessionId);

  let role = null;
  let nom = null;

  if (!data || !data.sessions?.joueur1) {
    role = "joueur1";
    nom = prompt("Entrez votre nom (1er joueur) :");
    await update(gameRef, { sessions: { ...data?.sessions, joueur1: sessionId } });
  } else if (!data.sessions?.joueur2) {
    role = "joueur2";
    nom = prompt(`Entrez votre nom (2ème joueur) :`);
    await update(gameRef, { sessions: { ...data.sessions, joueur2: sessionId } });
  } else {
    alert("Deux joueurs sont déjà connectés !");
    return;
  }

  if (nom) initGame(nom, role);
}

detectPlayerRole();
