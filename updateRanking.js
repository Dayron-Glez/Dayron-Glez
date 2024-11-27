const fetch = require('node-fetch');
const fs = require('fs');

const GITHUB_URL = 'https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown/total_contributions/cuba.md';
const GITHUB_USERNAME = 'Dayron-Glez';

(async () => {
  try {
    const response = await fetch(GITHUB_URL);
    const markdown = await response.text();

    // Depuración: Imprimir las primeras líneas del contenido
    console.log('Primeras 10 líneas del contenido:');
    console.log(markdown.split('\n').slice(0, 10).join('\n'));

    // Busca tu posición en el archivo
    const lines = markdown.split('\n');
    const line = lines.find((line) => line.includes(GITHUB_USERNAME));

    // Depuración: Imprimir la línea encontrada
    console.log('Línea encontrada:', line);

    if (line) {
      // Depuración: Imprimir el proceso de extracción del ranking
      const columns = line.split('|');
      console.log('Columnas:', columns);
      
      const rank = columns[0].trim();
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
      
      // Depuración: Buscar coincidencias parciales
      const possibleMatches = lines.filter(line => 
        line.toLowerCase().includes(GITHUB_USERNAME.toLowerCase())
      );
      console.log('Posibles coincidencias encontradas:', possibleMatches);
    }
  } catch (error) {
    console.error('Error al obtener el ranking:', error);
    console.error('Error completo:', error.stack);
  }
})();
