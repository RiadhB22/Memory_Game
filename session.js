import { db } from "./firebase-init.js";
import {
  ref,
  get,
  update
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const gameRef = ref(db, "game");

export async function detectPlayerRole() {
  let sessionId = localStorage.getItem("memory_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("memory_session_id", sessionId);
  }

  const snap = await get(gameRef);
  const data = snap.val() || {};

  const nom = prompt("Entrez votre nom :");

  let role = null;
  if (!data.sessions || !data.sessions.joueur1) {
    role = "joueur1";
  } else if (!data.sessions.joueur2) {
    role = "joueur2";
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return null;
  }

  await update(gameRef, {
    [`sessions/${role}`]: sessionId,
    [`noms/${role}`]: nom
  });

  return role;
}

export async function savePlayerName(role) {
  const snap = await get(gameRef);
  const data = snap.val() || {};
  if (data.noms && data.noms[role]) {
    sessionStorage.setItem(`nom-${role}`, data.noms[role]);
  }
}
