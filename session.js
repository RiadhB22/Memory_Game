import { launchGame, createGame, clearGame } from "./memory-core.js";

async function setup() {
  const res = await fetch("https://memorygame-70305-default-rtdb.europe-west1.firebasedatabase.app/game.json");
  const data = await res.json();

  let role = null;
  if (!data?.sessions?.joueur1) role = "joueur1";
  else if (!data?.sessions?.joueur2) role = "joueur2";
  else {
    alert("❌ Deux joueurs sont déjà connectés.");
    return;
  }

  const name = prompt(`Entrez votre nom (${role}) :`);
  if (!name) return;

  await createGame(name, role);

  if (role === "joueur1" && !data?.sessions?.joueur2) {
    const wait = document.getElementById("waiting-message");
    if (wait) {
      wait.style.display = "block";
      wait.textContent = "⌛ En attente de l'autre joueur...";
    }
  }

  const resetBtn = document.getElementById("reset-button");
  if (role === "joueur1") {
    resetBtn.disabled = false;
    resetBtn.onclick = async () => {
      if (confirm("🔄 Réinitialiser la partie ?")) {
        await clearGame();
        window.location.reload();
      }
    };
  }

  launchGame();
}

setup();
