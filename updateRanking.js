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
    const line = lines.find((line) => line.includes(GITHUB_USERNAME));

    if (line) {
      const rank = line.split('|')[0].trim(); // El ranking está en la primera columna
      const readmePath = './README.md';

      // Carga tu README.md actual
      const readme = fs.readFileSync(readmePath, 'utf-8');

      // Actualiza el ranking en el README.md
      const updatedReadme = readme.replace(
        /Soy uno de los principales contribuyentes de GitHub en Cuba.*?\n/,
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
