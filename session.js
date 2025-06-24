// session.js

import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const db = getDatabase();
const gameRef = ref(db, "game");

let sessionId = localStorage.getItem("memory_session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("memory_session_id", sessionId);
}
sessionStorage.setItem("sessionId", sessionId);

export async function detectPlayerRole() {
  const snap = await get(gameRef);
  const data = snap.val();
  const sessionId = sessionStorage.getItem("sessionId");

  const namePrompt = data?.sessions?.joueur1 ? "Entrez votre nom (Joueur 2) :" : "Entrez votre nom (Joueur 1) :";
  const nom = prompt(namePrompt);

  if (!data || !data.sessions?.joueur1) {
    sessionStorage.setItem("player", "joueur1");
    sessionStorage.setItem("nomJoueur1", nom);
    await set(gameRef, {
      started: false,
      sessions: { joueur1: sessionId },
      noms: { joueur1: nom },
    });
    return "joueur1";
  }

  if (!data.sessions?.joueur2) {
    sessionStorage.setItem("player", "joueur2");
    sessionStorage.setItem("nomJoueur2", nom);
    await set(gameRef, {
      ...data,
      sessions: {
        ...data.sessions,
        joueur2: sessionId
      },
      noms: {
        ...data.noms,
        joueur2: nom
      }
    });
    return "joueur2";
  }

  alert("Deux joueurs sont déjà connectés.");
  return null;
}
