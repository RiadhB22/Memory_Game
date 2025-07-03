import { launchGame, createGame, clearGame } from "./memory-core.js";

async function setup() {
  const res = await fetch("https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app/game.json");
  const data = await res.json();
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem("sessionId", sessionId);

  const current1 = data?.sessions?.joueur1;
  const current2 = data?.sessions?.joueur2;

  let role = null;

  if (!current1) role = "joueur1";
  else if (!current2) role = "joueur2";
  else {
    alert("❌ Deux joueurs sont déjà connectés.");
    return;
  }

  const name = prompt(`Entrez votre nom (${role}) :`);
  if (!name) return;

  sessionStorage.setItem("player", role);

  // Crée ou met à jour la base
  await createGame(name, role);

  // Affiche le message d’attente seulement si joueur1 et pas encore joueur2
  const wait = document.getElementById("waiting-message");
  if (role === "joueur1" && !current2) {
    wait.style.display = "block";
    wait.textContent = "⌛ En attente de l'autre joueur...";
  } else {
    wait.style.display = "none";
  }

  // Bouton de reset activé uniquement pour joueur1
  const resetBtn = document.getElementById("reset-button");
  if (role === "joueur1") {
    resetBtn.disabled = false;
    resetBtn.onclick = async () => {
      if (confirm("Voulez-vous vraiment recommencer ?")) {
        await clearGame();
        window.location.reload();
      }
    };
  }

  // Lancement du jeu
  launchGame();
}

setup();
