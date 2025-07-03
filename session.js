import { launchGame, createGame, clearGame } from "./memory-core.js";

async function setup() {
  const res = await fetch("https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app/game.json");
  const data = await res.json();
  const player1 = data?.sessions?.joueur1;
  const player2 = data?.sessions?.joueur2;

  let role;
  if (!player1) role = "joueur1";
  else if (!player2) role = "joueur2";
  else {
    alert("❌ Deux joueurs sont déjà connectés.");
    return;
  }

  const name = prompt(`Entrez votre nom (${role}) :`);
  if (!name) return;

  sessionStorage.setItem("player", role);
  await createGame(name, role);

  // ✅ Afficher le message d'attente uniquement si joueur1 est connecté seul
  const waitingEl = document.getElementById("waiting-message");
  if (role === "joueur1" && !player2) {
    waitingEl.style.display = "block";
    waitingEl.textContent = "⌛ En attente de l'autre joueur...";
  } else {
    waitingEl.style.display = "none";
  }

  // ✅ Activer le bouton seulement pour joueur1
  const resetBtn = document.getElementById("reset-button");
  if (role === "joueur1") {
    resetBtn.disabled = false;
    resetBtn.onclick = async () => {
      const confirmReset = confirm("Voulez-vous vraiment réinitialiser la partie ?");
      if (confirmReset) {
        await clearGame();
        window.location.reload();
      }
    };
  }

  launchGame();
}

setup();
