// =============================================================================
//  SERVER.JS – Serveur WebSocket pour jeu multijoueur
// =============================================================================
//
//  Ce serveur a deux rôles :
//    1. Serveur HTTP  → envoie les fichiers HTML au navigateur (game.html, controller.html)
//    2. Serveur WebSocket → relaie les messages entre les clients en temps réel
//
//  Architecture :
//    Téléphone (controller.html)  ──── ws ────▶  Serveur  ──── ws ────▶  Jeu (game.html)
//
//  Le serveur est un simple "relay" : il ne connaît pas les règles du jeu.
//  Il reçoit un message JSON d'un client et le renvoie à TOUS les autres clients.
//
// =============================================================================

// ─── IMPORTS ──────────────────────────────────────────────────────────────────

// 'express' : framework HTTP pour servir les fichiers statiques (HTML, CSS, JS)
const express = require('express');

// 'http' : module natif Node.js pour créer un serveur HTTP
const http = require('http');

// 'WebSocketServer' et 'WebSocket' extraits du package 'ws'
// WebSocket est un protocole de communication bidirectionnel persistant,
// contrairement à HTTP qui ferme la connexion après chaque requête.
// WebSocket.OPEN (= 1) : état d'une connexion active
const { WebSocketServer, WebSocket } = require('ws');

// 'path' : module natif Node.js pour manipuler les chemins de fichiers
const path = require('path');


// ─── CRÉATION DU SERVEUR ──────────────────────────────────────────────────────

// On crée l'application Express
const app = express();

// On crée un serveur HTTP à partir de l'application Express.
// Cela nous permet d'attacher WebSocket sur le MÊME port que HTTP.
// Résultat : http://localhost:3000 ET ws://localhost:3000 sur le même port.
const server = http.createServer(app);

// On attache le serveur WebSocket au serveur HTTP
const wss = new WebSocketServer({ server });


// ─── FICHIERS STATIQUES ───────────────────────────────────────────────────────

// Express sert automatiquement tous les fichiers du dossier 'public/'.
// Ex: une requête vers /game.html renvoie public/game.html
app.use(express.static(path.join(__dirname, 'public')));

// Route explicite pour la page principale (jeu sur grand écran)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Route pour la manette (ouverte sur les téléphones des joueurs)
app.get('/controller', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'controller.html'));
});


// ─── WEBSOCKET : GESTION DES CONNEXIONS ───────────────────────────────────────

// Set = ensemble de clients actuellement connectés.
// On utilise un Set plutôt qu'un tableau pour faciliter l'ajout/suppression.
const clients = new Set();

// Événement déclenché à chaque nouvelle connexion WebSocket
wss.on('connection', (ws) => {

  // Ajouter ce nouveau client à notre ensemble
  clients.add(ws);
  console.log(`Nouveau client connecté. Total : ${clients.size}`);

  // ── Réception d'un message ────────────────────────────────────────────────
  ws.on('message', (data) => {

    // Les messages sont envoyés au format JSON (texte).
    // On parse le JSON pour obtenir un objet JavaScript.
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (e) {
      // Si le message n'est pas du JSON valide, on l'ignore
      console.warn('Message invalide reçu (non-JSON), ignoré.');
      return;
    }

    console.log(`Message reçu : type="${msg.type}" pseudo="${msg.pseudo || ''}"`);

    // ── Broadcast : envoyer à tous les AUTRES clients ─────────────────────
    // On itère sur tous les clients connectés.
    // On exclut l'expéditeur (client !== ws) pour éviter l'écho.
    // On vérifie que la connexion est ouverte (readyState === 1 = OPEN).
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) { // OPEN = 1
        client.send(JSON.stringify(msg));
      }
    }
  });

  // ── Déconnexion ────────────────────────────────────────────────────────────
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client déconnecté. Total : ${clients.size}`);
  });

  // ── Gestion des erreurs ────────────────────────────────────────────────────
  ws.on('error', (err) => {
    console.error('Erreur WebSocket :', err.message);
    clients.delete(ws);
  });
});


// ─── DÉMARRAGE DU SERVEUR ─────────────────────────────────────────────────────

const PORT = 3000;

server.listen(PORT, () => {
  console.log('─────────────────────────────────────────');
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Jeu (grand écran) : http://localhost:${PORT}/`);
  console.log(`Manette (téléphone) : http://localhost:${PORT}/controller`);
  console.log('─────────────────────────────────────────');
});
