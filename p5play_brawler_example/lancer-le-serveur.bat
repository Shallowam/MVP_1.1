@echo off
echo ================================================
echo  Mini-jeu p5play + WebSocket
echo ================================================
echo.
echo Installation des dependances npm...
npm install
echo.
echo Demarrage du serveur...
echo.
echo  Jeu (grand ecran) : http://localhost:3000/
echo  Manette (telephone) : http://[votre-IP]:3000/controller
echo.
node server.js
pause
