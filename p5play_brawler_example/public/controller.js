// ===========================================================================
//  CONTROLLER.HTML – Manette mobile du joueur
// ===========================================================================
//
//  Ce fichier gère :
//    1. La connexion WebSocket au serveur
//    2. L'interface de saisie du pseudo
//    3. L'envoi des commandes au serveur (spawn, dash, reverse)
//
//  Messages envoyés (format JSON) :
//    { type: 'spawn',  pseudo: 'Alice' }  -> rejoindre la partie
//    { type: 'input1', pseudo: 'Alice' }  -> DASH
//    { type: 'input2', pseudo: 'Alice' }  -> REVERSE
//
// ===========================================================================

// Variables d'état
let ws; // Connexion WebSocket
let pseudo = ''; // Pseudo du joueur courant
let isDead = false;

// Éléments du DOM
const loginScreen = document.getElementById('login-screen');
const controlScreen = document.getElementById('control-screen');
const statusLogin = document.getElementById('status-login');
const statusControl = document.getElementById('status-control');
const pseudoInput = document.getElementById('pseudo-input');
const dashBtn = document.getElementById('dash-btn');
const reverseBtn = document.getElementById('reverse-btn');
const respawnBtn = document.getElementById('respawn-btn');

function setDeadState(dead) {
  isDead = dead;
  dashBtn.disabled = dead;
  reverseBtn.disabled = dead;
  respawnBtn.style.display = dead ? 'block' : 'none';
}

// --- CONNEXION WEBSOCKET -------------------------------------------------

function connectWebSocket() {
  // Adapter le protocole selon HTTP ou HTTPS
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';

  // Se connecter au même hôte que le serveur qui a servi cette page
  ws = new WebSocket(`${protocol}//${location.host}`);

  // -- Connexion établie ---------------------------------------------------
  ws.onopen = () => {
    statusLogin.textContent = 'Connecté ✔';
    statusLogin.className = 'status status-connected';
    statusControl.textContent = 'Connecté ✔';
    statusControl.className = 'status status-connected';
  };

  // -- Connexion perdue ----------------------------------------------------
  ws.onclose = () => {
    statusLogin.textContent = 'Déconnecté…';
    statusLogin.className = 'status status-disconnected';
    statusControl.textContent = 'Déconnecté…';
    statusControl.className = 'status status-disconnected';
    // Reconnexion automatique après 2 secondes
    setTimeout(connectWebSocket, 2000);
  };

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    // Le jeu envoie cette notification quand une balle tombe.
    if (msg.type === 'playerDead' && msg.pseudo === pseudo) {
      setDeadState(true);
      statusControl.textContent = 'Tu es mort - respawn disponible';
    }
  };

  // Note : on ne reçoit pas de messages sur la manette (on en envoie uniquement).
  // La page de jeu (game.html) interprète les messages.
}

// --- ENVOI D'UN MESSAGE --------------------------------------------------

/**
 * Envoie un objet JSON au serveur via WebSocket.
 * Le serveur retransmettra ce message à tous les autres clients (dont game.html).
 *
 * @param {object} msg - L'objet à envoyer (sera sérialisé en JSON)
 */
function send(msg) {
  // Vérifier que la connexion est ouverte avant d'envoyer
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  } else {
    console.warn('WebSocket non connecté, message non envoyé.');
  }
}

// --- BOUTON SPAWN --------------------------------------------------------

document.getElementById('spawn-btn').addEventListener('click', () => {
  pseudo = pseudoInput.value.trim();

  // Validation basique : le pseudo ne doit pas être vide
  if (!pseudo) {
    pseudoInput.focus();
    return;
  }

  // Envoyer le message "spawn" au serveur
  // -> Le serveur le relaye à game.html qui crée la balle
  send({ type: 'spawn', pseudo: pseudo });

  // Passer à l'écran de contrôle
  loginScreen.style.display = 'none';
  controlScreen.style.display = 'flex';
  setDeadState(false);

  // Afficher le pseudo actif dans l'écran de contrôle
  document.getElementById('player-name').textContent = '👤 ' + pseudo;
});

// Permettre d'appuyer sur Entrée pour spawner (pratique sur desktop)
pseudoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('spawn-btn').click();
  }
});

// --- BOUTON DASH (input1) -------------------------------------------------
// Envoie une impulsion dans la direction actuelle du marqueur

document.getElementById('dash-btn').addEventListener('click', () => {
  send({ type: 'input1', pseudo: pseudo });
});

// --- BOUTON REVERSE (input2) ---------------------------------------------
// Inverse le sens de rotation du marqueur directionnel

document.getElementById('reverse-btn').addEventListener('click', () => {
  send({ type: 'input2', pseudo: pseudo });
});

// --- BOUTON RESPAWN ------------------------------------------------------

respawnBtn.addEventListener('click', () => {
  if (!pseudo) return;
  send({ type: 'respawn', pseudo: pseudo });
  setDeadState(false);
  statusControl.textContent = 'Respawn demandé...';
});

// --- INITIALISATION ------------------------------------------------------
// Démarrer la connexion WebSocket dès le chargement de la page
connectWebSocket();
