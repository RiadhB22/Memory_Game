import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initGame } from "./memory-core.js";

const db = getDatabase();
const gameRef = ref(db, 'game');

let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

async function detectRoleEtNom() {
  const snap = await get(gameRef);
  const data = snap.val();
  let nom = "";

  if (!data || !data.sessions || !data.sessions.joueur1) {
    nom = prompt("Entrez votre nom (Joueur 1) :") || "Joueur 1";
    await update(gameRef, {
      sessions: { ...data?.sessions, joueur1: sessionId }
    });
    initGame(nom, "joueur1");
  } else if (!data.sessions.joueur2) {
    nom = prompt("Entrez votre nom (Joueur 2) :") || "Joueur 2";
    await update(gameRef, {
      sessions: { ...data.sessions, joueur2: sessionId }
    });
    initGame(nom, "joueur2");
  } else {
    alert("Deux joueurs sont déjà connectés.");
  }
}

detectRoleEtNom();
