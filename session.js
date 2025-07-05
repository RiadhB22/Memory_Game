import { db } from "./firebase-init.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const gameRef = ref(db, "game");

export async function detectPlayerRole() {
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem("sessionId", sessionId);

  const snap = await get(gameRef);
  const data = snap.val();

  let player = null;
  const nom = prompt("Entrez votre nom :");

  if (!data || !data.sessions?.joueur1) {
    player = "joueur1";
  } else if (!data.sessions?.joueur2) {
    player = "joueur2";
  } else {
    alert("Deux joueurs sont déjà connectés.");
    return null;
  }

  const updates = {
    [`sessions/${player}`]: sessionId,
    [`noms/${player}`]: nom
  };
  await update(gameRef, updates);

  sessionStorage.setItem("player", player);
  sessionStorage.setItem("nom" + player.charAt(0).toUpperCase() + player.slice(1), nom);
  return player;
}
