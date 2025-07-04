// session.js
import { ref, get, update, onValue, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { db } from "./firebase-init.js";

export const gameRef = ref(db, "game");
export let player = localStorage.getItem("player") || "";
export let sessionId = localStorage.getItem("sessionId") || crypto.randomUUID();
localStorage.setItem("sessionId", sessionId);

export async function detectPlayerRole() {
  const snapshot = await get(gameRef);
  const data = snapshot.val();
  const nom = prompt("Entrez votre nom :");

  if (!data || !data.sessions) {
    player = "joueur1";
    await update(gameRef, {
      sessions: { joueur1: sessionId },
      noms: { joueur1: nom }
    });
  } else if (!data.sessions.joueur1) {
    player = "joueur1";
    await update(gameRef, {
      "sessions/joueur1": sessionId,
      "noms/joueur1": nom
    });
  } else if (!data.sessions.joueur2) {
    player = "joueur2";
    await update(gameRef, {
      "sessions/joueur2": sessionId,
      "noms/joueur2": nom
    });
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return false;
  }

  localStorage.setItem("player", player);
  return true;
}

export function listenToNames(updateNames) {
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (data?.noms) {
      updateNames(data.noms);
    }
  });
}

export function resetGame() {
  remove(gameRef);
  localStorage.removeItem("player");
  localStorage.removeItem("sessionId");
  window.location.reload();
}
