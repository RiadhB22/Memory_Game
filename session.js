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
    alert("Deux joueurs sont déjà connectés.");
    return;
  }

  const name = prompt(`Entrez votre nom (${role}) :`);
  if (!name) return;

  sessionStorage.setItem("player", role);
  await createGame(name, role);

  if (role === "joueur1") {
    document.getElementById("reset-button").disabled = false;
    document.getElementById("reset-button").onclick = async () => {
      await clearGame();
      window.location.reload();
    };
  }

  document.getElementById("waiting-message").style.display = "block";
  launchGame();
}

setup();
