const fetch = require('node-fetch');
const fs = require('fs');

const GITHUB_URL = 'https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown/total_contributions/cuba.md';
const GITHUB_USERNAME = 'Dayron-Glez';

(async () => {
  try {
    const response = await fetch(GITHUB_URL);
    const markdown = await response.text();

    // Busca tu posición en el archivo
    const lines = markdown.split('\n');
    
    // Encontrar el índice de la línea que contiene tu usuario
    const userLineIndex = lines.findIndex((line) => line.includes(GITHUB_USERNAME));
    
    if (userLineIndex !== -1) {
      // Retroceder hasta encontrar la línea con el número de ranking
      let rankLine = '';
      for (let i = userLineIndex; i >= 0; i--) {
        if (lines[i].trim().startsWith('|') && lines[i].includes('|')) {
          rankLine = lines[i];
          break;
        }
      }

      console.log('Línea con ranking encontrada:', rankLine);

      // Extraer el número del ranking
      const rank = rankLine.split('|')[1].trim();
      console.log('Ranking extraído:', rank);

      const readmePath = './README.md';
      const readme = fs.readFileSync(readmePath, 'utf-8');

      // Actualiza el ranking en el README.md
      const updatedReadme = readme.replace(
        /Soy uno de los (?:principales )?contribuyentes de GitHub en Cuba.*?\n/,
        `Soy uno de los contribuyentes de GitHub en Cuba según el ranking (posición: ${rank}).\n`
      );

      // Escribe los cambios en el README.md
      fs.writeFileSync(readmePath, updatedReadme);
      console.log('README.md actualizado con éxito.');
    } else {
      console.error(`No se encontró el usuario "${GITHUB_USERNAME}" en el ranking.`);
    }
  } catch (error) {
    console.error('Error al obtener el ranking:', error);
  }
})();
