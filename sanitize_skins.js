const fs = require('fs');
const path = require('path');

const normalizeDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    if (file.startsWith('.')) return;
    const match = file.match(/^([A-Za-z0-9]+)-([A-Za-z0-9]+)/i);
    if (!match) return;
    
    const prefix = match[1]; // e.g. Perso3, M4
    let state = match[2]; // e.g. KO, move1, stat, rush1
    
    // Normalize state
    if (state.toLowerCase() === 'stat') state = 'Stat';
    if (state.toLowerCase() === 'ko') state = 'KO';
    
    // Some quick replacements for weird M4 things
    if (file.includes('move2.png-1')) state = 'move2';
    if (file.includes('move2.png-2')) return; // skip
    
    if (['Stat', 'move1', 'move2', 'rush1', 'rush2', 'KO'].includes(state)) {
      const targetName = `${prefix}-${state}.png`;
      if (file !== targetName) {
         try {
           fs.renameSync(path.join(dirPath, file), path.join(dirPath, targetName));
           console.log(`Renamed ${file} to ${targetName}`);
         } catch(e) {}
      }
    }
  });

  // check if any mandatory states are missing for each prefix
  const allFiles = fs.readdirSync(dirPath);
  const prefixes = new Set();
  allFiles.forEach(f => {
    const match = f.match(/^([A-Za-z0-9]+)-/);
    if(match) prefixes.add(match[1]);
  });
  
  prefixes.forEach(p => {
     const states = ['Stat', 'move1', 'move2', 'rush1', 'rush2', 'KO'];
     states.forEach(st => {
       const fname = path.join(dirPath, `${p}-${st}.png`);
       if (!fs.existsSync(fname)) {
         console.warn(`Warning: Missing ${fname}`);
         // fallback to closest
         let fallback = 'Stat';
         if (st.includes('move')) fallback = 'move1';
         if (st.includes('rush')) fallback = 'move1';
         if (st === 'KO') fallback = 'Stat';
         
         const fallbackName = path.join(dirPath, `${p}-${fallback}.png`);
         const fallbackNameM2 = path.join(dirPath, `${p}-move2.png`);
         if (fs.existsSync(fallbackName)) {
            fs.copyFileSync(fallbackName, fname);
            console.log(`Copied fallback ${fallback} over for ${fname}`);
         } else if (fs.existsSync(fallbackNameM2)) {
            fs.copyFileSync(fallbackNameM2, fname);
            console.log(`Copied fallback move2 over for ${fname}`);
         }
       }
     });
  });
};

normalizeDir('./fruit-eater/game/Assets/team1');
normalizeDir('./fruit-eater/game/Assets/team2');
