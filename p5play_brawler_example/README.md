# Mini-jeu multijoueur - p5play + WebSocket

Exemple pedagogique d'un jeu multijoueur en temps reel.
Chaque joueur controle une balle depuis son telephone, la simulation physique se fait sur l'ecran principal.

---

## Structure du projet

```
p5play_brawler_example/
|- server.js                 Serveur Node.js (HTTP + WebSocket)
|- package.json              Dependances npm
|- lancer-le-serveur.bat     Lancement rapide sous Windows
`- public/
   |- game.html              Page grand ecran
   |- game.css               Styles de la page jeu
   |- game.js                Logique de jeu + physique p5play
   |- controller.html        Page manette (telephone)
   |- controller.css         Styles de la manette
   `- controller.js          Logique manette + WebSocket
```

---

## Lancer le projet

Prerequis:
- Node.js installe (v16+ recommande)

Etapes:
1. Ouvrir un terminal dans ce dossier.
2. Installer les dependances (une seule fois):

```bash
npm install
```

3. Demarrer le serveur:

```bash
node server.js
```

4. Ouvrir le jeu sur l'ecran principal:
- http://localhost:3000/

5. Ouvrir la manette sur chaque telephone:
- http://[IP-de-votre-machine]:3000/controller

Sous Windows, vous pouvez aussi lancer `lancer-le-serveur.bat`.

---

## Architecture

- `server.js` sert les fichiers statiques et relaie les messages WebSocket entre clients.
- `public/game.js` contient toute la logique de jeu (spawn, dash, score, mort, respawn).
- `public/controller.js` envoie les commandes joueur et reagit aux notifications de mort.

Le serveur est volontairement un relay simple:
- il ne calcule pas les regles du jeu,
- il diffuse juste les messages recus aux autres clients connectes.

---

## Protocole WebSocket

Tous les messages sont en JSON.

| Message | Envoye par | Champs | Effet |
|---|---|---|---|
| `spawn` | Controller | `{ type, pseudo }` | Cree le joueur si absent |
| `input1` | Controller | `{ type, pseudo }` | Dash |
| `input2` | Controller | `{ type, pseudo }` | Inverse le sens de rotation de la fleche |
| `respawn` | Controller | `{ type, pseudo }` | Redemande une apparition apres mort |
| `playerDead` | Game | `{ type, pseudo }` | Informe la manette que ce joueur est mort |

---

## Mecaniques de jeu

### Joueur
- Chaque joueur est une sphere dynamique (gravite, collisions, rebond, friction).
- Le score augmente de +1 toutes les 2 secondes de survie.

### Fleche directionnelle physique
- La fleche n'est pas juste un dessin: c'est aussi un objet physique dynamique.
- Elle orbite autour du joueur via un suivi de type ressort amorti (plus stable).
- Elle peut pousser, bousculer et soulever les joueurs par collision.
- En inactivite, elle grandit progressivement (jusqu'a `MARKER_MAX_LENGTH`).
- Des qu'un joueur rejoue (dash/reverse), sa fleche revient a la taille normale.

### Dash / Reverse / Respawn
- `DASH` applique une impulsion dans la direction de la fleche.
- `REVERSE` inverse le sens de rotation de la fleche.
- Quand un joueur meurt (chute dans la zone rouge), la manette affiche un bouton `RESPAWN`.
- Le bouton envoie `respawn`, ce qui recree le joueur s'il est absent.

### Limitation de vitesse
- Une limite de vitesse du joueur est appliquee (`PLAYER_MAX_SPEED`) pour eviter les ejections extremes.

### Arene et rebords
- Plateforme centrale + murs + plafond + zone de destruction en bas.
- Rebords gauche/droite ajoutes sur l'arene.
- Hauteur des rebords = 1/10 de la largeur de l'arene.

---

## Parametres importants (dans game.js)

- `GRAVITY`
- `DASH_POWER`
- `PLAYER_MAX_SPEED`
- `MARKER_FOLLOW_STIFFNESS`
- `MARKER_FOLLOW_DAMPING`
- `INACTIF_DELAY`
- `MARKER_INIT_LENGTH`
- `MARKER_MAX_LENGTH`
- `ARENA_WIDTH_RATIO`
- `REBORD_HEIGHT_RATIO`

---

## Concepts pedagogiques couverts

- Separation claire HTML / CSS / JS.
- Communication temps reel avec WebSocket.
- Architecture relay serveur simple et lisible.
- Simulation physique 2D avec p5play/planck.
- Synchronisation d'etat entre vue jeu et vue manette.

---

## Dependances

| Package | Role |
|---|---|
| `express` | Serveur HTTP |
| `ws` | Serveur WebSocket |
| `p5.js` (CDN) | Rendu 2D + boucle de jeu |
| `planck.js` (CDN) | Moteur physique |
| `p5play` (CDN) | Sprites + integration physique |
